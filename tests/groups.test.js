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

describe('Public Groups (Forums) API', () => {
  let adminUser, regularUser, developerUser;
  
  beforeEach(() => {
    cleanDb();
    
    // Create test users
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
    
    regularUser = store.createUser({
      id: 'user-1',
      email: 'user@test.edu',
      name: 'Regular User',
      verified: true,
      role: 'user',
      onboarding: {
        majors: ['Computer Science', 'Mathematics'],
        interests_hobbies: ['Programming', 'Sports', 'Reading'],
        year_of_study: 'Sophomore'
      },
      onboardingCompleted: true
    });
    
    developerUser = store.createUser({
      id: 'dev-1',
      email: 'dev@test.edu',
      name: 'Developer User',
      verified: true,
      role: 'developer',
      onboarding: {
        majors: ['Electrical Engineering'],
        interests_hobbies: ['Gaming', 'Music', 'Sports'],
        year_of_study: 'Senior'
      },
      onboardingCompleted: true
    });
  });
  
  afterAll(() => {
    cleanDb();
  });
  
  describe('POST /groups - Create Group', () => {
    test('admin can create a public group', async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'CS Students',
          description: 'Group for Computer Science students',
          category: 'major',
          tags: ['Computer Science']
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.group).toHaveProperty('id');
      expect(res.body.group.name).toBe('CS Students');
      expect(res.body.group.category).toBe('major');
      expect(res.body.group.isPublic).toBe(true);
      expect(res.body.group.members).toContain(adminUser.id);
    });
    
    test('developer can create a public group', async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', developerUser.id)
        .send({
          name: 'Gaming Club',
          description: 'For gaming enthusiasts',
          category: 'interests_activities',
          tags: ['Gaming']
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.group.name).toBe('Gaming Club');
    });
    
    test('regular user cannot create a group', async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', regularUser.id)
        .send({
          name: 'Test Group',
          description: 'Should fail',
          category: 'major'
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('admin or developer role required');
    });
    
    test('requires valid category', async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          category: 'invalid_category'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('category must be one of');
    });
    
    test('requires name', async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          category: 'major'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('name is required');
    });
  });
  
  describe('GET /groups - List Groups', () => {
    beforeEach(async () => {
      // Create test groups
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'CS Students',
          description: 'Computer Science group',
          category: 'major',
          tags: ['Computer Science']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Math Club',
          description: 'Mathematics enthusiasts',
          category: 'major',
          tags: ['Mathematics']
        });
      
      await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Gaming Society',
          description: 'Gaming group',
          category: 'interests_activities',
          tags: ['Gaming']
        });
    });
    
    test('lists all public groups', async () => {
      const res = await request(app)
        .get('/groups')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups).toHaveLength(3);
      expect(res.body.groups[0]).toHaveProperty('memberCount');
      expect(res.body.groups[0]).toHaveProperty('isMember');
    });
    
    test('filters by search term', async () => {
      const res = await request(app)
        .get('/groups?search=gaming')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0].name).toBe('Gaming Society');
    });
    
    test('filters by category', async () => {
      const res = await request(app)
        .get('/groups?category=major')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups).toHaveLength(2);
    });
    
    test('filters by tag', async () => {
      const res = await request(app)
        .get('/groups?tag=Mathematics')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups).toHaveLength(1);
      expect(res.body.groups[0].name).toBe('Math Club');
    });
  });
  
  describe('GET /groups/recommendations - Get Recommendations', () => {
    beforeEach(async () => {
      // Create groups with different categories and tags
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
    
    test('recommends groups based on major', async () => {
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.groups.length).toBeGreaterThan(0);
      
      // Should recommend CS and Math (user's majors)
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).toContain('CS Students');
      expect(groupNames).toContain('Math Club');
    });
    
    test('recommends groups based on interests', async () => {
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).toContain('Programming Enthusiasts');
    });
    
    test('recommends groups based on year', async () => {
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).toContain('Sophomore Year');
    });
    
    test('does not recommend groups user is already in', async () => {
      // Join CS Students group
      const groups = store.listGroups();
      const csGroup = groups.find(g => g.name === 'CS Students');
      await request(app)
        .post(`/groups/${csGroup.id}/join`)
        .set('X-User-Id', regularUser.id);
      
      const res = await request(app)
        .get('/groups/recommendations')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      const groupNames = res.body.groups.map(g => g.name);
      expect(groupNames).not.toContain('CS Students');
    });
  });
  
  describe('GET /groups/:id - Get Group Details', () => {
    let groupId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          description: 'Test description',
          category: 'major'
        });
      groupId = res.body.group.id;
    });
    
    test('returns group details', async () => {
      const res = await request(app)
        .get(`/groups/${groupId}`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Test Group');
      expect(res.body).toHaveProperty('memberCount');
      expect(res.body).toHaveProperty('isMember');
    });
    
    test('returns 404 for non-existent group', async () => {
      const res = await request(app)
        .get('/groups/non-existent-id')
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(404);
    });
  });
  
  describe('POST /groups/:id/join - Join Group', () => {
    let groupId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          category: 'major'
        });
      groupId = res.body.group.id;
    });
    
    test('user can join a group', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('joined group');
      
      // Verify membership
      const group = store.getGroupById(groupId);
      expect(group.members).toContain(regularUser.id);
    });
    
    test('cannot join same group twice', async () => {
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
      
      const res = await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('already a member');
    });
  });
  
  describe('POST /groups/:id/leave - Leave Group', () => {
    let groupId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          category: 'major'
        });
      groupId = res.body.group.id;
      
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
    });
    
    test('user can leave a group', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/leave`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('left group');
      
      // Verify no longer a member
      const group = store.getGroupById(groupId);
      expect(group.members).not.toContain(regularUser.id);
    });
    
    test('cannot leave group not a member of', async () => {
      await request(app)
        .post(`/groups/${groupId}/leave`)
        .set('X-User-Id', regularUser.id);
      
      const res = await request(app)
        .post(`/groups/${groupId}/leave`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('not a member');
    });
  });
  
  describe('GET /groups/:id/members - Get Members', () => {
    let groupId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          category: 'major'
        });
      groupId = res.body.group.id;
      
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
    });
    
    test('lists group members', async () => {
      const res = await request(app)
        .get(`/groups/${groupId}/members`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.members).toHaveLength(2);
      expect(res.body.members[0]).toHaveProperty('id');
      expect(res.body.members[0]).toHaveProperty('name');
      expect(res.body.members[0]).toHaveProperty('email');
    });
  });
  
  describe('Forum Threads', () => {
    let groupId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/groups')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Test Group',
          category: 'major'
        });
      groupId = res.body.group.id;
      
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', regularUser.id);
    });
    
    describe('POST /groups/:id/threads - Create Thread', () => {
      test('member can create a thread', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id)
          .send({
            title: 'Test Thread',
            content: 'This is a test thread content'
          });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.thread.title).toBe('Test Thread');
        expect(res.body.thread.groupId).toBe(groupId);
        expect(res.body.thread.authorId).toBe(regularUser.id);
      });
      
      test('non-member cannot create a thread', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', developerUser.id)
          .send({
            title: 'Test Thread',
            content: 'Should fail'
          });
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('must be a member to create threads');
      });
      
      test('requires title and content', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id)
          .send({
            title: 'Test'
          });
        
        expect(res.statusCode).toBe(400);
      });
    });
    
    describe('GET /groups/:id/threads - List Threads', () => {
      beforeEach(async () => {
        await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id)
          .send({
            title: 'Thread 1',
            content: 'Content 1'
          });
        
        await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', adminUser.id)
          .send({
            title: 'Thread 2',
            content: 'Content 2'
          });
      });
      
      test('lists all threads in group', async () => {
        const res = await request(app)
          .get(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.threads).toHaveLength(2);
        expect(res.body.threads[0]).toHaveProperty('authorName');
      });
    });
    
    describe('GET /groups/:id/threads/:threadId - Get Thread', () => {
      let threadId;
      
      beforeEach(async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id)
          .send({
            title: 'Test Thread',
            content: 'Test Content'
          });
        threadId = res.body.thread.id;
      });
      
      test('returns thread details', async () => {
        const res = await request(app)
          .get(`/groups/${groupId}/threads/${threadId}`)
          .set('X-User-Id', regularUser.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.title).toBe('Test Thread');
        expect(res.body).toHaveProperty('replies');
      });
    });
    
    describe('POST /groups/:id/threads/:threadId/replies - Reply to Thread', () => {
      let threadId;
      
      beforeEach(async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads`)
          .set('X-User-Id', regularUser.id)
          .send({
            title: 'Test Thread',
            content: 'Test Content'
          });
        threadId = res.body.thread.id;
      });
      
      test('member can reply to thread', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads/${threadId}/replies`)
          .set('X-User-Id', adminUser.id)
          .send({
            content: 'This is a reply'
          });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.reply.content).toBe('This is a reply');
        expect(res.body.reply.threadId).toBe(threadId);
        
        // Verify reply count updated
        const thread = store.getThreadById(threadId);
        expect(thread.replyCount).toBe(1);
      });
      
      test('non-member cannot reply', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads/${threadId}/replies`)
          .set('X-User-Id', developerUser.id)
          .send({
            content: 'Should fail'
          });
        
        expect(res.statusCode).toBe(403);
      });
      
      test('requires content', async () => {
        const res = await request(app)
          .post(`/groups/${groupId}/threads/${threadId}/replies`)
          .set('X-User-Id', adminUser.id)
          .send({});
        
        expect(res.statusCode).toBe(400);
      });
    });
  });
});
