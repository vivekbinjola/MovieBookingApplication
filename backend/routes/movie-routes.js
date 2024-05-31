const express = require('express');
const movieRouter = express.Router();

const { addMovie, getAllMovie, getMovieById, getMovieByName,deleteMovieById,getmovieBookingsbyName, deleteMoviesUsingKafka, getBookingsbyName} = require('../controllers/movie-controller');
const { deleteMovieUsingKafka } = require('../controllers/admin-controller');

movieRouter.get("/", getAllMovie);
movieRouter.get("/name", getMovieByName);
movieRouter.get("/bookingsByName", getmovieBookingsbyName);
movieRouter.delete("/deleteMoviesConsumer", deleteMoviesUsingKafka);
movieRouter.post("/add", addMovie);
movieRouter.post("/:name", getBookingsbyName);
movieRouter.get("/:id", getMovieById)
movieRouter.delete("/:id", deleteMovieById )

 
module.exports = movieRouter