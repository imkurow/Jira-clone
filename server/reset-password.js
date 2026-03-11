const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jira-clone.db'));

async function resetPassword() {
    const username = 'admin';
    const newPassword = 'admin123';

    // Cek semua users dulu
    console.log('\n=== ALL USERS ===');
    const allUsers = db.prepare('SELECT id, username, tenant_id, password FROM users').all();
    allUsers.forEach(u => {
        console.log(`  id=${u.id} | username=${u.username} | tenant_id=${u.tenant_id} | password_start=${u.password.substring(0,10)}`);
    });

    console.log('\n=== ALL TENANTS ===');
    const allTenants = db.prepare('SELECT * FROM tenants').all();
    console.log(allTenants.length ? allTenants : '❌ NO TENANTS FOUND');

    // Cek user target
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
        console.log(`\n❌ User "${username}" tidak ditemukan!`);
        return;
    }

    // Cek tenant
    const tenant = user.tenant_id
        ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id)
        : null;

    if (!tenant) {
        console.log(`\n❌ TENANT TIDAK ADA untuk user "${username}" (tenant_id=${user.tenant_id})`);
        console.log('   → Ini yang bikin login gagal! Harus insert tenant dulu.');

        // Auto-fix: buat tenant baru
        const result = db.prepare("INSERT INTO tenants (name) VALUES ('Default Company')").run();
        const newTenantId = result.lastInsertRowid;
        db.prepare('UPDATE users SET tenant_id = ? WHERE username = ?').run(newTenantId, username);
        console.log(`   ✅ Tenant "Default Company" dibuat dengan id=${newTenantId} dan di-assign ke user.`);
    } else {
        console.log(`\n✅ Tenant OK: ${tenant.name} (id=${tenant.id})`);
    }

    // Update password
    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE username = ?').run(hash, username);

    // Verifikasi
    const updated = db.prepare('SELECT password FROM users WHERE username = ?').get(username);
    const verify = await bcrypt.compare(newPassword, updated.password);

    console.log(`\n✅ Password untuk "${username}" diupdate ke "${newPassword}"`);
    console.log(`   Hash valid: ${verify}`);
    console.log('\n→ Sekarang coba login lagi!');
}

resetPassword().catch(console.error);
