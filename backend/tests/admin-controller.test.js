// __tests__/admin-controller
 
const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Movie = require('../models/Movies');
const { kafka } = require('../kafka/client');
const app = require('../app'); // assuming you have an express app setup

jest.mock('../models/Admin');
jest.mock('../models/Movies');
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../kafka/client', () => ({
  kafka: {
    producer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      send: jest.fn(),
      disconnect: jest.fn(),
    }),
    consumer: jest.fn().mockReturnValue({
      connect: jest.fn(),
      subscribe: jest.fn(),
      run: jest.fn(),
    }),
  },
}));

describe('Admin Controller', () => {
  beforeAll(async () => {
    // Setup any required initial state or data
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
 
  });

  describe('addAdmin', () => {
    it('should create a new admin', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findOne.mockResolvedValue(null);
      bcrypt.hashSync.mockReturnValue('hashedpassword');
      Admin.prototype.save = jest.fn().mockResolvedValue({
        email: 'test@example.com',
      });

      await require('../controllers/admin-controller').addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin created',
        admin: expect.objectContaining({ email: 'test@example.com' }),
      });
    });

    it('should return 400 if admin already exists', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findOne.mockResolvedValue({ email: 'test@example.com' });

      await require('../controllers/admin-controller').addAdmin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin Already Exists',
      });
    });
  });

  describe('adminLogin', () => {
    it('should login an admin', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findOne.mockResolvedValue({
        email: 'test@example.com',
        password: 'hashedpassword',
        _id: 'adminId123',
      });
      bcrypt.compareSync.mockReturnValue(true);
      jwt.sign.mockReturnValue('valid-token');

      await require('../controllers/admin-controller').adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication Successful',
        token: 'valid-token',
        id: 'adminId123',
      });
    });

    it('should return 400 for incorrect password', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findOne.mockResolvedValue({
        email: 'test@example.com',
        password: 'hashedpassword',
      });
      bcrypt.compareSync.mockReturnValue(false);

      await require('../controllers/admin-controller').adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Incorrect Password',
      });
    });

    it('should return 401 if admin not found', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findOne.mockResolvedValue(null);

      await require('../controllers/admin-controller').adminLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Admin not found',
      });
    });
  });

  describe('deleteAdminByID', () => {
    it('should delete an admin by ID', async () => {
      const req = {
        params: { id: 'adminId123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findByIdAndDelete.mockResolvedValue({ _id: 'adminId123' });

      await require('../controllers/admin-controller').deleteAdminByID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith('Admin Successfully Deleted');
    });

    it('should return an error if admin not found', async () => {
      const req = {
        params: { id: 'nonexistentId' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Admin.findByIdAndDelete.mockResolvedValue(null);

      await require('../controllers/admin-controller').deleteAdminByID(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Cannot find Admin',
      });
    });
  });

  // Add more tests for the remaining functions
});
