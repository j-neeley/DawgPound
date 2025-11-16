const express = require('express');
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

// Search users by name or email
router.get('/search', requireUser, (req, res) => {
  const { q } = req.query;
  
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return res.status(400).json({ error: 'q parameter required for search' });
  }
  
  const searchLower = q.toLowerCase();
  const allUsers = store.listUsers();
  
  // Filter users by name or email, exclude self
  const matchingUsers = allUsers
    .filter(u => 
      u.id !== req.user.id && 
      u.verified &&
      (u.name.toLowerCase().includes(searchLower) || 
       u.email.toLowerCase().includes(searchLower))
    )
    .slice(0, 20) // Limit to 20 results
    .map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      majors: u.onboarding?.majors || [],
      interests: u.onboarding?.interests_hobbies || [],
      year: u.onboarding?.year_of_study || null
    }));
  
  res.json({ users: matchingUsers });
});

// Get recommended users based on interests, majors, year, and group overlap
router.get('/recommendations', requireUser, (req, res) => {
  const user = req.user;
  const onboarding = user.onboarding;
  
  if (!onboarding) {
    return res.json({ users: [] });
  }
  
  const allUsers = store.listUsers();
  const userMajors = onboarding.majors || [];
  const userInterests = onboarding.interests_hobbies || [];
  const userYear = onboarding.year_of_study;
  
  // Get groups the current user is a member of
  const allGroups = store.listGroups();
  const userGroupIds = allGroups
    .filter(g => g.members && g.members.includes(user.id))
    .map(g => g.id);
  
  // Check if users are blocked
  const blockedUserIds = new Set();
  store.listBlocks(user.id).forEach(b => blockedUserIds.add(b.blockedId));
  
  // Also check if user is blocked by others
  store.listUsers().forEach(u => {
    if (store.getBlock(u.id, user.id)) {
      blockedUserIds.add(u.id);
    }
  });
  
  // Check if already friends
  const friendIds = new Set();
  store.listFriendships(user.id).forEach(f => {
    const friendId = f.userId1 === user.id ? f.userId2 : f.userId1;
    friendIds.add(friendId);
  });
  
  // Score each user by relevance
  const scoredUsers = allUsers
    .filter(u => 
      u.id !== user.id && 
      u.verified && 
      !blockedUserIds.has(u.id) &&
      u.onboarding
    )
    .map(u => {
      let score = 0;
      const targetOnboarding = u.onboarding;
      const targetMajors = targetOnboarding.majors || [];
      const targetInterests = targetOnboarding.interests_hobbies || [];
      const targetYear = targetOnboarding.year_of_study;
      
      // Match by majors (high weight)
      const matchingMajors = targetMajors.filter(m => userMajors.includes(m));
      score += matchingMajors.length * 10;
      
      // Match by interests (medium weight)
      const matchingInterests = targetInterests.filter(i => userInterests.includes(i));
      score += matchingInterests.length * 5;
      
      // Match by year (medium weight)
      if (userYear && targetYear === userYear) {
        score += 8;
      }
      
      // Match by group overlap (high weight) - users in same groups
      const targetGroupIds = allGroups
        .filter(g => g.members && g.members.includes(u.id))
        .map(g => g.id);
      
      const sharedGroups = userGroupIds.filter(gid => targetGroupIds.includes(gid));
      score += sharedGroups.length * 12;
      
      // Boost if they're already friends (to show existing connections)
      const isFriend = friendIds.has(u.id);
      
      return { 
        user: u, 
        score,
        isFriend,
        sharedMajors: matchingMajors,
        sharedInterests: matchingInterests,
        sharedGroups: sharedGroups.length
      };
    });
  
  // Filter out zero scores and sort by score
  const recommendations = scoredUsers
    .filter(su => su.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(su => ({
      id: su.user.id,
      name: su.user.name,
      email: su.user.email,
      majors: su.user.onboarding?.majors || [],
      interests: su.user.onboarding?.interests_hobbies || [],
      year: su.user.onboarding?.year_of_study || null,
      isFriend: su.isFriend,
      sharedMajors: su.sharedMajors,
      sharedInterests: su.sharedInterests,
      sharedGroups: su.sharedGroups
    }));
  
  res.json({ users: recommendations });
});

module.exports = router;
