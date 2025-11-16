const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ 
      users: [], 
      groups: [], 
      threads: [], 
      replies: [],
      friendships: [],
      friendRequests: [],
      blocks: [],
      privateChats: [],
      messages: []
    }, null, 2));
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

function getBlock(blockerId, blockedId) {
  const db = readDb();
  if (!db.blocks) db.blocks = [];
  return db.blocks.find(b => b.blockerId === blockerId && b.blockedId === blockedId) || null;
}

function listBlocks(userId) {
  const db = readDb();
  if (!db.blocks) db.blocks = [];
  return db.blocks.filter(b => b.blockerId === userId);
}

function isBlocked(userId1, userId2) {
  const db = readDb();
  if (!db.blocks) db.blocks = [];
  // Check if either user has blocked the other
  return db.blocks.some(b => 
    (b.blockerId === userId1 && b.blockedId === userId2) ||
    (b.blockerId === userId2 && b.blockedId === userId1)
  );
}

function createBlock(block) {
  const db = readDb();
  if (!db.blocks) db.blocks = [];
  db.blocks.push(block);
  writeDb(db);
  return block;
}

function deleteBlock(blockerId, blockedId) {
  const db = readDb();
  if (!db.blocks) db.blocks = [];
  const idx = db.blocks.findIndex(b => b.blockerId === blockerId && b.blockedId === blockedId);
  if (idx === -1) return false;
  db.blocks.splice(idx, 1);
  writeDb(db);
  return true;
}

// === Friendship functions ===

function createFriendship(friendship) {
  const db = readDb();
  if (!db.friendships) db.friendships = [];
  db.friendships.push(friendship);
  writeDb(db);
  return friendship;
}

function getFriendship(userId1, userId2) {
  const db = readDb();
  if (!db.friendships) db.friendships = [];
  return db.friendships.find(f => 
    (f.userId1 === userId1 && f.userId2 === userId2) ||
    (f.userId1 === userId2 && f.userId2 === userId1)
  ) || null;
}

function deleteFriendship(userId1, userId2) {
  const db = readDb();
  if (!db.friendships) db.friendships = [];
  const idx = db.friendships.findIndex(f => 
    (f.userId1 === userId1 && f.userId2 === userId2) ||
    (f.userId1 === userId2 && f.userId2 === userId1)
  );
  if (idx === -1) return false;
  db.friendships.splice(idx, 1);
  writeDb(db);
  return true;
}

function listFriendships(userId) {
  const db = readDb();
  if (!db.friendships) db.friendships = [];
  return db.friendships.filter(f => f.userId1 === userId || f.userId2 === userId);
}

// === Private Chat functions ===

function createPrivateChat(chat) {
  const db = readDb();
  if (!db.privateChats) db.privateChats = [];
  db.privateChats.push(chat);
  writeDb(db);
  return chat;
}

function updatePrivateChat(id, patch) {
  const db = readDb();
  if (!db.privateChats) db.privateChats = [];
  const chat = db.privateChats.find(c => c.id === id);
  if (!chat) return null;
  Object.assign(chat, patch);
  writeDb(db);
  return chat;
}

function getPrivateChatById(id) {
  const db = readDb();
  if (!db.privateChats) db.privateChats = [];
  return db.privateChats.find(c => c.id === id) || null;
}

function listPrivateChatsForUser(userId) {
  const db = readDb();
  if (!db.privateChats) db.privateChats = [];
  return db.privateChats.filter(c => c.participants && c.participants.includes(userId));
}

function deletePrivateChat(id) {
  const db = readDb();
  if (!db.privateChats) db.privateChats = [];
  const idx = db.privateChats.findIndex(c => c.id === id);
  if (idx === -1) return false;
  db.privateChats.splice(idx, 1);
  writeDb(db);
  return true;
}

// === Message functions ===

function createMessage(message) {
  const db = readDb();
  if (!db.messages) db.messages = [];
  db.messages.push(message);
  writeDb(db);
  return message;
}

function listMessagesByChat(chatId, limit = 100) {
  const db = readDb();
  if (!db.messages) db.messages = [];
  const messages = db.messages.filter(m => m.chatId === chatId);
  // Return most recent messages first
  return messages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}

function deleteMessage(id) {
  const db = readDb();
  if (!db.messages) db.messages = [];
  const idx = db.messages.findIndex(m => m.id === id);
  if (idx === -1) return false;
  db.messages.splice(idx, 1);
  writeDb(db);
  return true;
}

// === Friend Request functions ===

function createFriendRequest(request) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  db.friendRequests.push(request);
  writeDb(db);
  return request;
}

function getFriendRequest(id) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  return db.friendRequests.find(r => r.id === id) || null;
}

function findPendingFriendRequest(fromUserId, toUserId) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  // Check both directions for pending requests
  return db.friendRequests.find(r => 
    r.status === 'pending' &&
    ((r.fromUserId === fromUserId && r.toUserId === toUserId) ||
     (r.fromUserId === toUserId && r.toUserId === fromUserId))
  ) || null;
}

function updateFriendRequest(id, patch) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  const request = db.friendRequests.find(r => r.id === id);
  if (!request) return null;
  Object.assign(request, patch);
  writeDb(db);
  return request;
}

function listIncomingFriendRequests(userId) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  return db.friendRequests.filter(r => r.toUserId === userId && r.status === 'pending');
}

function listOutgoingFriendRequests(userId) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  return db.friendRequests.filter(r => r.fromUserId === userId && r.status === 'pending');
}

function deleteFriendRequest(id) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  const idx = db.friendRequests.findIndex(r => r.id === id);
  if (idx === -1) return false;
  db.friendRequests.splice(idx, 1);
  writeDb(db);
  return true;
}

function cancelPendingFriendRequests(userId1, userId2) {
  const db = readDb();
  if (!db.friendRequests) db.friendRequests = [];
  // Cancel any pending requests between these two users
  db.friendRequests = db.friendRequests.filter(r => 
    !(r.status === 'pending' &&
      ((r.fromUserId === userId1 && r.toUserId === userId2) ||
       (r.fromUserId === userId2 && r.toUserId === userId1)))
  );
  writeDb(db);
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
  deleteReply,
  createFriendship,
  getFriendship,
  deleteFriendship,
  listFriendships,
  createFriendRequest,
  getFriendRequest,
  findPendingFriendRequest,
  updateFriendRequest,
  listIncomingFriendRequests,
  listOutgoingFriendRequests,
  deleteFriendRequest,
  cancelPendingFriendRequests,
  createBlock,
  deleteBlock,
  getBlock,
  listBlocks,
  isBlocked,
  createPrivateChat,
  updatePrivateChat,
  getPrivateChatById,
  listPrivateChatsForUser,
  deletePrivateChat,
  createMessage,
  listMessagesByChat,
  deleteMessage
};
