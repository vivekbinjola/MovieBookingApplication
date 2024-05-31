const bcrypt = require('bcryptjs');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { kafka } = require('../kafka/client');
const app = require('../app');
const Movie = require('../models/Movies');
const Admin = require('../models/Admin');
const {
  getAllUser,
  signUp,
  deleteUser,
  logIn,
//   getBookingofUser,
//   getUserById,
//   forgotPassword,
} = require('../controllers/user-controller'); // Adjust the path to your controller file
const User = require('../models/User'); // Adjust the path to your User model file
const Bookings = require('../models/Booking'); // Adjust the path to your Booking model file

jest.mock('bcryptjs', () => ({
  compareSync: jest.fn(),
  hashSync: jest.fn(),
}));

jest.mock('../models/User', () => ({
  find: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findById: jest.fn(),
  findByIdAndDelete: jest.fn(),
}));

jest.mock('../models/Booking', () => ({
  find: jest.fn(),
}));
jest.mock('../models/Booking');
jest.mock('../models/Admin');
jest.mock('../models/Movies');
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('mongoose');
jest.mock('../kafka/client');
describe('User Controller', () => {
    beforeAll(async () => {
        // Setup any required initial state or data
      });
    
      afterEach(() => {
        jest.clearAllMocks();
      });
    
      afterAll(async () => {
        await mongoose.disconnect();

      });
 

  describe('getAllUser', () => {
    it('should return all users', async () => {
      const mockUsers = [{ name: 'User1' }, { name: 'User2' }];
      User.find.mockResolvedValue(mockUsers);

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await getAllUser(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it('should handle errors', async () => {
      User.find.mockRejectedValue('Database error');

      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await getAllUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected error occured.' });
    });
  });

  describe('signUp', () => {
    it('should sign up a new user', async () => {
      const req = { body: { name: 'Test User', email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      bcrypt.hashSync.mockReturnValue('hashedPassword');
      User.create.mockResolvedValue({ _id: 'user_id' });

      await signUp(req, res);

      expect(bcrypt.hashSync).toHaveBeenCalledWith('password123');
      expect(User.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'user_id' });
    });

    it('should handle invalid inputs', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Inputs' });
    });

    it('should handle database errors', async () => {
      const req = { body: { name: 'Test User', email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      bcrypt.hashSync.mockReturnValue('hashedPassword');
      User.create.mockRejectedValue('Database error');

      await signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unexpected Error Occurred' });
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      const req = { params: { id: 'user_id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      User.findByIdAndDelete.mockResolvedValue({ _id: 'user_id' });

      await deleteUser(req, res);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith('user_id');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Deleted successfully', user: { _id: 'user_id' } });
    });

    it('should handle errors', async () => {
      const req = { params: { id: 'user_id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      User.findByIdAndDelete.mockRejectedValue('Database error');

      await deleteUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Something went wrong' });
    });
  });

  describe('logIn', () => {
    it('should log in a user with correct credentials', async () => {
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const existingUser = { _id: 'user_id', email: 'test@example.com', password: 'hashedPassword' };
      User.findOne.mockResolvedValue(existingUser);
      bcrypt.compareSync.mockReturnValue(true);
  
      await logIn(req, res);
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Login Successful', id: 'user_id' });
    });
  
    it('should handle invalid inputs', async () => {
      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      await logIn(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Inputs' });
    });
  
    it('should handle user not found', async () => {
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      User.findOne.mockResolvedValue(null);
  
      await logIn(req, res);
  
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  
    it('should handle incorrect password', async () => {
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      const existingUser = { _id: 'user_id', email: 'test@example.com', password: 'hashedPassword' };
      User.findOne.mockResolvedValue(existingUser);
      bcrypt.compareSync.mockReturnValue(false);
  
      await logIn(req, res);
  
      expect(bcrypt.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incorrect Password' });
    });
  
    it('should handle database errors', async () => {
      const req = { body: { email: 'test@example.com', password: 'password123' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
  
      User.findOne.mockRejectedValue('Database error');
  
      await logIn(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'An error occurred' });
    });
  });
  
})

