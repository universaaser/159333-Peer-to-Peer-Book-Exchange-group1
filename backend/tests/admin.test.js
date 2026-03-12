const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const fs = require('fs');
const app = require('../app');

let mongo;

const registerUser = async (user) => {
  return request(app).post('/api/auth/register').send(user);
};

const loginUser = async (email, password) => {
  return request(app).post('/api/auth/login').send({ email, password });
};

describe('Admin moderation flow', () => {
  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.ADMIN_SECRET = 'test_admin_secret';
    if (process.env.MONGO_URI_TEST) {
      await mongoose.connect(process.env.MONGO_URI_TEST);
      return;
    }

    const cacheDir = path.join(__dirname, '..', '.mongo-cache');
    fs.mkdirSync(cacheDir, { recursive: true });
    process.env.MONGOMS_DOWNLOAD_DIR = cacheDir;
    process.env.MONGOMS_TMPDIR = cacheDir;
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  it('supports admin approval, reporting, and banning', async () => {
    const adminUser = {
      username: 'admin',
      email: 'admin@test.local',
      password: 'Password123!'
    };
    const buyerUser = {
      username: 'buyer',
      email: 'buyer@test.local',
      password: 'Password123!'
    };

    await registerUser(adminUser);
    await registerUser(buyerUser);

    const promoteRes = await request(app)
      .post('/api/auth/admin/promote')
      .set('X-Admin-Secret', process.env.ADMIN_SECRET)
      .send({ email: adminUser.email });
    expect(promoteRes.statusCode).toBe(200);

    const adminLogin = await loginUser(adminUser.email, adminUser.password);
    expect(adminLogin.statusCode).toBe(200);
    expect(adminLogin.body.user.role).toBe('admin');
    const adminToken = adminLogin.body.token;

    const buyerLogin = await loginUser(buyerUser.email, buyerUser.password);
    expect(buyerLogin.statusCode).toBe(200);
    const buyerToken = buyerLogin.body.token;

    const listingRes = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        title: 'Test Listing',
        description: 'A test listing',
        price: 12,
        condition: 'Good',
        images: [],
        course: 'COMP101',
        subject: 'CS'
      });
    expect(listingRes.statusCode).toBe(201);
    expect(listingRes.body.status).toBe('pending');
    const listingId = listingRes.body._id;

    const pendingRes = await request(app)
      .get('/api/listings?status=pending&includeFlagged=true')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(pendingRes.statusCode).toBe(200);
    expect(pendingRes.body.data.length).toBeGreaterThan(0);

    const approveRes = await request(app)
      .patch(`/api/listings/${listingId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'available' });
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.status).toBe('available');

    const reportRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ listingId, reason: 'Inappropriate content' });
    expect(reportRes.statusCode).toBe(201);

    const reportList = await request(app)
      .get('/api/reports')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(reportList.statusCode).toBe(200);
    expect(reportList.body.length).toBeGreaterThan(0);

    const banRes = await request(app)
      .patch(`/api/reports/user/${buyerLogin.body.user.id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isBanned: true });
    expect(banRes.statusCode).toBe(200);
    expect(banRes.body.isBanned).toBe(true);

    const buyerTx = await request(app)
      .get('/api/transactions/my')
      .set('Authorization', `Bearer ${buyerToken}`);
    expect(buyerTx.statusCode).toBe(403);
  });
});
