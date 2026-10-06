import fs from 'fs';
import path from 'path';
import { hashPassword } from './password';

// Simple JSON-file database (data/db.json). Swap this file for MongoDB/MySQL later
// without touching the API routes: keep readDB / writeDB / nextId.
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function seed() {
  return {
    counters: { task: 0, employee: 1, party: 0, notification: 0, invoice: 0 },
    employees: [
      {
        id: 1,
        employeeId: 'EMP001',
        name: 'Admin',
        email: 'admin@taskflow.com',
        password: hashPassword('admin123'),
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    ],
    parties: [],
    tasks: [],
    notifications: [],
    sessions: [],
  };
}

export function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const db = seed();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

export function writeDB(db) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

export function nextId(db, key) {
  db.counters[key] = (db.counters[key] || 0) + 1;
  return db.counters[key];
}
