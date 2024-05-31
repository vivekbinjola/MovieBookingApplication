const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { kafka } = require('../kafka/client');
const app = require('../app');
const Movie = require('../models/Movies');
const Admin = require('../models/Admin');
const {
  addMovie,
  getAllMovie,
  getMovieById,
  getMovieByName,
  deleteMovieById,
  getmovieBookingsbyName,
  deleteMoviesUsingKafka,
} = require('../controllers/movie-controller');
jest.mock('../models/Booking');
jest.mock('../models/Admin');
jest.mock('../models/Movies');
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('mongoose');
jest.mock('../kafka/client');

describe('Movie Controller', () => {
 
    beforeAll(async () => {
      // Setup any required initial state or data
      // await mongoose.connect();
    });

  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    afterAll(async () => {
      await mongoose.disconnect();
     
  });

  describe('addMovie', () => {
    it('should add a new movie with valid data and a valid token', async () => {
      // Mock token verification
      jwt.verify.mockReturnValueOnce({ id: 'validAdminId' });

      // Mock save function of Movie model
      Movie.prototype.save = jest.fn().mockResolvedValueOnce({
        _id: 'validMovieId',
        title: 'Test Movie',
        description: 'Test Description',
        // Add other fields as needed
      });

      // Mock findOne function of Admin model
      Admin.findOne.mockResolvedValueOnce({ _id: 'validAdminId' });

      // Mock request object
      const req = {
        headers: {
          authorization: 'Bearer validToken',
        },
        body: {
          title: 'Test Movie',
          description: 'Test Description',
          // Add other fields as needed
        },
      };

      // Mock response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Execute addMovie controller function
      await addMovie(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        movie: {
          _id: 'validMovieId',
          title: 'Test Movie',
          description: 'Test Description',
          // Add other fields as needed
        },
      });
    });

    it('should return 404 if token is missing', async () => {
      // Mock request object
      const req = {
        headers: {},
        body: {
          title: 'Test Movie',
          description: 'Test Description',
          // Add other fields as needed
        },
      };

      // Mock response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Execute addMovie controller function
      await addMovie(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Token not found' });
    });

    // Add more test cases for addMovie function
  });
  describe('deleteMoviesUsingKafka', () => {
    it('should delete a movie using Kafka consumer', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const consumerMock = kafka.consumer();
      consumerMock.run.mockImplementationOnce(async (callback) => {
        await callback({
          topic: 'movies',
          partition: 0,
          message: { value: JSON.stringify({ _id: 'movie_id' }) },
          heartbeat: jest.fn(),
          pause: jest.fn(),
        });
      });
  
      await deleteMoviesUsingKafka(req, res);
  
      expect(kafka.consumer).toHaveBeenCalledWith({ groupId: 'my-group' });
      expect(consumerMock.connect).toHaveBeenCalled();
      expect(consumerMock.subscribe).toHaveBeenCalledWith({ topics: ['movies'], fromBeginning: true });
      expect(consumerMock.run).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Deletion Successful' });
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
    });
  
    it('should handle movie not found', async () => {
      const req = {};
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const consumerMock = kafka.consumer();
      consumerMock.run.mockImplementationOnce(async (callback) => {
        await callback({
          topic: 'movies',
          partition: 0,
          message: { value: JSON.stringify({ _id: 'invalid_id' }) },
          heartbeat: jest.fn(),
          pause: jest.fn(),
        });
      });
      const findByIdAndDeleteMock = require('../models/Movies').findByIdAndDelete;
      findByIdAndDeleteMock.mockResolvedValueOnce(null);
  
      await deleteMoviesUsingKafka(req, res);
  
      expect(kafka.consumer).toHaveBeenCalledWith({ groupId: 'my-group' });
      expect(consumerMock.connect).toHaveBeenCalled();
      expect(consumerMock.subscribe).toHaveBeenCalledWith({ topics: ['movies'], fromBeginning: true });
      expect(consumerMock.run).toHaveBeenCalled();
      expect(findByIdAndDeleteMock).toHaveBeenCalledWith('invalid_id');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Movie Not Found' });
      expect(res.status).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllMovie', () => {
    it('should return all movies', async () => {
      // Mock find function of Movie model
      Movie.find.mockResolvedValueOnce([
        {
          _id: 'movieId1',
          title: 'Test Movie 1',
          description: 'Description 1',
          // Add other fields as needed
        },
        {
          _id: 'movieId2',
          title: 'Test Movie 2',
          description: 'Description 2',
          // Add other fields as needed
        },
      ]);

      // Mock request object
      const req = {};
      // Mock response object
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      // Execute getAllMovie controller function
      await getAllMovie(req, res);

      // Assertions
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        movies: [
          {
            _id: 'movieId1',
            title: 'Test Movie 1',
            description: 'Description 1',
     
          },
          {
            _id: 'movieId2',
            title: 'Test Movie 2',
            description: 'Description 2',
           
          },
        ],
      });
    });
 
  });
 
});

