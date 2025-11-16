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

// Send a friend request
router.post('/requests', requireUser, (req, res) => {
  const { userId: friendId } = req.body;
  
  if (!friendId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  if (friendId === req.user.id) {
    return res.status(400).json({ error: 'cannot send friend request to yourself' });
  }
  
  const friend = store.getUserById(friendId);
  if (!friend) {
    return res.status(404).json({ error: 'user not found' });
  }
  
  // Check if already friends
  const existingFriendship = store.getFriendship(req.user.id, friendId);
  if (existingFriendship) {
    return res.status(400).json({ error: 'already friends' });
  }
  
  // Check if either user has blocked the other
  if (store.isBlocked(req.user.id, friendId)) {
    return res.status(403).json({ error: 'cannot send friend request due to block' });
  }
  
  // Check if there's already a pending request
  const existingRequest = store.findPendingFriendRequest(req.user.id, friendId);
  if (existingRequest) {
    return res.status(400).json({ error: 'friend request already pending' });
  }
  
  const friendRequest = {
    id: uuidv4(),
    fromUserId: req.user.id,
    toUserId: friendId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  store.createFriendRequest(friendRequest);
  res.status(201).json({ message: 'friend request sent', request: friendRequest });
});

// List incoming friend requests
router.get('/requests/incoming', requireUser, (req, res) => {
  const requests = store.listIncomingFriendRequests(req.user.id);
  
  const enrichedRequests = requests.map(r => {
    const fromUser = store.getUserById(r.fromUserId);
    if (!fromUser) return null;
    return {
      id: r.id,
      fromUser: {
        id: fromUser.id,
        name: fromUser.name,
        email: fromUser.email
      },
      status: r.status,
      createdAt: r.createdAt
    };
  }).filter(r => r !== null);
  
  res.json({ requests: enrichedRequests });
});

// List outgoing friend requests
router.get('/requests/outgoing', requireUser, (req, res) => {
  const requests = store.listOutgoingFriendRequests(req.user.id);
  
  const enrichedRequests = requests.map(r => {
    const toUser = store.getUserById(r.toUserId);
    if (!toUser) return null;
    return {
      id: r.id,
      toUser: {
        id: toUser.id,
        name: toUser.name,
        email: toUser.email
      },
      status: r.status,
      createdAt: r.createdAt
    };
  }).filter(r => r !== null);
  
  res.json({ requests: enrichedRequests });
});

// Accept a friend request
router.post('/requests/:requestId/accept', requireUser, (req, res) => {
  const { requestId } = req.params;
  
  const request = store.getFriendRequest(requestId);
  if (!request) {
    return res.status(404).json({ error: 'friend request not found' });
  }
  
  // Verify this is the recipient
  if (request.toUserId !== req.user.id) {
    return res.status(403).json({ error: 'not authorized to accept this request' });
  }
  
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'request is not pending' });
  }
  
  // Check if either user has blocked the other (could have happened after request was sent)
  if (store.isBlocked(request.fromUserId, request.toUserId)) {
    return res.status(403).json({ error: 'cannot accept request due to block' });
  }
  
  // Create friendship
  const friendship = {
    id: uuidv4(),
    userId1: request.fromUserId,
    userId2: request.toUserId,
    createdAt: new Date().toISOString()
  };
  
  store.createFriendship(friendship);
  
  // Update request status
  store.updateFriendRequest(requestId, { status: 'accepted' });
  
  res.json({ message: 'friend request accepted', friendship });
});

// Decline a friend request
router.post('/requests/:requestId/decline', requireUser, (req, res) => {
  const { requestId } = req.params;
  
  const request = store.getFriendRequest(requestId);
  if (!request) {
    return res.status(404).json({ error: 'friend request not found' });
  }
  
  // Verify this is the recipient
  if (request.toUserId !== req.user.id) {
    return res.status(403).json({ error: 'not authorized to decline this request' });
  }
  
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'request is not pending' });
  }
  
  // Update request status
  store.updateFriendRequest(requestId, { status: 'declined' });
  
  res.json({ message: 'friend request declined' });
});

// Cancel an outgoing friend request
router.delete('/requests/:requestId', requireUser, (req, res) => {
  const { requestId } = req.params;
  
  const request = store.getFriendRequest(requestId);
  if (!request) {
    return res.status(404).json({ error: 'friend request not found' });
  }
  
  // Verify this is the sender
  if (request.fromUserId !== req.user.id) {
    return res.status(403).json({ error: 'not authorized to cancel this request' });
  }
  
  if (request.status !== 'pending') {
    return res.status(400).json({ error: 'request is not pending' });
  }
  
  store.deleteFriendRequest(requestId);
  
  res.json({ message: 'friend request cancelled' });
});

// Add a friend (kept for backward compatibility - creates instant friendship)
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
  
  // Cancel any pending friend requests between these users
  store.cancelPendingFriendRequests(req.user.id, userId);
  
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
