// test/api.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app'); // Import your Express app (should be exported using module.exports)
const { sequelize, User, Exercise, Favorite, Save, Rating } = require('../models'); // Import models from models/index.js

describe('API Unit Tests', function () {
  let token, refreshToken, exerciseId;

  // Rebuild the database before running tests
  before(async function () {
    await sequelize.sync({ force: true });
  });

  describe('User Registration and Authentication', function () {
    it('should register a new user', async function () {
      const res = await request(app)
        .post('/users/register')
        .send({ username: 'testuser', password: 'testpass' });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('userId');
    });

    it('should log in the user and return tokens', async function () {
      const res = await request(app)
        .post('/users/login')
        .send({ username: 'testuser', password: 'testpass' });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('accessToken');
      expect(res.body).to.have.property('refreshToken');
      token = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should refresh the access token', async function () {
      const res = await request(app)
        .post('/users/refresh-token')
        .send({ refreshToken });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('accessToken');
      token = res.body.accessToken; // Update token
    });
  });

  describe('Exercise Related Endpoints', function () {
    it('should create a new exercise', async function () {
      const res = await request(app)
        .post('/exercises')
        .set('Authorization', 'Bearer ' + token)
        .send({
          name: 'Push Up',
          description: 'Upper body workout',
          difficulty: 3,
          isPublic: true,
        });
      expect(res.status).to.equal(201);
      expect(res.body).to.have.property('exercise');
      exerciseId = res.body.exercise.id;
    });

    it('should update the exercise', async function () {
      const res = await request(app)
        .put(`/exercises/${exerciseId}`)
        .set('Authorization', 'Bearer ' + token)
        .send({ description: 'Updated description' });
      expect(res.status).to.equal(200);
      expect(res.body.exercise.description).to.equal('Updated description');
    });

    it('should fetch the list of exercises', async function () {
      const res = await request(app)
        .get('/exercises')
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('exercises');
      expect(res.body.exercises).to.be.an('array');
    });

    it('should fetch a specific exercise by id', async function () {
      const res = await request(app)
        .get(`/exercises/${exerciseId}`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('id', exerciseId);
    });

    it('should favorite the exercise', async function () {
      const res = await request(app)
        .post(`/exercises/${exerciseId}/favorite`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Exercise favorited');
    });

    it('should remove the favorite from the exercise', async function () {
      const res = await request(app)
        .delete(`/exercises/${exerciseId}/favorite`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
    });

    it('should save the exercise', async function () {
      const res = await request(app)
        .post(`/exercises/${exerciseId}/save`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Exercise saved');
    });

    it('should remove the save from the exercise', async function () {
      const res = await request(app)
        .delete(`/exercises/${exerciseId}/save`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('message');
    });

    it('should rate the exercise', async function () {
      const res = await request(app)
        .post(`/exercises/${exerciseId}/rate`)
        .set('Authorization', 'Bearer ' + token)
        .send({ score: 4 });
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('rating');
      expect(res.body.rating.score).to.equal(4);
    });

    it('should fetch user collections of favorites and saves', async function () {
      const res = await request(app)
        .get('/users/collections')
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('collections');
      expect(res.body.collections).to.be.an('array');
    });

    it('should fetch the list of users who favorited the exercise', async function () {
      const res = await request(app)
        .get(`/exercises/${exerciseId}/favorites`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array');
    });

    it('should fetch the list of users who saved the exercise', async function () {
      const res = await request(app)
        .get(`/exercises/${exerciseId}/saves`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('users');
      expect(res.body.users).to.be.an('array');
    });

    it('should delete the exercise', async function () {
      const res = await request(app)
        .delete(`/exercises/${exerciseId}`)
        .set('Authorization', 'Bearer ' + token);
      expect(res.status).to.equal(200);
      expect(res.body.message).to.equal('Exercise deleted');
    });
  });

  describe('Public Exercise Endpoint', function () {
    it('should fetch the list of public exercises', async function () {
      const res = await request(app)
        .get('/public-exercises');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('exercises');
      expect(res.body.exercises).to.be.an('array');
    });
  });
});
