const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');
const websocket = require('../websocket');

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

// Middleware to require admin or developer role
function requireAdminOrDeveloper(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (req.user.role !== 'admin' && req.user.role !== 'developer') {
    return res.status(403).json({ error: 'admin or developer role required' });
  }
  next();
}

// Middleware to check if user is a moderator or admin of a group
function checkGroupModerator(req, res, next) {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  
  const isModerator = group.moderators && group.moderators.includes(req.user.id);
  const isCreator = group.createdBy === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isModerator && !isCreator && !isAdmin) {
    return res.status(403).json({ error: 'moderator permissions required' });
  }
  
  req.group = group;
  next();
}

// Create a new public group (admin/developer only)
router.post('/', requireUser, requireAdminOrDeveloper, (req, res) => {
  const { name, description, category, tags } = req.body;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ error: 'name is required' });
  }
  
  // Sanitize name length
  if (name.trim().length > 100) {
    return res.status(400).json({ error: 'name must be 100 characters or less' });
  }
  
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'category is required (class_year, major, interests_activities)' });
  }
  
  const validCategories = ['class_year', 'major', 'interests_activities'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'category must be one of: class_year, major, interests_activities' });
  }
  
  const group = {
    id: uuidv4(),
    name: name.trim(),
    description: description ? description.substring(0, 500) : '', // Limit description length
    category,
    tags: Array.isArray(tags) ? tags : [],
    createdBy: req.user.id,
    createdAt: new Date().toISOString(),
    members: [req.user.id], // creator is auto-member
    moderators: [], // array of moderator user IDs
    isPublic: true
  };
  
  store.createGroup(group);
  res.status(201).json({ message: 'group created', group });
});

// List/search public groups
router.get('/', requireUser, (req, res) => {
  const { search, category, tag } = req.query;
  let groups = store.listGroups().filter(g => g.isPublic);
  
  if (search) {
    const searchLower = search.toLowerCase();
    groups = groups.filter(g => 
      g.name.toLowerCase().includes(searchLower) || 
      (g.description && g.description.toLowerCase().includes(searchLower))
    );
  }
  
  if (category) {
    groups = groups.filter(g => g.category === category);
  }
  
  if (tag) {
    groups = groups.filter(g => g.tags && g.tags.includes(tag));
  }
  
  // Return groups with member count
  const groupsWithStats = groups.map(g => ({
    ...g,
    memberCount: g.members ? g.members.length : 0,
    isMember: g.members ? g.members.includes(req.user.id) : false
  }));
  
  res.json({ groups: groupsWithStats });
});

// Get recommended groups for user
router.get('/recommendations', requireUser, (req, res) => {
  const user = req.user;
  const onboarding = user.onboarding;
  
  if (!onboarding) {
    return res.json({ groups: [] });
  }
  
  const allGroups = store.listGroups().filter(g => g.isPublic);
  const userMajors = onboarding.majors || [];
  const userInterests = onboarding.interests_hobbies || [];
  const userYear = onboarding.year_of_study;
  
  // Score each group by relevance
  const scoredGroups = allGroups.map(g => {
    let score = 0;
    
    // Skip if already a member
    if (g.members && g.members.includes(user.id)) {
      return { group: g, score: -1 };
    }
    
    // Match by category and tags
    if (g.category === 'major' && g.tags) {
      const matchingMajors = g.tags.filter(tag => userMajors.includes(tag));
      score += matchingMajors.length * 10;
    }
    
    if (g.category === 'interests_activities' && g.tags) {
      const matchingInterests = g.tags.filter(tag => userInterests.includes(tag));
      score += matchingInterests.length * 8;
    }
    
    if (g.category === 'class_year' && g.tags && userYear) {
      if (g.tags.includes(userYear)) {
        score += 15;
      }
    }
    
    return { group: g, score };
  });
  
  // Filter out non-matching groups and sort by score
  const recommendations = scoredGroups
    .filter(sg => sg.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(sg => ({
      ...sg.group,
      memberCount: sg.group.members ? sg.group.members.length : 0,
      isMember: false
    }));
  
  res.json({ groups: recommendations });
});

// Get group details
router.get('/:id', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  res.json({
    ...group,
    memberCount: group.members ? group.members.length : 0,
    isMember: group.members ? group.members.includes(req.user.id) : false
  });
});

// Join a group
router.post('/:id/join', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  if (!group.members) group.members = [];
  
  if (group.members.includes(req.user.id)) {
    return res.status(400).json({ error: 'already a member' });
  }
  
  group.members.push(req.user.id);
  store.updateGroup(group.id, { members: group.members });
  
  res.json({ message: 'joined group', groupId: group.id });
});

