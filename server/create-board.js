const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'jira-clone.db'));

// Cek kondisi sekarang
console.log('\n=== TENANTS ===');
console.log(db.prepare('SELECT * FROM tenants').all());

console.log('\n=== BOARDS ===');
const boards = db.prepare('SELECT * FROM boards').all();
console.log(boards.length ? boards : '❌ NO BOARDS FOUND');

// Cari tenant Alfasiber
const tenant = db.prepare("SELECT * FROM tenants WHERE name = 'Alfasiber'").get();
if (!tenant) {
    console.log('❌ Tenant Alfasiber tidak ada!');
    process.exit(1);
}

// Cek apakah sudah ada board
const existingBoard = db.prepare('SELECT * FROM boards WHERE tenant_id = ?').get(tenant.id);
if (existingBoard) {
    console.log('\n✅ Board sudah ada:', existingBoard);
    console.log('\n=== COLUMNS ===');
    console.log(db.prepare('SELECT * FROM columns WHERE board_id = ?').all(existingBoard.id));
    process.exit(0);
}

// Buat board baru
const boardId = `board-${Date.now()}`;
db.prepare('INSERT INTO boards (id, tenant_id, name) VALUES (?, ?, ?)').run(boardId, tenant.id, 'Alfasiber Master Board');
console.log(`\n✅ Board dibuat: ${boardId}`);

// Buat 4 kolom default
const now = Date.now();
const cols = [
    { id: `col-todo-${now}`,     title: 'TODO',        position: 0 },
    { id: `col-prog-${now + 1}`, title: 'IN PROGRESS', position: 1 },
    { id: `col-rev-${now + 2}`,  title: 'REVIEW',      position: 2 },
    { id: `col-done-${now + 3}`, title: 'DONE',        position: 3 },
];

const insertCol = db.prepare('INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)');
cols.forEach(col => {
    insertCol.run(col.id, boardId, col.title, col.position);
    console.log(`  ✅ Column: ${col.title}`);
});

console.log('\n✅ Board dan columns berhasil dibuat!');
console.log('→ Refresh browser lo sekarang.');
