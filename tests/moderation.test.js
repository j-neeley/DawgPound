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

describe('Forum Moderation Features', () => {
  let adminUser, regularUser, moderatorUser, groupId, threadId;
  
  beforeEach(async () => {
    cleanDb();
    
    // Create test users
    adminUser = store.createUser({
      id: 'admin-1',
      email: 'admin@test.edu',
      name: 'Admin User',
      verified: true,
      role: 'admin',
      onboardingCompleted: true
    });
    
    regularUser = store.createUser({
      id: 'user-1',
      email: 'user@test.edu',
      name: 'Regular User',
      verified: true,
      role: 'user',
      onboardingCompleted: true
    });
    
    moderatorUser = store.createUser({
      id: 'mod-1',
      email: 'mod@test.edu',
      name: 'Moderator User',
      verified: true,
      role: 'user',
      onboardingCompleted: true
    });
    
    // Create a group and add members
    const groupRes = await request(app)
      .post('/groups')
      .set('X-User-Id', adminUser.id)
      .send({
        name: 'Test Group',
        category: 'major',
        description: 'Test group for moderation'
      });
    
    groupId = groupRes.body.group.id;
    
    // Add regular user and moderator user
    await request(app)
      .post(`/groups/${groupId}/join`)
      .set('X-User-Id', regularUser.id);
    
    await request(app)
      .post(`/groups/${groupId}/join`)
      .set('X-User-Id', moderatorUser.id);
    
    // Add moderator permissions to moderatorUser
    await request(app)
      .post(`/groups/${groupId}/moderators`)
      .set('X-User-Id', adminUser.id)
      .send({ userId: moderatorUser.id });
    
    // Create a test thread
    const threadRes = await request(app)
      .post(`/groups/${groupId}/threads`)
      .set('X-User-Id', regularUser.id)
      .send({
        title: 'Test Thread',
        content: 'Test content'
      });
    
    threadId = threadRes.body.thread.id;
  });
  
  afterAll(() => {
    cleanDb();
  });
  
  describe('Moderator Management', () => {
    test('group creator can add moderators', async () => {
      const newUser = store.createUser({
        id: 'user-new',
        email: 'new@test.edu',
        name: 'New User',
        verified: true,
        role: 'user',
        onboardingCompleted: true
      });
      
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', newUser.id);
      
      const res = await request(app)
        .post(`/groups/${groupId}/moderators`)
        .set('X-User-Id', adminUser.id)
        .send({ userId: newUser.id });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('moderator added');
      
      const group = store.getGroupById(groupId);
      expect(group.moderators).toContain(newUser.id);
    });
    
    test('regular user cannot add moderators', async () => {
      const newUser = store.createUser({
        id: 'user-new2',
        email: 'new2@test.edu',
        name: 'New User 2',
        verified: true,
        role: 'user',
        onboardingCompleted: true
      });
      
      await request(app)
        .post(`/groups/${groupId}/join`)
        .set('X-User-Id', newUser.id);
      
      const res = await request(app)
        .post(`/groups/${groupId}/moderators`)
        .set('X-User-Id', regularUser.id)
        .send({ userId: newUser.id });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('cannot add non-member as moderator', async () => {
      const newUser = store.createUser({
        id: 'user-new3',
        email: 'new3@test.edu',
        name: 'New User 3',
        verified: true,
        role: 'user',
        onboardingCompleted: true
      });
      
      const res = await request(app)
        .post(`/groups/${groupId}/moderators`)
        .set('X-User-Id', adminUser.id)
        .send({ userId: newUser.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('user must be a member to become a moderator');
    });
    
    test('group creator can remove moderators', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/moderators/${moderatorUser.id}`)
        .set('X-User-Id', adminUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('moderator removed');
      
      const group = store.getGroupById(groupId);
      expect(group.moderators).not.toContain(moderatorUser.id);
    });
  });
  
  describe('Pin Thread', () => {
    test('moderator can pin thread', async () => {
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/pin`)
        .set('X-User-Id', moderatorUser.id)
        .send({ pinned: true });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('thread pinned');
      
      const thread = store.getThreadById(threadId);
      expect(thread.isPinned).toBe(true);
    });
    
    test('moderator can unpin thread', async () => {
      store.updateThread(threadId, { isPinned: true });
      
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/pin`)
        .set('X-User-Id', moderatorUser.id)
        .send({ pinned: false });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('thread unpinned');
      
      const thread = store.getThreadById(threadId);
      expect(thread.isPinned).toBe(false);
    });
    
    test('admin can pin thread', async () => {
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/pin`)
        .set('X-User-Id', adminUser.id)
        .send({ pinned: true });
      
      expect(res.statusCode).toBe(200);
    });
    
    test('regular user cannot pin thread', async () => {
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/pin`)
        .set('X-User-Id', regularUser.id)
        .send({ pinned: true });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('pinned threads appear first in thread list', async () => {
      // Create another thread
      const thread2Res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'Thread 2',
          content: 'Content 2'
        });
      
      const thread2Id = thread2Res.body.thread.id;
      
      // Pin the second thread
      await request(app)
        .patch(`/groups/${groupId}/threads/${thread2Id}/pin`)
        .set('X-User-Id', moderatorUser.id)
        .send({ pinned: true });
      
      // Get thread list
      const res = await request(app)
        .get(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.threads.length).toBeGreaterThanOrEqual(2);
      expect(res.body.threads[0].id).toBe(thread2Id);
      expect(res.body.threads[0].isPinned).toBe(true);
    });
  });
  
  describe('Lock Thread', () => {
    test('moderator can lock thread', async () => {
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/lock`)
        .set('X-User-Id', moderatorUser.id)
        .send({ locked: true });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('thread locked');
      
      const thread = store.getThreadById(threadId);
      expect(thread.isLocked).toBe(true);
    });
    
    test('moderator can unlock thread', async () => {
      store.updateThread(threadId, { isLocked: true });
      
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/lock`)
        .set('X-User-Id', moderatorUser.id)
        .send({ locked: false });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('thread unlocked');
      
      const thread = store.getThreadById(threadId);
      expect(thread.isLocked).toBe(false);
    });
    
    test('regular user cannot lock thread', async () => {
      const res = await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/lock`)
        .set('X-User-Id', regularUser.id)
        .send({ locked: true });
      
      expect(res.statusCode).toBe(403);
    });
    
    test('cannot reply to locked thread', async () => {
      // Lock the thread
      await request(app)
        .patch(`/groups/${groupId}/threads/${threadId}/lock`)
        .set('X-User-Id', moderatorUser.id)
        .send({ locked: true });
      
      // Try to reply
      const res = await request(app)
        .post(`/groups/${groupId}/threads/${threadId}/replies`)
        .set('X-User-Id', regularUser.id)
        .send({ content: 'This should fail' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('thread is locked');
    });
  });
  
  describe('Delete Thread', () => {
    test('moderator can delete thread', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}`)
        .set('X-User-Id', moderatorUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('thread deleted');
      
      const thread = store.getThreadById(threadId);
      expect(thread).toBeNull();
    });
    
    test('admin can delete thread', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}`)
        .set('X-User-Id', adminUser.id);
      
      expect(res.statusCode).toBe(200);
    });
    
    test('regular user cannot delete thread', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('Delete Reply', () => {
    let replyId;
    
    beforeEach(async () => {
      const replyRes = await request(app)
        .post(`/groups/${groupId}/threads/${threadId}/replies`)
        .set('X-User-Id', regularUser.id)
        .send({ content: 'Test reply' });
      
      replyId = replyRes.body.reply.id;
    });
    
    test('moderator can delete reply', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}/replies/${replyId}`)
        .set('X-User-Id', moderatorUser.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('reply deleted');
      
      const reply = store.getReplyById(replyId);
      expect(reply).toBeNull();
    });
    
    test('deleting reply updates thread reply count', async () => {
      const threadBefore = store.getThreadById(threadId);
      const countBefore = threadBefore.replyCount;
      
      await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}/replies/${replyId}`)
        .set('X-User-Id', moderatorUser.id);
      
      const threadAfter = store.getThreadById(threadId);
      expect(threadAfter.replyCount).toBe(countBefore - 1);
    });
    
    test('regular user cannot delete reply', async () => {
      const res = await request(app)
        .delete(`/groups/${groupId}/threads/${threadId}/replies/${replyId}`)
        .set('X-User-Id', regularUser.id);
      
      expect(res.statusCode).toBe(403);
    });
  });
  
  describe('Rich Text and Attachments', () => {
    test('thread can be created with markdown content', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'Markdown Thread',
          content: '# Heading\n\n**Bold text**',
          contentType: 'markdown'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.thread.contentType).toBe('markdown');
    });
    
    test('thread can be created with HTML content', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'HTML Thread',
          content: '<h1>Heading</h1><p>Paragraph</p>',
          contentType: 'html'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.thread.contentType).toBe('html');
    });
    
    test('thread defaults to plain text', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'Plain Thread',
          content: 'Plain text content'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.thread.contentType).toBe('plain');
    });
    
    test('thread can have attachments', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'Thread with Attachments',
          content: 'See attached file',
          attachments: [
            {
              url: 'https://example.com/file.pdf',
              filename: 'document.pdf',
              mimeType: 'application/pdf',
              size: 1024,
              virusScanned: true
            }
          ]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.thread.attachments).toHaveLength(1);
      expect(res.body.thread.attachments[0].filename).toBe('document.pdf');
      expect(res.body.thread.attachments[0].virusScanned).toBe(true);
    });
    
    test('reply can have attachments', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads/${threadId}/replies`)
        .set('X-User-Id', regularUser.id)
        .send({
          content: 'Reply with attachment',
          contentType: 'markdown',
          attachments: [
            {
              url: 'https://example.com/image.png',
              filename: 'screenshot.png',
              mimeType: 'image/png',
              size: 2048
            }
          ]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.reply.contentType).toBe('markdown');
      expect(res.body.reply.attachments).toHaveLength(1);
      expect(res.body.reply.attachments[0].filename).toBe('screenshot.png');
    });
    
    test('invalid attachment data is filtered out', async () => {
      const res = await request(app)
        .post(`/groups/${groupId}/threads`)
        .set('X-User-Id', regularUser.id)
        .send({
          title: 'Thread with Invalid Attachments',
          content: 'Test',
          attachments: [
            { url: 'https://example.com/valid.pdf', filename: 'valid.pdf' },
            { filename: 'no-url.pdf' }, // Invalid - no URL
            'invalid-string' // Invalid - not an object
          ]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.thread.attachments).toHaveLength(1);
      expect(res.body.thread.attachments[0].filename).toBe('valid.pdf');
    });
  });
});
