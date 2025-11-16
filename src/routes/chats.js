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

// Helper to check if all participants are friends
function areAllFriends(userId, participantIds) {
  for (const participantId of participantIds) {
    if (participantId === userId) continue;
    const friendship = store.getFriendship(userId, participantId);
    if (!friendship) return false;
  }
  return true;
}

// Helper to check if any participant is blocked
function hasBlockedParticipant(userId, participantIds) {
  for (const participantId of participantIds) {
    if (participantId === userId) continue;
    if (store.isBlocked(userId, participantId)) return true;
  }
  return false;
}

// Create a private group chat
router.post('/', requireUser, (req, res) => {
  let { name, participantIds, avatar } = req.body;
  
  if (!participantIds || !Array.isArray(participantIds)) {
    return res.status(400).json({ error: 'participantIds array is required' });
  }
  
  // Add the creator to participants if not already included
  if (!participantIds.includes(req.user.id)) {
    participantIds.push(req.user.id);
  }
  
  // Remove duplicates
  participantIds = [...new Set(participantIds)];
  
  // Require minimum 2 participants
  if (participantIds.length < 2) {
    return res.status(400).json({ error: 'minimum 2 participants required' });
  }
  
  // Validate all participants exist
  for (const participantId of participantIds) {
    const user = store.getUserById(participantId);
    if (!user) {
      return res.status(404).json({ error: `user ${participantId} not found` });
    }
  }
  
  // Check that no participant is blocked (check this first)
  const otherParticipants = participantIds.filter(id => id !== req.user.id);
  if (hasBlockedParticipant(req.user.id, otherParticipants)) {
    return res.status(403).json({ error: 'cannot create chat with blocked users' });
  }
  
  // Check that all participants (excluding creator) are friends with creator
  if (!areAllFriends(req.user.id, otherParticipants)) {
    return res.status(403).json({ error: 'can only create chat with friends' });
  }
  
  const chat = {
    id: uuidv4(),
    name: name || null,
    avatar: avatar || null,
    participants: participantIds,
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    mutedBy: [] // Track which users have muted this chat
  };
  
  store.createPrivateChat(chat);
  res.status(201).json({ message: 'private chat created', chat });
});

// List user's private chats
router.get('/', requireUser, (req, res) => {
  const chats = store.listPrivateChatsForUser(req.user.id);
  
  // Enrich with participant info
  const chatsWithInfo = chats.map(chat => {
    const participants = chat.participants.map(id => {
      const user = store.getUserById(id);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email
      };
    }).filter(p => p !== null);
    
    return {
      ...chat,
      participants,
      isMuted: chat.mutedBy && chat.mutedBy.includes(req.user.id)
    };
  });
  
  res.json({ chats: chatsWithInfo });
});

// Get a specific chat
router.get('/:chatId', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  // Get participant info
  const participants = chat.participants.map(id => {
    const user = store.getUserById(id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }).filter(p => p !== null);
  
  res.json({
    ...chat,
    participants,
    isMuted: chat.mutedBy && chat.mutedBy.includes(req.user.id)
  });
});

// Update chat (rename, change avatar)
router.patch('/:chatId', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const { name, avatar } = req.body;
  const updates = {};
  
  if (name !== undefined) {
    if (typeof name !== 'string' || (name.length > 0 && name.trim().length === 0)) {
      return res.status(400).json({ error: 'invalid name' });
    }
    if (name.length > 100) {
      return res.status(400).json({ error: 'name must be 100 characters or less' });
    }
    updates.name = name.trim() || null;
  }
  
  if (avatar !== undefined) {
    if (typeof avatar !== 'string') {
      return res.status(400).json({ error: 'invalid avatar' });
    }
    if (avatar.length > 500) {
      return res.status(400).json({ error: 'avatar URL must be 500 characters or less' });
    }
    updates.avatar = avatar || null;
  }
  
  const updatedChat = store.updatePrivateChat(chat.id, updates);
  res.json({ message: 'chat updated', chat: updatedChat });
});

// Add participant to chat
router.post('/:chatId/participants', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const userToAdd = store.getUserById(userId);
  if (!userToAdd) {
    return res.status(404).json({ error: 'user not found' });
  }
  
  // Check if already a participant
  if (chat.participants.includes(userId)) {
    return res.status(400).json({ error: 'user already a participant' });
  }
  
  // Check that the user is not blocked (check this first)
  if (store.isBlocked(req.user.id, userId)) {
    return res.status(403).json({ error: 'cannot add blocked user' });
  }
  
  // Check that the user being added is friends with the requester
  const friendship = store.getFriendship(req.user.id, userId);
  if (!friendship) {
    return res.status(403).json({ error: 'can only add friends to chat' });
  }
  
  // Add to participants
  chat.participants.push(userId);
  const updatedChat = store.updatePrivateChat(chat.id, { participants: chat.participants });
  
  res.json({ message: 'participant added', chat: updatedChat });
});

// Remove participant from chat
router.delete('/:chatId/participants/:userId', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const { userId } = req.params;
  
  // Check if user to remove is a participant
  if (!chat.participants.includes(userId)) {
    return res.status(404).json({ error: 'user not a participant' });
  }
  
  // Remove from participants
  chat.participants = chat.participants.filter(id => id !== userId);
  
  // If no participants left, delete the chat
  if (chat.participants.length === 0) {
    store.deletePrivateChat(chat.id);
    return res.json({ message: 'chat deleted (no participants remaining)' });
  }
  
  const updatedChat = store.updatePrivateChat(chat.id, { participants: chat.participants });
  res.json({ message: 'participant removed', chat: updatedChat });
});

// Mute/unmute chat
router.post('/:chatId/mute', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const { mute } = req.body;
  
  if (typeof mute !== 'boolean') {
    return res.status(400).json({ error: 'mute must be a boolean' });
  }
  
  if (!chat.mutedBy) chat.mutedBy = [];
  
  if (mute) {
    if (!chat.mutedBy.includes(req.user.id)) {
      chat.mutedBy.push(req.user.id);
    }
  } else {
    chat.mutedBy = chat.mutedBy.filter(id => id !== req.user.id);
  }
  
  const updatedChat = store.updatePrivateChat(chat.id, { mutedBy: chat.mutedBy });
  res.json({ message: mute ? 'chat muted' : 'chat unmuted', chat: updatedChat });
});

// Get messages in a chat
router.get('/:chatId/messages', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const limit = parseInt(req.query.limit) || 100;
  const messages = store.listMessagesByChat(chat.id, limit);
  
  // Enrich with author info
  const messagesWithAuthor = messages.map(m => {
    const author = store.getUserById(m.authorId);
    return {
      ...m,
      authorName: author ? author.name : 'Unknown'
    };
  });
  
  res.json({ messages: messagesWithAuthor });
});

// Send a message (REST endpoint - WebSocket is primary)
router.post('/:chatId/messages', requireUser, (req, res) => {
  const chat = store.getPrivateChatById(req.params.chatId);
  
  if (!chat) {
    return res.status(404).json({ error: 'chat not found' });
  }
  
  // Check user is a participant
  if (!chat.participants || !chat.participants.includes(req.user.id)) {
    return res.status(403).json({ error: 'not a participant of this chat' });
  }
  
  const { content } = req.body;
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  
  if (content.trim().length > 10000) {
    return res.status(400).json({ error: 'content must be 10000 characters or less' });
  }
  
  const message = {
    id: uuidv4(),
    chatId: chat.id,
    authorId: req.user.id,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };
  
  store.createMessage(message);
  
  res.status(201).json({ message: 'message sent', data: message });
});

module.exports = router;
