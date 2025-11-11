const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], groups: [], threads: [], replies: [] }, null, 2));
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

// === Groups functions ===

function createGroup(group) {
  const db = readDb();
  if (!db.groups) db.groups = [];
  db.groups.push(group);
  writeDb(db);
  return group;
}

function updateGroup(id, patch) {
  const db = readDb();
  if (!db.groups) db.groups = [];
  const g = db.groups.find((x) => x.id === id);
  if (!g) return null;
  Object.assign(g, patch);
  writeDb(db);
  return g;
}

function getGroupById(id) {
  const db = readDb();
  if (!db.groups) db.groups = [];
  return db.groups.find((x) => x.id === id) || null;
}

function listGroups() {
  const db = readDb();
  if (!db.groups) db.groups = [];
  return db.groups;
}

function deleteGroup(id) {
  const db = readDb();
  if (!db.groups) db.groups = [];
  const idx = db.groups.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db.groups.splice(idx, 1);
  writeDb(db);
  return true;
}

// === Thread functions ===

function createThread(thread) {
  const db = readDb();
  if (!db.threads) db.threads = [];
  db.threads.push(thread);
  writeDb(db);
  return thread;
}

function getThreadById(id) {
  const db = readDb();
  if (!db.threads) db.threads = [];
  return db.threads.find((x) => x.id === id) || null;
}

function listThreadsByGroup(groupId) {
  const db = readDb();
  if (!db.threads) db.threads = [];
  return db.threads.filter((x) => x.groupId === groupId);
}

function updateThread(id, patch) {
  const db = readDb();
  if (!db.threads) db.threads = [];
  const t = db.threads.find((x) => x.id === id);
  if (!t) return null;
  Object.assign(t, patch);
  writeDb(db);
  return t;
}

// === Reply functions ===

function createReply(reply) {
  const db = readDb();
  if (!db.replies) db.replies = [];
  db.replies.push(reply);
  writeDb(db);
  return reply;
}

function listRepliesByThread(threadId) {
  const db = readDb();
  if (!db.replies) db.replies = [];
  return db.replies.filter((x) => x.threadId === threadId);
}

function deleteThread(id) {
  const db = readDb();
  if (!db.threads) db.threads = [];
  const idx = db.threads.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db.threads.splice(idx, 1);
  writeDb(db);
  return true;
}

function deleteReply(id) {
  const db = readDb();
  if (!db.replies) db.replies = [];
  const idx = db.replies.findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db.replies.splice(idx, 1);
  writeDb(db);
  return true;
}

function getReplyById(id) {
  const db = readDb();
  if (!db.replies) db.replies = [];
  return db.replies.find((x) => x.id === id) || null;
}

module.exports = { 
  createUser, 
  updateUser, 
  getUserById, 
  getUserByVerificationToken, 
  listUsers,
  createGroup,
  updateGroup,
  getGroupById,
  listGroups,
  deleteGroup,
  createThread,
  getThreadById,
  listThreadsByGroup,
  updateThread,
  deleteThread,
  createReply,
  listRepliesByThread,
  getReplyById,
  deleteReply
};
