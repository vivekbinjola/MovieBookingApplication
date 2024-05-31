const express = require('express');
const bookingRouter = express.Router();

const { Booking, deleteBooking, getBookingsbyName } = require('../controllers/booking-controller');

bookingRouter.post("/", Booking);
bookingRouter.post("/:movieId", getBookingsbyName);
bookingRouter.delete('/:id', deleteBooking);
 
module.exports = bookingRouter; 