const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function createUser(user) {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
  return user;
}

function updateUser(id, patch) {
  const db = readDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) return null;
  Object.assign(u, patch);
  writeDb(db);
  return u;
}

function getUserById(id) {
  const db = readDb();
  return db.users.find((x) => x.id === id) || null;
}

function getUserByVerificationToken(token) {
  const db = readDb();
  return db.users.find((x) => x.verificationToken === token) || null;
}

function listUsers() {
  const db = readDb();
  return db.users;
}

module.exports = { createUser, updateUser, getUserById, getUserByVerificationToken, listUsers };
