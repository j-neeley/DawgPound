const request = require('supertest');
const app = require('../src/server');

describe('Auth API', () => {
  describe('POST /auth/signup', () => {
    test('creates a new user with valid university email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@university.edu',
          name: 'Test User'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('verificationToken');
      expect(res.body.message).toMatch(/signup created/);
    });

    test('returns 403 for non-university email', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@gmail.com',
          name: 'Test User'
        });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.error).toMatch(/university address/);
    });

    test('returns 400 when email is missing', async () => {
      const res = await request(app)
        .post('/auth/signup')
        .send({
          name: 'Test User'
        });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/email required/);
    });

    test('regenerates token for existing user (login flow)', async () => {
      // First signup
      const firstRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@university.edu',
          name: 'Existing User'
        });
      
      expect(firstRes.statusCode).toBe(200);
      const firstToken = firstRes.body.verificationToken;

      // Try to signup/login again with same email
      const secondRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'existing@university.edu',
          name: 'Existing User'
        });
      
      expect(secondRes.statusCode).toBe(200);
      expect(secondRes.body).toHaveProperty('userId');
      expect(secondRes.body).toHaveProperty('verificationToken');
      expect(secondRes.body.verificationToken).not.toBe(firstToken); // Should be a new token
      expect(secondRes.body.message).toMatch(/verification token regenerated/);
    });
  });

  describe('POST /auth/verify', () => {
    test('verifies a valid token', async () => {
      // First create a user
      const signupRes = await request(app)
        .post('/auth/signup')
        .send({
          email: 'verify@university.edu',
          name: 'Verify User'
        });
      
      const token = signupRes.body.verificationToken;
      const userId = signupRes.body.userId;

      // Then verify
      const verifyRes = await request(app)
        .post('/auth/verify')
        .send({ token });
      
      expect(verifyRes.statusCode).toBe(200);
      expect(verifyRes.body.userId).toBe(userId);
      expect(verifyRes.body.message).toMatch(/email verified/);
    });

    test('returns 400 when token is missing', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toMatch(/token required/);
    });

    test('returns 404 for invalid token', async () => {
      const res = await request(app)
        .post('/auth/verify')
        .send({ token: 'invalid-token-12345' });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.error).toMatch(/invalid token/);
    });
  });
});
