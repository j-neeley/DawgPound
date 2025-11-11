const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');

const router = express.Router();

// Middleware to require authenticated user
function requireUser(req, res, next) {
  const userId = req.header('X-User-Id');
  if (!userId) return res.status(401).json({ error: 'X-User-Id header required (demo auth)' });
  const user = store.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'user not found' });
  if (!user.verified) return res.status(403).json({ error: 'email not verified' });
  req.user = user;
  next();
}

// Add a friend
router.post('/', requireUser, (req, res) => {
  const { friendId } = req.body;
  
  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }
  
  if (friendId === req.user.id) {
    return res.status(400).json({ error: 'cannot add yourself as friend' });
  }
  
  const friend = store.getUserById(friendId);
  if (!friend) {
    return res.status(404).json({ error: 'friend user not found' });
  }
  
  // Check if already friends
  const existingFriendship = store.getFriendship(req.user.id, friendId);
  if (existingFriendship) {
    return res.status(400).json({ error: 'already friends' });
  }
  
  // Check if either user has blocked the other
  if (store.isBlocked(req.user.id, friendId)) {
    return res.status(403).json({ error: 'cannot add friend due to block' });
  }
  
  const friendship = {
    id: uuidv4(),
    userId1: req.user.id,
    userId2: friendId,
    createdAt: new Date().toISOString()
  };
  
  store.createFriendship(friendship);
  res.status(201).json({ message: 'friend added', friendship });
});

// List friends
router.get('/', requireUser, (req, res) => {
  const friendships = store.listFriendships(req.user.id);
  
  const friends = friendships.map(f => {
    const friendId = f.userId1 === req.user.id ? f.userId2 : f.userId1;
    const friend = store.getUserById(friendId);
    if (!friend) return null;
    return {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      friendshipId: f.id,
      friendsSince: f.createdAt
    };
  }).filter(f => f !== null);
  
  res.json({ friends });
});

// Remove a friend
router.delete('/:friendId', requireUser, (req, res) => {
  const { friendId } = req.params;
  
  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }
  
  const friendship = store.getFriendship(req.user.id, friendId);
  if (!friendship) {
    return res.status(404).json({ error: 'friendship not found' });
  }
  
  store.deleteFriendship(req.user.id, friendId);
  res.json({ message: 'friend removed' });
});

// Block a user
router.post('/block', requireUser, (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  if (userId === req.user.id) {
    return res.status(400).json({ error: 'cannot block yourself' });
  }
  
  const userToBlock = store.getUserById(userId);
  if (!userToBlock) {
    return res.status(404).json({ error: 'user not found' });
  }
  
  // Check if already blocked
  const existingBlock = store.getBlock(req.user.id, userId);
  if (existingBlock) {
    return res.status(400).json({ error: 'user already blocked' });
  }
  
  // Remove friendship if exists
  const friendship = store.getFriendship(req.user.id, userId);
  if (friendship) {
    store.deleteFriendship(req.user.id, userId);
  }
  
  const block = {
    id: uuidv4(),
    blockerId: req.user.id,
    blockedId: userId,
    createdAt: new Date().toISOString()
  };
  
  store.createBlock(block);
  res.status(201).json({ message: 'user blocked', block });
});

// List blocked users
router.get('/blocked', requireUser, (req, res) => {
  const blocks = store.listBlocks(req.user.id);
  
  const blockedUsers = blocks.map(b => {
    const blockedUser = store.getUserById(b.blockedId);
    if (!blockedUser) return null;
    return {
      id: blockedUser.id,
      name: blockedUser.name,
      email: blockedUser.email,
      blockId: b.id,
      blockedAt: b.createdAt
    };
  }).filter(u => u !== null);
  
  res.json({ blocked: blockedUsers });
});

// Unblock a user
router.delete('/block/:userId', requireUser, (req, res) => {
  const { userId } = req.params;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const block = store.getBlock(req.user.id, userId);
  if (!block) {
    return res.status(404).json({ error: 'block not found' });
  }
  
  store.deleteBlock(req.user.id, userId);
  res.json({ message: 'user unblocked' });
});

module.exports = router;
