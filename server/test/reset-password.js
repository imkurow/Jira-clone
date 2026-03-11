// Jalankan: node reset-password.js
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'server/jira-clone.db'));

async function resetPassword() {
    const username = 'admin';       // ganti sesuai username lo
    const newPassword = 'admin123'; // ganti sesuai password yang mau lo pakai

    const hash = await bcrypt.hash(newPassword, 10);
    
    // Cek user ada tidak
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
        console.log('❌ User tidak ditemukan!');
        console.log('Users yang ada:', db.prepare('SELECT id, username, tenant_id FROM users').all());
        return;
    }

    // Update hash langsung lewat script (no copy-paste error)
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, username);
    
    // Verifikasi
    const updated = db.prepare('SELECT password FROM users WHERE username = ?').get(username);
    const verify = await bcrypt.compare(newPassword, updated.password);
    
    console.log('✅ Password updated!');
    console.log('Hash valid:', verify); // harus true
    
    // Cek tenant juga
    if (user.tenant_id) {
        const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id);
        console.log('Tenant:', tenant ? `✅ ${tenant.name}` : '❌ TIDAK ADA TENANT! (ini masalah kedua)');
    } else {
        console.log('❌ tenant_id NULL! User tidak punya tenant — ini bikin login gagal juga!');
    }
}

resetPassword().catch(console.error);
