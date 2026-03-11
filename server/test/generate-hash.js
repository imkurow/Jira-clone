// Jalankan: node generate-hash.js
const bcrypt = require('bcrypt');

async function main() {
    const password = 'password_lo_disini'; // ganti ini
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash:', hash);
    console.log('\nJalankan query ini di sqlite3:');
    console.log(`UPDATE users SET password = '${hash}' WHERE username = 'admin';`);
}

main();
