// __tests__/booking-controller
 
const mongoose = require('mongoose');
const request = require('supertest');
const Booking = require('../models/Booking');
const Movie = require('../models/Movies');
const User = require('../models/User');
const app = require('../app'); // assuming you have an express app setup
const { kafka } = require('../kafka/client');

jest.mock('../models/Booking');
jest.mock('../models/Movies');
jest.mock('../models/User');
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

describe('Booking Controller', () => {
  beforeAll(async () => {
    // Setup any required initial state or data
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
   
  });

  describe('Booking', () => {
    it('should create a new booking', async () => {
      const req = {
        body: {
          movie: 'movieId123',
          date: '2024-05-01',
          seatNumber: 'A1',
          tickets: 2,
          user: 'userId123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
      };

      mongoose.startSession = jest.fn().mockResolvedValue(session);
      Movie.findById.mockResolvedValue({
        _id: 'movieId123',
        noOfTickets: 10,
        bookedTickets: 0,
        bookings: [],
        save: jest.fn(),
      });
      User.findById.mockResolvedValue({
        _id: 'userId123',
        bookings: [],
        save: jest.fn(),
      });
      Booking.prototype.save = jest.fn().mockResolvedValue({});

      await require('../controllers/booking-controller').Booking(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        newBooking: expect.any(Object),
      });
    });

    it('should return 404 if movie not found', async () => {
      const req = {
        body: {
          movie: 'movieId123',
          date: '2024-05-01',
          seatNumber: 'A1',
          tickets: 2,
          user: 'userId123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Movie.findById.mockResolvedValue(null);

      await require('../controllers/booking-controller').Booking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Movie not found by given id',
      });
    });

    it('should return 404 if user not found', async () => {
      const req = {
        body: {
          movie: 'movieId123',
          date: '2024-05-01',
          seatNumber: 'A1',
          tickets: 2,
          user: 'userId123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Movie.findById.mockResolvedValue({});
      User.findById.mockResolvedValue(null);

      await require('../controllers/booking-controller').Booking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not found by given id',
      });
    });

    it('should return 404 if no tickets available', async () => {
      const req = {
        body: {
          movie: 'movieId123',
          date: '2024-05-01',
          seatNumber: 'A1',
          tickets: 2,
          user: 'userId123',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Movie.findById.mockResolvedValue({
        _id: 'movieId123',
        noOfTickets: 0,
        bookedTickets: 0,
        bookings: [],
        save: jest.fn(),
      });
      User.findById.mockResolvedValue({});

      await require('../controllers/booking-controller').Booking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No Tickets Available : SOLD OUT',
      });
    });
  });

  describe('deleteBooking', () => {
    it('should delete a booking by ID', async () => {
      const req = {
        params: { id: 'bookingId123' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      const session = {
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
      };

      mongoose.startSession = jest.fn().mockResolvedValue(session);
      Booking.findByIdAndRemove.mockResolvedValue({
        _id: 'bookingId123',
        user: { bookings: { pull: jest.fn(), save: jest.fn() } },
        movie: { bookings: { pull: jest.fn(), save: jest.fn() } },
      });

      await require('../controllers/booking-controller').deleteBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking deleted successfully',
      });
    });

    it('should return 404 if booking not found', async () => {
      const req = {
        params: { id: 'nonexistentBookingId' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      Booking.findByIdAndRemove.mockResolvedValue(null);

      await require('../controllers/booking-controller').deleteBooking(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Booking not found by given id',
      });
    });
  });
});