// Leave a group
router.post('/:id/leave', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  
  if (!group.members || !group.members.includes(req.user.id)) {
    return res.status(400).json({ error: 'not a member' });
  }
  
  group.members = group.members.filter(m => m !== req.user.id);
  store.updateGroup(group.id, { members: group.members });
  
  res.json({ message: 'left group', groupId: group.id });
});

// Get group members
router.get('/:id/members', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  const memberIds = group.members || [];
  const members = memberIds.map(id => {
    const user = store.getUserById(id);
    if (!user) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email
    };
  }).filter(m => m !== null);
  
  res.json({ members });
});

// === Forum Thread Routes ===

// Create a thread in a group
router.post('/:id/threads', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  // Must be a member to post
  if (!group.members || !group.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'must be a member to create threads' });
  }
  
  const { title, content, contentType, attachments } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'title is required' });
  }
  
  if (title.trim().length > 200) {
    return res.status(400).json({ error: 'title must be 200 characters or less' });
  }
  
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  
  if (content.trim().length > 10000) {
    return res.status(400).json({ error: 'content must be 10000 characters or less' });
  }
  
  // Validate content type (plain, markdown, or html)
  const validContentTypes = ['plain', 'markdown', 'html'];
  const selectedContentType = contentType && validContentTypes.includes(contentType) ? contentType : 'plain';
  
  // Validate attachments if provided
  const validatedAttachments = [];
  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.url && typeof att.url === 'string') {
        validatedAttachments.push({
          id: uuidv4(),
          url: att.url,
          filename: att.filename || 'attachment',
          mimeType: att.mimeType || 'application/octet-stream',
          size: att.size || 0,
          virusScanned: att.virusScanned || false,
          uploadedAt: new Date().toISOString()
        });
      }
    }
  }
  
  const thread = {
    id: uuidv4(),
    groupId: req.params.id,
    title: title.trim(),
    content: content.trim(),
    contentType: selectedContentType,
    attachments: validatedAttachments,
    authorId: req.user.id,
    createdAt: new Date().toISOString(),
    replyCount: 0,
    isPinned: false,
    isLocked: false
  };
  
  store.createThread(thread);
  
  // Notify via WebSocket
  const author = store.getUserById(thread.authorId);
  websocket.notifyThreadCreated(req.params.id, {
    ...thread,
    authorName: author ? author.name : 'Unknown'
  });
  
  res.status(201).json({ message: 'thread created', thread });
});

// List threads in a group
router.get('/:id/threads', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  const threads = store.listThreadsByGroup(req.params.id);
  
  // Sort: pinned threads first, then by creation date (newest first)
  const sortedThreads = threads.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  
  // Enrich with author info
  const threadsWithAuthor = sortedThreads.map(t => {
    const author = store.getUserById(t.authorId);
    return {
      ...t,
      authorName: author ? author.name : 'Unknown'
    };
  });
  
  res.json({ threads: threadsWithAuthor });
});

// Get a specific thread
router.get('/:id/threads/:threadId', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  const author = store.getUserById(thread.authorId);
  const replies = store.listRepliesByThread(thread.id);
  
  const repliesWithAuthor = replies.map(r => {
    const replyAuthor = store.getUserById(r.authorId);
    return {
      ...r,
      authorName: replyAuthor ? replyAuthor.name : 'Unknown'
    };
  });
  
  res.json({
    ...thread,
    authorName: author ? author.name : 'Unknown',
    replies: repliesWithAuthor
  });
});

// Reply to a thread
router.post('/:id/threads/:threadId/replies', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  // Must be a member to reply
  if (!group.members || !group.members.includes(req.user.id)) {
    return res.status(403).json({ error: 'must be a member to reply' });
  }
  
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  // Check if thread is locked
  if (thread.isLocked) {
    return res.status(403).json({ error: 'thread is locked' });
  }
  
  const { content, contentType, attachments } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  
  if (content.trim().length > 10000) {
    return res.status(400).json({ error: 'content must be 10000 characters or less' });
  }
  
  // Validate content type
  const validContentTypes = ['plain', 'markdown', 'html'];
  const selectedContentType = contentType && validContentTypes.includes(contentType) ? contentType : 'plain';
  
  // Validate attachments if provided
  const validatedAttachments = [];
  if (attachments && Array.isArray(attachments)) {
    for (const att of attachments) {
      if (att.url && typeof att.url === 'string') {
        validatedAttachments.push({
          id: uuidv4(),
          url: att.url,
          filename: att.filename || 'attachment',
          mimeType: att.mimeType || 'application/octet-stream',
          size: att.size || 0,
          virusScanned: att.virusScanned || false,
          uploadedAt: new Date().toISOString()
        });
      }
    }
  }
  
  const reply = {
    id: uuidv4(),
    threadId: thread.id,
    content: content.trim(),
    contentType: selectedContentType,
    attachments: validatedAttachments,
    authorId: req.user.id,
    createdAt: new Date().toISOString()
  };
  
  store.createReply(reply);
  
  // Update thread reply count
  thread.replyCount = (thread.replyCount || 0) + 1;
  store.updateThread(thread.id, { replyCount: thread.replyCount });
  
  // Notify via WebSocket
  const author = store.getUserById(reply.authorId);
  websocket.notifyReplyCreated(req.params.id, thread.id, {
    ...reply,
    authorName: author ? author.name : 'Unknown'
  });
  
  res.status(201).json({ message: 'reply created', reply });
});

