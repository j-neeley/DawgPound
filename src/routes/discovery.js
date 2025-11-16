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

// Unified discovery feed for onboarding and discovery UI
router.get('/feed', requireUser, (req, res) => {
  const user = req.user;
  const onboarding = user.onboarding;
  
  if (!onboarding) {
    return res.json({ 
      groups: [],
      users: []
    });
  }
  
  const userMajors = onboarding.majors || [];
  const userInterests = onboarding.interests_hobbies || [];
  const userYear = onboarding.year_of_study;
  
  // Get all groups and filter to public ones
  const allGroups = store.listGroups().filter(g => g.isPublic);
  
  // Get groups the current user is a member of
  const userGroupIds = allGroups
    .filter(g => g.members && g.members.includes(user.id))
    .map(g => g.id);
  
  // Score groups
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
    
    // Group overlap: boost groups where user's friends are members
    const friendIds = new Set();
    store.listFriendships(user.id).forEach(f => {
      const friendId = f.userId1 === user.id ? f.userId2 : f.userId1;
      friendIds.add(friendId);
    });
    
    if (g.members) {
      const friendsInGroup = g.members.filter(memberId => friendIds.has(memberId));
      score += friendsInGroup.length * 7;
    }
    
    return { group: g, score };
  });
  
  // Get recommended groups
  const recommendedGroups = scoredGroups
    .filter(sg => sg.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(sg => ({
      ...sg.group,
      memberCount: sg.group.members ? sg.group.members.length : 0,
      isMember: false
    }));
  
  // Get all users
  const allUsers = store.listUsers();
  
  // Check blocked users
  const blockedUserIds = new Set();
  store.listBlocks(user.id).forEach(b => blockedUserIds.add(b.blockedId));
  
  // Also check if user is blocked by others
  allUsers.forEach(u => {
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
  
  // Score users
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
      
      // Match by majors
      const matchingMajors = targetMajors.filter(m => userMajors.includes(m));
      score += matchingMajors.length * 10;
      
      // Match by interests
      const matchingInterests = targetInterests.filter(i => userInterests.includes(i));
      score += matchingInterests.length * 5;
      
      // Match by year
      if (userYear && targetYear === userYear) {
        score += 8;
      }
      
      // Group overlap
      const targetGroupIds = allGroups
        .filter(g => g.members && g.members.includes(u.id))
        .map(g => g.id);
      
      const sharedGroups = userGroupIds.filter(gid => targetGroupIds.includes(gid));
      score += sharedGroups.length * 12;
      
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
  
  // Get recommended users
  const recommendedUsers = scoredUsers
    .filter(su => su.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
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
  
  res.json({
    groups: recommendedGroups,
    users: recommendedUsers
  });
});

module.exports = router;
