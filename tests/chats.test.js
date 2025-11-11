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

describe('Private Chats API', () => {
  let user1, user2, user3, user4;
  
  beforeEach(async () => {
    cleanDb();
    
    // Create test users
    user1 = store.createUser({
      id: 'user-1',
      email: 'user1@test.edu',
      name: 'User One',
      verified: true,
      role: 'user'
    });
    
    user2 = store.createUser({
      id: 'user-2',
      email: 'user2@test.edu',
      name: 'User Two',
      verified: true,
      role: 'user'
    });
    
    user3 = store.createUser({
      id: 'user-3',
      email: 'user3@test.edu',
      name: 'User Three',
      verified: true,
      role: 'user'
    });
    
    user4 = store.createUser({
      id: 'user-4',
      email: 'user4@test.edu',
      name: 'User Four',
      verified: true,
      role: 'user'
    });
    
    // Create friendships
    await request(app)
      .post('/friends')
      .set('X-User-Id', user1.id)
      .send({ friendId: user2.id });
    
    await request(app)
      .post('/friends')
      .set('X-User-Id', user1.id)
      .send({ friendId: user3.id });
  });
  
  afterAll(() => {
    cleanDb();
  });
  
  describe('POST /chats - Create Private Chat', () => {
    test('can create a chat with friends', async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          name: 'Test Chat',
          participantIds: [user2.id, user3.id]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.chat).toHaveProperty('id');
      expect(res.body.chat.name).toBe('Test Chat');
      expect(res.body.chat.participants).toContain(user1.id);
      expect(res.body.chat.participants).toContain(user2.id);
      expect(res.body.chat.participants).toContain(user3.id);
      expect(res.body.chat.participants).toHaveLength(3);
      expect(res.body.chat.createdBy).toBe(user1.id);
    });
    
    test('automatically includes creator in participants', async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.chat.participants).toContain(user1.id);
      expect(res.body.chat.participants).toContain(user2.id);
    });
    
    test('requires minimum 2 participants', async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: []
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('minimum 2 participants required');
    });
    
    test('cannot create chat with non-friend', async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user4.id]
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('can only create chat with friends');
    });
    
    test('cannot create chat with blocked user', async () => {
      // Block user2
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('cannot create chat with blocked users');
    });
    
    test('can create chat with optional name and avatar', async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          name: 'My Group',
          avatar: 'https://example.com/avatar.png',
          participantIds: [user2.id, user3.id]
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.chat.name).toBe('My Group');
      expect(res.body.chat.avatar).toBe('https://example.com/avatar.png');
    });
  });
  
  describe('GET /chats - List User Chats', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          name: 'Test Chat',
          participantIds: [user2.id, user3.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('lists all user chats', async () => {
      const res = await request(app)
        .get('/chats')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chats).toHaveLength(1);
      expect(res.body.chats[0].id).toBe(chatId);
      expect(res.body.chats[0].participants).toHaveLength(3);
    });
    
    test('returns chat with participant info', async () => {
      const res = await request(app)
        .get('/chats')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chats[0].participants[0]).toHaveProperty('name');
      expect(res.body.chats[0].participants[0]).toHaveProperty('email');
    });
  });
  
  describe('GET /chats/:chatId - Get Chat Details', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          name: 'Test Chat',
          participantIds: [user2.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('returns chat details', async () => {
      const res = await request(app)
        .get(`/chats/${chatId}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(chatId);
      expect(res.body.name).toBe('Test Chat');
      expect(res.body.participants).toHaveLength(2);
    });
    
    test('non-participant cannot access chat', async () => {
      const res = await request(app)
        .get(`/chats/${chatId}`)
        .set('X-User-Id', user3.id);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('not a participant of this chat');
    });
    
    test('returns 404 for non-existent chat', async () => {
      const res = await request(app)
        .get('/chats/non-existent')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('chat not found');
    });
  });
  
  describe('PATCH /chats/:chatId - Update Chat', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          name: 'Original Name',
          participantIds: [user2.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('can rename chat', async () => {
      const res = await request(app)
        .patch(`/chats/${chatId}`)
        .set('X-User-Id', user1.id)
        .send({ name: 'New Name' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chat.name).toBe('New Name');
    });
    
    test('can change avatar', async () => {
      const res = await request(app)
        .patch(`/chats/${chatId}`)
        .set('X-User-Id', user1.id)
        .send({ avatar: 'https://example.com/new-avatar.png' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chat.avatar).toBe('https://example.com/new-avatar.png');
    });
    
    test('non-participant cannot update chat', async () => {
      const res = await request(app)
        .patch(`/chats/${chatId}`)
        .set('X-User-Id', user3.id)
        .send({ name: 'Hacked Name' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('not a participant of this chat');
    });
    
    test('validates name length', async () => {
      const longName = 'a'.repeat(101);
      const res = await request(app)
        .patch(`/chats/${chatId}`)
        .set('X-User-Id', user1.id)
        .send({ name: longName });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('name must be 100 characters or less');
    });
  });
  
  describe('POST /chats/:chatId/participants - Add Participant', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('can add friend to chat', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/participants`)
        .set('X-User-Id', user1.id)
        .send({ userId: user3.id });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.chat.participants).toContain(user3.id);
      expect(res.body.chat.participants).toHaveLength(3);
    });
    
    test('cannot add non-friend', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/participants`)
        .set('X-User-Id', user1.id)
        .send({ userId: user4.id });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('can only add friends to chat');
    });
    
    test('cannot add blocked user', async () => {
      // Add user3 as friend first
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user4.id });
      
      // Block user4
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user4.id });
      
      const res = await request(app)
        .post(`/chats/${chatId}/participants`)
        .set('X-User-Id', user1.id)
        .send({ userId: user4.id });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('cannot add blocked user');
    });
    
    test('cannot add duplicate participant', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/participants`)
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('user already a participant');
    });
  });
  
  describe('DELETE /chats/:chatId/participants/:userId - Remove Participant', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id, user3.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('can remove participant', async () => {
      const res = await request(app)
        .delete(`/chats/${chatId}/participants/${user3.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      // Verify participant removed
      const chat = store.getPrivateChatById(chatId);
      expect(chat.participants).not.toContain(user3.id);
      expect(chat.participants).toHaveLength(2);
    });
    
    test('user can leave chat', async () => {
      const res = await request(app)
        .delete(`/chats/${chatId}/participants/${user1.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      
      const chat = store.getPrivateChatById(chatId);
      expect(chat.participants).not.toContain(user1.id);
    });
    
    test('chat is deleted when no participants remain', async () => {
      await request(app)
        .delete(`/chats/${chatId}/participants/${user2.id}`)
        .set('X-User-Id', user1.id);
      
      await request(app)
        .delete(`/chats/${chatId}/participants/${user3.id}`)
        .set('X-User-Id', user1.id);
      
      const res = await request(app)
        .delete(`/chats/${chatId}/participants/${user1.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('chat deleted');
      
      const chat = store.getPrivateChatById(chatId);
      expect(chat).toBeNull();
    });
  });
  
  describe('POST /chats/:chatId/mute - Mute/Unmute Chat', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('can mute chat', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/mute`)
        .set('X-User-Id', user1.id)
        .send({ mute: true });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('chat muted');
      
      const chat = store.getPrivateChatById(chatId);
      expect(chat.mutedBy).toContain(user1.id);
    });
    
    test('can unmute chat', async () => {
      await request(app)
        .post(`/chats/${chatId}/mute`)
        .set('X-User-Id', user1.id)
        .send({ mute: true });
      
      const res = await request(app)
        .post(`/chats/${chatId}/mute`)
        .set('X-User-Id', user1.id)
        .send({ mute: false });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('chat unmuted');
      
      const chat = store.getPrivateChatById(chatId);
      expect(chat.mutedBy).not.toContain(user1.id);
    });
    
    test('requires boolean mute parameter', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/mute`)
        .set('X-User-Id', user1.id)
        .send({ mute: 'yes' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('mute must be a boolean');
    });
  });
  
  describe('POST /chats/:chatId/messages - Send Message', () => {
    let chatId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      chatId = res.body.chat.id;
    });
    
    test('can send message', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user1.id)
        .send({ content: 'Hello, World!' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.content).toBe('Hello, World!');
      expect(res.body.data.authorId).toBe(user1.id);
      expect(res.body.data.chatId).toBe(chatId);
    });
    
    test('non-participant cannot send message', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user3.id)
        .send({ content: 'Unauthorized message' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('not a participant of this chat');
    });
    
    test('requires content', async () => {
      const res = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user1.id)
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('content is required');
    });
    
    test('validates content length', async () => {
      const longContent = 'a'.repeat(10001);
      const res = await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user1.id)
        .send({ content: longContent });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('content must be 10000 characters or less');
    });
  });
  
  describe('GET /chats/:chatId/messages - Get Messages', () => {
    let chatId;
    
    beforeEach(async () => {
      const chatRes = await request(app)
        .post('/chats')
        .set('X-User-Id', user1.id)
        .send({
          participantIds: [user2.id]
        });
      chatId = chatRes.body.chat.id;
      
      // Send some messages
      await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user1.id)
        .send({ content: 'Message 1' });
      
      await request(app)
        .post(`/chats/${chatId}/messages`)
        .set('X-User-Id', user2.id)
        .send({ content: 'Message 2' });
    });
    
    test('can retrieve messages', async () => {
      const res = await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0]).toHaveProperty('content');
      expect(res.body.messages[0]).toHaveProperty('authorName');
    });
    
    test('non-participant cannot retrieve messages', async () => {
      const res = await request(app)
        .get(`/chats/${chatId}/messages`)
        .set('X-User-Id', user3.id);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('not a participant of this chat');
    });
    
    test('respects limit parameter', async () => {
      const res = await request(app)
        .get(`/chats/${chatId}/messages?limit=1`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.messages).toHaveLength(1);
    });
  });
});