// === Moderation Routes ===

// Add moderator to group (admin/creator only)
router.post('/:id/moderators', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  
  const isCreator = group.createdBy === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: 'only group creator or admin can add moderators' });
  }
  
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }
  
  const targetUser = store.getUserById(userId);
  if (!targetUser) return res.status(404).json({ error: 'user not found' });
  
  // Check if user is a member
  if (!group.members || !group.members.includes(userId)) {
    return res.status(400).json({ error: 'user must be a member to become a moderator' });
  }
  
  if (!group.moderators) group.moderators = [];
  
  if (group.moderators.includes(userId)) {
    return res.status(400).json({ error: 'user is already a moderator' });
  }
  
  group.moderators.push(userId);
  store.updateGroup(group.id, { moderators: group.moderators });
  
  res.json({ message: 'moderator added', groupId: group.id, userId });
});

// Remove moderator from group (admin/creator only)
router.delete('/:id/moderators/:userId', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  
  const isCreator = group.createdBy === req.user.id;
  const isAdmin = req.user.role === 'admin';
  
  if (!isCreator && !isAdmin) {
    return res.status(403).json({ error: 'only group creator or admin can remove moderators' });
  }
  
  if (!group.moderators || !group.moderators.includes(req.params.userId)) {
    return res.status(400).json({ error: 'user is not a moderator' });
  }
  
  group.moderators = group.moderators.filter(m => m !== req.params.userId);
  store.updateGroup(group.id, { moderators: group.moderators });
  
  res.json({ message: 'moderator removed', groupId: group.id, userId: req.params.userId });
});

// Pin/unpin thread (moderator/admin only)
router.patch('/:id/threads/:threadId/pin', requireUser, checkGroupModerator, (req, res) => {
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  const { pinned } = req.body;
  const isPinned = pinned === true;
  
  store.updateThread(thread.id, { isPinned });
  
  // Notify via WebSocket
  websocket.notifyThreadUpdated(req.params.id, thread.id, { isPinned });
  
  res.json({ message: isPinned ? 'thread pinned' : 'thread unpinned', threadId: thread.id });
});

// Lock/unlock thread (moderator/admin only)
router.patch('/:id/threads/:threadId/lock', requireUser, checkGroupModerator, (req, res) => {
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  const { locked } = req.body;
  const isLocked = locked === true;
  
  store.updateThread(thread.id, { isLocked });
  
  // Notify via WebSocket
  websocket.notifyThreadUpdated(req.params.id, thread.id, { isLocked });
  
  res.json({ message: isLocked ? 'thread locked' : 'thread unlocked', threadId: thread.id });
});

// Delete thread (moderator/admin only)
router.delete('/:id/threads/:threadId', requireUser, checkGroupModerator, (req, res) => {
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  const deleted = store.deleteThread(thread.id);
  if (!deleted) return res.status(500).json({ error: 'failed to delete thread' });
  
  // Notify via WebSocket
  websocket.notifyThreadDeleted(req.params.id, thread.id);
  
  res.json({ message: 'thread deleted', threadId: thread.id });
});

// Delete reply (moderator/admin only)
router.delete('/:id/threads/:threadId/replies/:replyId', requireUser, checkGroupModerator, (req, res) => {
  const thread = store.getThreadById(req.params.threadId);
  if (!thread) return res.status(404).json({ error: 'thread not found' });
  if (thread.groupId !== req.params.id) {
    return res.status(404).json({ error: 'thread not found in this group' });
  }
  
  const reply = store.getReplyById(req.params.replyId);
  if (!reply) return res.status(404).json({ error: 'reply not found' });
  if (reply.threadId !== thread.id) {
    return res.status(404).json({ error: 'reply not found in this thread' });
  }
  
  const deleted = store.deleteReply(reply.id);
  if (!deleted) return res.status(500).json({ error: 'failed to delete reply' });
  
  // Update thread reply count
  thread.replyCount = Math.max(0, (thread.replyCount || 0) - 1);
  store.updateThread(thread.id, { replyCount: thread.replyCount });
  
  // Notify via WebSocket
  websocket.notifyReplyDeleted(req.params.id, thread.id, reply.id);
  
  res.json({ message: 'reply deleted', replyId: reply.id });
});

module.exports = router;
