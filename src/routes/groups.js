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

// Middleware to require admin or developer role
function requireAdminOrDeveloper(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'authentication required' });
  if (req.user.role !== 'admin' && req.user.role !== 'developer') {
    return res.status(403).json({ error: 'admin or developer role required' });
  }
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
  
  const { title, content } = req.body;
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
  
  const thread = {
    id: uuidv4(),
    groupId: req.params.id,
    title: title.trim(),
    content: content.trim(),
    authorId: req.user.id,
    createdAt: new Date().toISOString(),
    replyCount: 0
  };
  
  store.createThread(thread);
  res.status(201).json({ message: 'thread created', thread });
});

// List threads in a group
router.get('/:id/threads', requireUser, (req, res) => {
  const group = store.getGroupById(req.params.id);
  if (!group) return res.status(404).json({ error: 'group not found' });
  if (!group.isPublic) return res.status(403).json({ error: 'group is not public' });
  
  const threads = store.listThreadsByGroup(req.params.id);
  
  // Enrich with author info
  const threadsWithAuthor = threads.map(t => {
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
  
  const { content } = req.body;
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: 'content is required' });
  }
  
  if (content.trim().length > 10000) {
    return res.status(400).json({ error: 'content must be 10000 characters or less' });
  }
  
  const reply = {
    id: uuidv4(),
    threadId: thread.id,
    content: content.trim(),
    authorId: req.user.id,
    createdAt: new Date().toISOString()
  };
  
  store.createReply(reply);
  
  // Update thread reply count
  thread.replyCount = (thread.replyCount || 0) + 1;
  store.updateThread(thread.id, { replyCount: thread.replyCount });
  
  res.status(201).json({ message: 'reply created', reply });
});

module.exports = router;
