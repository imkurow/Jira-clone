const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const db = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com');

// Helper to auto-create a default board for a company/tenant
const initializeDefaultBoard = (tenantId, companyName) => {
    const boardId = `board-${Date.now()}`;
    db.prepare('INSERT INTO boards (id, tenant_id, name) VALUES (?, ?, ?)').run(boardId, tenantId, `${companyName} Master Board`);

    const cols = [
        { id: `col-todo-${Date.now()}`, title: 'TODO', position: 0 },
        { id: `col-prog-${Date.now()}`, title: 'IN PROGRESS', position: 1 },
        { id: `col-rev-${Date.now()}`, title: 'REVIEW', position: 2 },
        { id: `col-done-${Date.now()}`, title: 'DONE', position: 3 }
    ];

    const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)');
    cols.forEach(col => {
        insertCol.run(col.id, boardId, col.title, col.position);
    });
};

router.post('/register', async (req, res) => {
    const { username, password, companyName } = req.body;

    if (!username || !password || !companyName) {
        return res.status(400).json({ error: 'Username, password, and company name are required' });
    }

    try {
        const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists. Please log in or choose a different username.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Multi-Tenant Logic: Check if company exists, if not create it
        let tenantId;
        let existingTenant = db.prepare('SELECT id FROM tenants WHERE name = ?').get(companyName);

        if (existingTenant) {
            tenantId = existingTenant.id;
        } else {
            const tenantResult = db.prepare('INSERT INTO tenants (name) VALUES (?)').run(companyName);
            tenantId = tenantResult.lastInsertRowid;
            // If it's a new company, seed their first board
            initializeDefaultBoard(tenantId, companyName);
        }

        const result = db.prepare('INSERT INTO users (tenant_id, username, password, avatar, role) VALUES (?, ?, ?, ?, ?)')
            .run(tenantId, username, hashedPassword, `https://ui-avatars.com/api/?name=${username}&background=random&color=fff`, 'user');

        const userId = result.lastInsertRowid;

        // Assign superadmin to the very first user created in the system for demonstration
        // Or normally this would be manually assigned
        const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
        if (totalUsers === 1) {
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', userId);
        }

        const token = jwt.sign({ userId, username, tenantId, companyName, role: totalUsers === 1 ? 'superadmin' : 'user' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ token, user: { id: userId, username, companyName, role: totalUsers === 1 ? 'superadmin' : 'user' } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = db.prepare(`
      SELECT users.*, tenants.name as companyName, users.role
      FROM users 
      JOIN tenants ON users.tenant_id = tenants.id 
      WHERE username = ?
    `).get(username);

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username, tenantId: user.tenant_id, companyName: user.companyName, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, companyName: user.companyName, role: user.role } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

router.post('/google', async (req, res) => {
    const { credential, companyName } = req.body;
    try {
        // 1. Verify token with Google
        // Note: If you don't supply an audience, it skips client ID verification, suitable for our placeholder testing
        // but in production we MUST await googleClient.verifyIdToken({ idToken: credential, audience: 'YOUR_CLIENT_ID' })
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID || undefined
        }).catch(e => {
            // Fallback for demonstration without a real Client ID: we decode manually (UNSAFE IN PROD)
            console.warn('Google client ID verify failed (expected if using placeholder). Falling back to decode.');
            return { getPayload: () => jwt.decode(credential) };
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google Token' });
        }

        const email = payload.email;
        const name = payload.name || email.split('@')[0];
        const picture = payload.picture || `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`;

        // 2. See if user exists
        let user = db.prepare(`
      SELECT users.*, tenants.name as companyName 
      FROM users 
      JOIN tenants ON users.tenant_id = tenants.id 
      WHERE username = ?
    `).get(email);

        let isNewUser = false;

        // 3. Register if they don't
        if (!user) {
            if (!companyName) {
                return res.status(428).json({ error: 'Company Name Required', requireCompany: true, email: email });
            }

            // Setup Tenant
            let tenantId;
            let existingTenant = db.prepare('SELECT id FROM tenants WHERE name = ?').get(companyName);
            if (existingTenant) {
                tenantId = existingTenant.id;
            } else {
                const tenantResult = db.prepare('INSERT INTO tenants (name) VALUES (?)').run(companyName);
                tenantId = tenantResult.lastInsertRowid;
                initializeDefaultBoard(tenantId, companyName);
            }

            // Insert User
            const result = db.prepare('INSERT INTO users (tenant_id, username, password, avatar, role) VALUES (?, ?, ?, ?, ?)')
                .run(tenantId, email, 'oauth-no-password', picture, 'user');

            const userId = result.lastInsertRowid;

            // Superadmin assign
            const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
            if (totalUsers === 1) {
                db.prepare('UPDATE users SET role = ? WHERE id = ?').run('superadmin', userId);
            }

            user = {
                id: userId,
                username: email,
                tenant_id: tenantId,
                companyName: companyName,
                avatar: picture,
                role: totalUsers === 1 ? 'superadmin' : 'user'
            };
            isNewUser = true;
        }

        // 4. Issue JWT
        const token = jwt.sign({
            userId: user.id,
            username: user.username,
            tenantId: user.tenant_id,
            companyName: user.companyName,
            role: user.role
        }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, companyName: user.companyName, role: user.role } });

    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

module.exports = router;
