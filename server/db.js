const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'jira-clone.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize Multi-Tenant Database Schema
const initDb = () => {

  // Tenants (Companies) Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT,
      role TEXT DEFAULT 'user',
      avatar TEXT,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id)
    );
  `);

  // Boards Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY,
      tenant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(tenant_id) REFERENCES tenants(id)
    );
  `);

  // Columns Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS columns (
      id TEXT PRIMARY KEY,
      board_id TEXT NOT NULL,
      title TEXT NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY(board_id) REFERENCES boards(id)
    );
  `);

  // Tasks Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      column_id TEXT NOT NULL,
      content TEXT NOT NULL,
      description TEXT,
      priority TEXT NOT NULL,
      type TEXT NOT NULL,
      assignee TEXT,
      position INTEGER NOT NULL,
      FOREIGN KEY(column_id) REFERENCES columns(id)
    );
  `);
};

initDb();

module.exports = db;
