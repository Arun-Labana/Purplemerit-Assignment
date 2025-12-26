import request from 'supertest';
import app from '../../../src/app';

describe('Projects API Integration Tests', () => {
  let accessToken: string;
  let userId: string;

  beforeAll(async () => {
    // Register and login to get token - use unique email
    const uniqueEmail = `projects-${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail,
        name: 'Projects User',
        password: 'TestPassword123!',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.user).toBeDefined();
    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;
  });

  describe('POST /api/v1/projects', () => {
    it('should create a project with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Project',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Project');
      expect(response.body.data.ownerId).toBe(userId);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Test Project',
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'AB', // Too short
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should list user projects', async () => {
      const response = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

