const request = require('supertest');
const app = require('../src/server');
const store = require('../src/store');
const fs = require('fs');
const path = require('path');

// Clean up test database before each test
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function cleanDb() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
}

describe('Discovery & Recommendations API', () => {
  let user1, user2, user3, user4, adminUser;
  
  beforeEach(() => {
    cleanDb();
    
    // Create admin user
    adminUser = store.createUser({
      id: 'admin-1',
      email: 'admin@test.edu',
      name: 'Admin User',
      verified: true,
      role: 'admin',
      onboarding: {
        majors: ['Computer Science'],
        interests_hobbies: ['Programming', 'Gaming', 'Music'],
        year_of_study: 'Junior'
      },
      onboardingCompleted: true
    });
    
    // Create test users with different profiles
    user1 = store.createUser({
      id: 'user-1',
      email: 'user1@test.edu',
      name: 'Alice Smith',
      verified: true,
      role: 'user',
      onboarding: {
        majors: ['Computer Science', 'Mathematics'],
        interests_hobbies: ['Programming', 'Sports', 'Reading'],
        year_of_study: 'Sophomore'
      },
      onboardingCompleted: true
    });
    
    user2 = store.createUser({
      id: 'user-2',
      email: 'user2@test.edu',
      name: 'Bob Johnson',
      verified: true,
      role: 'user',
      onboarding: {
        majors: ['Computer Science'],
        interests_hobbies: ['Programming', 'Gaming', 'Music'],
        year_of_study: 'Sophomore'
      },
      onboardingCompleted: true
    });
    
    user3 = store.createUser({
      id: 'user-3',
      email: 'user3@test.edu',
      name: 'Charlie Brown',
      verified: true,
      role: 'user',
      onboarding: {
        majors: ['Biology'],
        interests_hobbies: ['Photography', 'Music', 'Sports'],
        year_of_study: 'Junior'
      },
      onboardingCompleted: true
    });
    
    user4 = store.createUser({
      id: 'user-4',
      email: 'user4@test.edu',
      name: 'Diana Prince',
      verified: true,
      role: 'user',
      onboarding: {
        majors: ['Psychology'],
        interests_hobbies: ['Reading', 'Politics', 'Music'],
        year_of_study: 'Senior'
      },
      onboardingCompleted: true
    });
  });
  
  afterAll(() => {
    cleanDb();
  });
  
  describe('GET /users/search - Search Users', () => {
    test('searches users by name', async () => {
      const res = await request(app)
        .get('/users/search?q=Alice')
        .set('X-User-Id', user2.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].name).toBe('Alice Smith');
      expect(res.body.users[0]).toHaveProperty('majors');
      expect(res.body.users[0]).toHaveProperty('interests');
      expect(res.body.users[0]).toHaveProperty('year');
    });
    
    test('searches users by email', async () => {
      const res = await request(app)
        .get('/users/search?q=user3@test.edu')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(1);
      expect(res.body.users[0].name).toBe('Charlie Brown');
    });
    
    test('returns multiple matching users', async () => {
      const res = await request(app)
        .get('/users/search?q=user')
        .set('X-User-Id', adminUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(1);
    });
    
    test('excludes self from search results', async () => {
      const res = await request(app)
        .get('/users/search?q=Alice')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(0);
    });
    
    test('requires q parameter', async () => {
      const res = await request(app)
        .get('/users/search')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('q parameter required');
    });
    
    test('limits results to 20', async () => {
      // Create many users
      for (let i = 5; i < 30; i++) {
        store.createUser({
          id: `user-${i}`,
          email: `user${i}@test.edu`,
          name: `Test User ${i}`,
          verified: true,
          role: 'user',
          onboarding: {
            majors: ['Computer Science'],
            interests_hobbies: ['Programming', 'Gaming', 'Music'],
            year_of_study: 'Sophomore'
          },
          onboardingCompleted: true
        });
      }
      
      const res = await request(app)
        .get('/users/search?q=Test')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(20);
    });
  });
  
  describe('GET /users/recommendations - Get User Recommendations', () => {
    test('recommends users with shared majors', async () => {
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      
      // user2 should be recommended (shares Computer Science major)
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).toContain(user2.id);
      
      // Check shared information is provided
      const user2Rec = res.body.users.find(u => u.id === user2.id);
      expect(user2Rec.sharedMajors).toContain('Computer Science');
    });
    
    test('recommends users with shared interests', async () => {
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      // user2 should be recommended (shares Programming interest)
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).toContain(user2.id);
      
      const user2Rec = res.body.users.find(u => u.id === user2.id);
      expect(user2Rec.sharedInterests.length).toBeGreaterThan(0);
    });
    
    test('recommends users with same year of study', async () => {
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      // user2 has same year (Sophomore)
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).toContain(user2.id);
    });
    
    test('recommends users based on group overlap', async () => {
      // Create a group and add users
      const group = store.createGroup({
        id: 'group-1',
        name: 'CS Students',
        category: 'major',
        tags: ['Computer Science'],
        createdBy: adminUser.id,
        members: [adminUser.id, user1.id, user2.id],
        isPublic: true
      });
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      // user2 should be highly recommended (shared group)
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).toContain(user2.id);
      
      const user2Rec = res.body.users.find(u => u.id === user2.id);
      expect(user2Rec.sharedGroups).toBeGreaterThan(0);
    });
    
    test('excludes blocked users', async () => {
      // user1 blocks user2
      store.createBlock({
        id: 'block-1',
        blockerId: user1.id,
        blockedId: user2.id,
        createdAt: new Date().toISOString()
      });
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).not.toContain(user2.id);
    });
    
    test('excludes users who blocked current user', async () => {
      // user2 blocks user1
      store.createBlock({
        id: 'block-1',
        blockerId: user2.id,
        blockedId: user1.id,
        createdAt: new Date().toISOString()
      });
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      const recommendedIds = res.body.users.map(u => u.id);
      expect(recommendedIds).not.toContain(user2.id);
    });
    
    test('indicates if recommended user is already a friend', async () => {
      // Make user1 and user2 friends
      store.createFriendship({
        id: 'friendship-1',
        userId1: user1.id,
        userId2: user2.id,
        createdAt: new Date().toISOString()
      });
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      const user2Rec = res.body.users.find(u => u.id === user2.id);
      if (user2Rec) {
        expect(user2Rec.isFriend).toBe(true);
      }
    });
    
    test('returns empty array for user without onboarding', async () => {
      const userNoOnboarding = store.createUser({
        id: 'user-no-onboarding',
        email: 'noonboarding@test.edu',
        name: 'No Onboarding',
        verified: true,
        role: 'user'
      });
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', userNoOnboarding.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users).toHaveLength(0);
    });
    
    test('limits recommendations to 20 users', async () => {
      // Create many similar users
      for (let i = 5; i < 30; i++) {
        store.createUser({
          id: `user-${i}`,
          email: `user${i}@test.edu`,
          name: `Similar User ${i}`,
          verified: true,
          role: 'user',
          onboarding: {
            majors: ['Computer Science'],
            interests_hobbies: ['Programming', 'Gaming', 'Music'],
            year_of_study: 'Sophomore'
          },
          onboardingCompleted: true
        });
      }
      
      const res = await request(app)
        .get('/users/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeLessThanOrEqual(20);
    });
  });
  
  describe('GET /discovery/feed - Unified Discovery Feed', () => {
    beforeEach(async () => {
      // Create test groups
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'CS Students',
          category: 'major',
          tags: ['Computer Science']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Math Club',
          category: 'major',
          tags: ['Mathematics']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Programming Enthusiasts',
          category: 'interests_activities',
          tags: ['Programming']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Sophomore Year',
          category: 'class_year',
          tags: ['Sophomore']
        });
    });
    
    test('returns both groups and users in feed', async () => {
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('groups');
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.groups)).toBe(true);
      expect(Array.isArray(res.body.users)).toBe(true);
    });
    
    test('recommends relevant groups in feed', async () => {
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups.length).toBeGreaterThan(0);
      
      // Should recommend groups matching user1's profile
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).toContain('CS Students'); // Major match
      expect(groupNames).toContain('Math Club'); // Major match
      expect(groupNames).toContain('Programming Enthusiasts'); // Interest match
      expect(groupNames).toContain('Sophomore Year'); // Year match
    });
    
    test('recommends relevant users in feed', async () => {
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.users.length).toBeGreaterThan(0);
      
      // Should recommend users with similar profiles
      const userIds = res.body.users.map(u => u.id);
      expect(userIds).toContain(user2.id); // Similar major and interests
    });
    
    test('excludes groups user is already member of', async () => {
      const groups = store.listGroups();
      const csGroup = groups.find(g => g.name === 'CS Students');
      
      // Join the CS Students group
      await request(app)
        .post(`/groups/${csGroup.id}/join`)
        .set('X-User-Id', user1.id);
      
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).not.toContain('CS Students');
    });
    
    test('boosts groups where friends are members', async () => {
      // Make user1 and user2 friends
      store.createFriendship({
        id: 'friendship-1',
        userId1: user1.id,
        userId2: user2.id,
        createdAt: new Date().toISOString()
      });
      
      // user2 joins a group
      const groups = store.listGroups();
      const progGroup = groups.find(g => g.name === 'Programming Enthusiasts');
      await request(app)
        .post(`/groups/${progGroup.id}/join`)
        .set('X-User-Id', user2.id);
      
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      const groupNames = res.body.groups.map(g => g.name);
      // Should still recommend the group (friend is in it)
      expect(groupNames).toContain('Programming Enthusiasts');
    });
    
    test('limits feed to 10 groups and 10 users', async () => {
      // Create many groups
      for (let i = 5; i < 20; i++) {
        await request(app)
          .post('/groups')
          .set('X-User-Id', adminUser.id)
          .send({
            name: `Group ${i}`,
            category: 'major',
            tags: ['Computer Science']
          });
      }
      
      // Create many users
      for (let i = 5; i < 20; i++) {
        store.createUser({
          id: `user-${i}`,
          email: `user${i}@test.edu`,
          name: `User ${i}`,
          verified: true,
          role: 'user',
          onboarding: {
            majors: ['Computer Science'],
            interests_hobbies: ['Programming', 'Gaming', 'Music'],
            year_of_study: 'Sophomore'
          },
          onboardingCompleted: true
        });
      }
      
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups.length).toBeLessThanOrEqual(10);
      expect(res.body.users.length).toBeLessThanOrEqual(10);
    });
    
    test('returns empty arrays for user without onboarding', async () => {
      const userNoOnboarding = store.createUser({
        id: 'user-no-onboarding',
        email: 'noonboarding@test.edu',
        name: 'No Onboarding',
        verified: true,
        role: 'user'
      });
      
      const res = await request(app)
        .get('/discovery/feed')
        .set('X-User-Id', userNoOnboarding.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups).toHaveLength(0);
      expect(res.body.users).toHaveLength(0);
    });
  });
  
  describe('Enhanced Group Recommendations with Group Overlap', () => {
    beforeEach(async () => {
      // Create test groups
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'CS Students',
          category: 'major',
          tags: ['Computer Science']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Programming Club',
          category: 'interests_activities',
          tags: ['Programming']
        });
    });
    
    test('boosts group recommendations where friends are members', async () => {
      // Make user1 and user2 friends
      store.createFriendship({
        id: 'friendship-1',
        userId1: user1.id,
        userId2: user2.id,
        createdAt: new Date().toISOString()
      });
      
      // user2 joins Programming Club
      const groups = store.listGroups();
      const progGroup = groups.find(g => g.name === 'Programming Club');
      await request(app)
        .post(`/groups/${progGroup.id}/join`)
        .set('X-User-Id', user2.id);
      
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups.length).toBeGreaterThan(0);
      
      // Programming Club should be recommended (friend is member + interest match)
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).toContain('Programming Club');
    });
    
    test('does not recommend private group chats', async () => {
      // Create a private chat (should not appear in public group recommendations)
      store.createPrivateChat({
        id: 'chat-1',
        name: 'Private Chat',
        participants: [user1.id, user2.id],
        createdBy: user1.id,
        createdAt: new Date().toISOString()
      });
      
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      // Private chats should never appear in group recommendations
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).not.toContain('Private Chat');
    });
  });
});
