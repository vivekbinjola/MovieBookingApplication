const jwt = require("jsonwebtoken");
const Movie = require("../models/Movies");
const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const { kafka } = require("../kafka/client");

// By Admin Only, Required JWT Auth
const addMovie = async (req, res, next) => {
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token not found" });
  }
  console.log(extractedToken);
  let adminId;

  //verify token
  try{
  jwt.verify((extractedToken, process.env.SECRET_KEY), (err, decrypted) => {
    if (err) {
      // console.log(err.message);
      return res.status(401).json({ message: "Invalid Token" });
    } else {
      adminId = decrypted.id;
      return;
    }
    })
}catch(err){
    console.log(err.message.description);};

  //create new movie
  const {
    title,
    description,
    releaseDate,
    posterUrl,
    featured,
    actors,
    noOfTickets,
    admin,
  } = req.body;
  console.log(req.body);

  if (res.status == 400) {
    res.send("error");
  }
  if (
    !title &&
    title.trim() === "" &&
    !description &&
    description.trim() === "" &&
    !posterUrl &&
    posterUrl.trim() === ""
  ) {
    return res.status(422).json({ message: `Invalid Inputs` });
  }

  let movie;
  try {
    movie = new Movie({
      title,
      description,
      releaseDate: new Date(`${releaseDate}`),
      posterUrl,
      featured,
      actors,
      noOfTickets,
      admin,
    });

    const session = await mongoose.startSession();
    const adminUser = await Admin.findById(admin);

    session.startTransaction();
    await movie.save({ session });
    adminUser.addedMovies.push(movie);
    await adminUser.save({ session });

    await session.commitTransaction();
  } catch (err) {
    console.log(err.message);
    return res.send(err.message);
    
  }

  if (!movie) {
    return res.status(500).json({ message: "Request Failed" });
  }
  console.log("Movie Addes Successfully : ", movie);
  return res.status(201).json({ movie });
};

const getAllMovie = async (req, res, next) => {
  let movies;
  try {
    movies = await Movie.find();
  } catch (err) {
    return console.log(err);
  }

  if (!movies) {
    return res.status(500).json({ message: "Request failed" });
  }
  return res.status(200).json({ movies });
};

const getMovieById = async (req, res, next) => {
  const id = req.params.id;
  let movie;

  try {
    movie = await Movie.findById(id);
  } catch (err) {
    return console.log(err);
  }
  if (!movie) {
    return res.status(404).json({ message: "Invalid Movie Id" });
  }
  return res.status(200).json({ movie });
};

const deleteMovieById = async (req, res, next) => {
  const id = req.params.id;
  let movie;

  try {
    movie = await Movie.findByIdAndDelete(id);
  } catch (err) {
    return console.log(err);
  }
  if (!movie) {
    return res.status(404).json({ message: "Invalid Movie Id" });
  }
  return res.status(200).json({message : "Movie Deleted Successfully"});
};

const getMovieByName = async (req, res, next) => {
  // const id = req.params.id;
  const { name } = req.body;

  let movie;

  try {
    movie = await Movie.findOne({ title: name });
  } catch (err) {
    return console.log(err);
  }
  if (!movie) {
    return res.status(404).json({ message: "Movie Not Available" });
  }
  return res.status(200).json({ movie });
};

// By Admin Only, Required JWT Auth
const getmovieBookingsbyName = async (req, res, next) => {
  
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token not found" });
  }
  console.log(extractedToken);
  let adminId;

  //verify token
  jwt.verify(extractedToken, process.env.SECRET_KEY, (err, decrypted) => {
    if (err) {
      return res.status(401).json({ message: "Invalid Token" });
    } else {
      adminId = decrypted.id;
      return;
    }
  });

  const producer = kafka.producer();
  console.log("Connecting Producer");
  await producer.connect();
  console.log("Producer Connected Successfully");

  const { name } = req.body;
  let movie;
  try {
    movie = await Movie.findOne({ title: name });
  } catch (err) {
    console.log(err);
  }
  if (!movie) {
    return res.status(404).json({ message: "Movie Not Available" });
  }

  payloads = {
    topic : 'movieBookings',
     messages: [
       { key: 'movie', value: JSON.stringify(movie)},
]};

      await producer.send(payloads);
      console.log('Booking sent to Kafka:', payloads);
      await producer.disconnect();

  const bookedTickets = movie.bookedTickets;
  const availableTickets = movie.noOfTickets;
  return res
    .status(200)
    .json({
      "No. of Booked Tickets": bookedTickets,
      "No. of Available Tickets": availableTickets,
    });
};

//

const getBookingsbyName = async (req, res, next) => {
 
  const { name } = req.params;
  console.log(name);
  let movie;
  try {
    movie = await Movie.findOne({ title: name });
  } catch (err) {
    console.log(err);
  }
  if (!movie) {
    return res.status(404).json({ message: "Movie Not Available" });
  }

 
  const bookedTickets = movie.bookedTickets;
  const availableTickets = movie.noOfTickets;
  // return res
  //   .status(200)
  //   .json({
  //     "No. of Booked Tickets": bookedTickets,
  //     "No. of Available Tickets": availableTickets,
  //   });
  const data = [
    { seatNumber: [1, 2] },
    { seatNumber: [3, 4] },
    { seatNumber: [5, 6] }
];
  return res
    .status(200)
    .json({ data  });
};

//

const deleteMoviesUsingKafka = async(req,res,next) =>{
  const consumer = kafka.consumer({ groupId: 'my-group' });
  await consumer.connect();
  console.log("consumer connected")

  await consumer.subscribe({ topics: ["movies"], fromBeginning: true });

  await consumer.run({
    
    eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
      console.log("inside consumer ");
      const movie = JSON.parse(message.value.toString());
      console.log(movie)
      const movieId = movie._id;
      
      let deletedMovie;
      try{
      deletedMovie = await Movie.findByIdAndDelete(movieId);
      if (!deletedMovie){
        return res.status(404).json({message:"Movie Not Found"});
      }
      }catch(err){
        console.log(err.message);
      }

        // console.log({
        //     key: message.key.toString(),
        //     value: message.value.toString(),
        //     headers: message.headers,
        //     topic,
        // })
    },
})
  // await consumer.disconnect()
  return res.status(200).json({message:"Deletion Successful"});
}

module.exports = {
  addMovie,
  getAllMovie,
  getMovieById,
  getMovieByName,
  deleteMovieById,
  getmovieBookingsbyName,
  getBookingsbyName,
  deleteMoviesUsingKafka
};
