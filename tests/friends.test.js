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

describe('Friends and Blocking API', () => {
  let user1, user2, user3;
  
  beforeEach(() => {
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
  });
  
  afterAll(() => {
    cleanDb();
  });
  
  describe('Friend Request Flow', () => {
    describe('POST /friends/requests - Send Friend Request', () => {
      test('user can send a friend request', async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        expect(res.statusCode).toBe(201);
        expect(res.body.request).toHaveProperty('id');
        expect(res.body.request.fromUserId).toBe(user1.id);
        expect(res.body.request.toUserId).toBe(user2.id);
        expect(res.body.request.status).toBe('pending');
      });
      
      test('cannot send request to self', async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user1.id });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('cannot send friend request to yourself');
      });
      
      test('cannot send request if already friends', async () => {
        await request(app)
          .post('/friends')
          .set('X-User-Id', user1.id)
          .send({ friendId: user2.id });
        
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('already friends');
      });
      
      test('cannot send request if blocked', async () => {
        await request(app)
          .post('/friends/block')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('cannot send friend request due to block');
      });
      
      test('cannot send duplicate request', async () => {
        await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('friend request already pending');
      });
      
      test('cannot send request to non-existent user', async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: 'non-existent' });
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('user not found');
      });
    });
    
    describe('GET /friends/requests/incoming - List Incoming Requests', () => {
      beforeEach(async () => {
        await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user3.id)
          .send({ userId: user2.id });
      });
      
      test('lists all incoming friend requests', async () => {
        const res = await request(app)
          .get('/friends/requests/incoming')
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.requests).toHaveLength(2);
        expect(res.body.requests[0].fromUser).toHaveProperty('id');
        expect(res.body.requests[0].fromUser).toHaveProperty('name');
        expect(res.body.requests[0]).toHaveProperty('status', 'pending');
      });
      
      test('returns empty array if no incoming requests', async () => {
        const res = await request(app)
          .get('/friends/requests/incoming')
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.requests).toHaveLength(0);
      });
    });
    
    describe('GET /friends/requests/outgoing - List Outgoing Requests', () => {
      beforeEach(async () => {
        await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        
        await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user3.id });
      });
      
      test('lists all outgoing friend requests', async () => {
        const res = await request(app)
          .get('/friends/requests/outgoing')
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.requests).toHaveLength(2);
        expect(res.body.requests[0].toUser).toHaveProperty('id');
        expect(res.body.requests[0].toUser).toHaveProperty('name');
        expect(res.body.requests[0]).toHaveProperty('status', 'pending');
      });
    });
    
    describe('POST /friends/requests/:requestId/accept - Accept Friend Request', () => {
      let requestId;
      
      beforeEach(async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        requestId = res.body.request.id;
      });
      
      test('can accept a friend request', async () => {
        const res = await request(app)
          .post(`/friends/requests/${requestId}/accept`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('friend request accepted');
        expect(res.body.friendship).toHaveProperty('id');
        
        // Verify friendship was created
        const friendship = store.getFriendship(user1.id, user2.id);
        expect(friendship).not.toBeNull();
      });
      
      test('only recipient can accept request', async () => {
        const res = await request(app)
          .post(`/friends/requests/${requestId}/accept`)
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('not authorized to accept this request');
      });
      
      test('cannot accept non-existent request', async () => {
        const res = await request(app)
          .post('/friends/requests/non-existent/accept')
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('friend request not found');
      });
      
      test('cannot accept already accepted request', async () => {
        await request(app)
          .post(`/friends/requests/${requestId}/accept`)
          .set('X-User-Id', user2.id);
        
        const res = await request(app)
          .post(`/friends/requests/${requestId}/accept`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('request is not pending');
      });
      
      test('request is cancelled if blocked after request was sent', async () => {
        // Block the requester (this cancels the pending request)
        await request(app)
          .post('/friends/block')
          .set('X-User-Id', user2.id)
          .send({ userId: user1.id });
        
        // The request should no longer exist
        const res = await request(app)
          .post(`/friends/requests/${requestId}/accept`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('friend request not found');
      });
    });
    
    describe('POST /friends/requests/:requestId/decline - Decline Friend Request', () => {
      let requestId;
      
      beforeEach(async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        requestId = res.body.request.id;
      });
      
      test('can decline a friend request', async () => {
        const res = await request(app)
          .post(`/friends/requests/${requestId}/decline`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('friend request declined');
        
        // Verify no friendship was created
        const friendship = store.getFriendship(user1.id, user2.id);
        expect(friendship).toBeNull();
      });
      
      test('only recipient can decline request', async () => {
        const res = await request(app)
          .post(`/friends/requests/${requestId}/decline`)
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('not authorized to decline this request');
      });
      
      test('cannot decline already declined request', async () => {
        await request(app)
          .post(`/friends/requests/${requestId}/decline`)
          .set('X-User-Id', user2.id);
        
        const res = await request(app)
          .post(`/friends/requests/${requestId}/decline`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toBe('request is not pending');
      });
    });
    
    describe('DELETE /friends/requests/:requestId - Cancel Friend Request', () => {
      let requestId;
      
      beforeEach(async () => {
        const res = await request(app)
          .post('/friends/requests')
          .set('X-User-Id', user1.id)
          .send({ userId: user2.id });
        requestId = res.body.request.id;
      });
      
      test('sender can cancel friend request', async () => {
        const res = await request(app)
          .delete(`/friends/requests/${requestId}`)
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('friend request cancelled');
        
        // Verify request was deleted
        const deletedRequest = store.getFriendRequest(requestId);
        expect(deletedRequest).toBeNull();
      });
      
      test('only sender can cancel request', async () => {
        const res = await request(app)
          .delete(`/friends/requests/${requestId}`)
          .set('X-User-Id', user2.id);
        
        expect(res.statusCode).toBe(403);
        expect(res.body.error).toBe('not authorized to cancel this request');
      });
      
      test('cannot cancel non-existent request', async () => {
        const res = await request(app)
          .delete('/friends/requests/non-existent')
          .set('X-User-Id', user1.id);
        
        expect(res.statusCode).toBe(404);
        expect(res.body.error).toBe('friend request not found');
      });
    });
  });
  
  describe('POST /friends - Add Friend (Instant)', () => {
    test('user can add a friend', async () => {
      const res = await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.friendship).toHaveProperty('id');
      expect(res.body.friendship.userId1).toBe(user1.id);
      expect(res.body.friendship.userId2).toBe(user2.id);
    });
    
    test('cannot add self as friend', async () => {
      const res = await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user1.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('cannot add yourself as friend');
    });
    
    test('cannot add same friend twice', async () => {
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      const res = await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('already friends');
    });
    
    test('cannot add friend if blocked', async () => {
      // Block user2
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      const res = await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe('cannot add friend due to block');
    });
    
    test('cannot add non-existent user', async () => {
      const res = await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: 'non-existent' });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('friend user not found');
    });
  });
  
  describe('GET /friends - List Friends', () => {
    beforeEach(async () => {
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user3.id });
    });
    
    test('lists all friends', async () => {
      const res = await request(app)
        .get('/friends')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.friends).toHaveLength(2);
      expect(res.body.friends[0]).toHaveProperty('id');
      expect(res.body.friends[0]).toHaveProperty('name');
      expect(res.body.friends[0]).toHaveProperty('friendsSince');
    });
  });
  
  describe('DELETE /friends/:friendId - Remove Friend', () => {
    beforeEach(async () => {
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
    });
    
    test('can remove a friend', async () => {
      const res = await request(app)
        .delete(`/friends/${user2.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('friend removed');
      
      // Verify friendship is gone
      const friendship = store.getFriendship(user1.id, user2.id);
      expect(friendship).toBeNull();
    });
    
    test('cannot remove non-friend', async () => {
      const res = await request(app)
        .delete(`/friends/${user3.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('friendship not found');
    });
  });
  
  describe('POST /friends/block - Block User', () => {
    test('can block a user', async () => {
      const res = await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.block).toHaveProperty('id');
      expect(res.body.block.blockerId).toBe(user1.id);
      expect(res.body.block.blockedId).toBe(user2.id);
    });
    
    test('blocking removes existing friendship', async () => {
      // Add friend
      await request(app)
        .post('/friends')
        .set('X-User-Id', user1.id)
        .send({ friendId: user2.id });
      
      // Block them
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      // Verify friendship is gone
      const friendship = store.getFriendship(user1.id, user2.id);
      expect(friendship).toBeNull();
    });
    
    test('blocking cancels pending friend requests', async () => {
      // Send friend request
      const reqRes = await request(app)
        .post('/friends/requests')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      const requestId = reqRes.body.request.id;
      
      // Block them
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      // Verify request was cancelled
      const cancelledRequest = store.getFriendRequest(requestId);
      expect(cancelledRequest).toBeNull();
    });
    
    test('cannot block self', async () => {
      const res = await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user1.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('cannot block yourself');
    });
    
    test('cannot block same user twice', async () => {
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      const res = await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('user already blocked');
    });
  });
  
  describe('GET /friends/blocked - List Blocked Users', () => {
    beforeEach(async () => {
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
      
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user3.id });
    });
    
    test('lists all blocked users', async () => {
      const res = await request(app)
        .get('/friends/blocked')
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.blocked).toHaveLength(2);
      expect(res.body.blocked[0]).toHaveProperty('id');
      expect(res.body.blocked[0]).toHaveProperty('name');
      expect(res.body.blocked[0]).toHaveProperty('blockedAt');
    });
  });
  
  describe('DELETE /friends/block/:userId - Unblock User', () => {
    beforeEach(async () => {
      await request(app)
        .post('/friends/block')
        .set('X-User-Id', user1.id)
        .send({ userId: user2.id });
    });
    
    test('can unblock a user', async () => {
      const res = await request(app)
        .delete(`/friends/block/${user2.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('user unblocked');
      
      // Verify block is gone
      const block = store.getBlock(user1.id, user2.id);
      expect(block).toBeNull();
    });
    
    test('cannot unblock non-blocked user', async () => {
      const res = await request(app)
        .delete(`/friends/block/${user3.id}`)
        .set('X-User-Id', user1.id);
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('block not found');
    });
  });
});
