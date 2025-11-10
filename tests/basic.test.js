const request = require('supertest');
const app = require('../src/server');

describe('basic server', () => {
  test('GET / returns status 200 and message', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});
