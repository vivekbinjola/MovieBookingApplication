const mongoose = require('mongoose');
 
const Movie = require("../models/Movies");
const users = require('../models/User');
const Bookings = require("../models/Booking");
// const {kafka} = require("../kafka/admin")
const { kafka } = require("../kafka/client");


const Booking = async (req, res, next) => {
    const {movie, date, seatNumber, tickets, user} = req.body;
    let existingMovie;
    let existingUser;

    // const producer = kafka.producer();
    // console.log("Connecting Producer");
    // await producer.connect();
    // console.log("Producer Connected Successfully");

// const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
// const producer = new Producer(client);

 
    try{
        existingMovie = await Movie.findById(movie);
        existingUser = await users.findById(user);
        // console.log(existingMovie, existingUser)
    } catch (err){
        return res.send(err.message);
    }
    if(!existingMovie)
    {
        return res.status(404).json({message:"Movie not found by given id"});
    }
    if(existingMovie.noOfTickets == 0){
        return res.status(404).json({message:"No Tickets Available : SOLD OUT"})
    }
    if(!existingUser)
    {
        return res.status(404).json({message:"User not found by given id"});
    }
    let newBooking;
    try{
        newBooking=new Bookings({
            movie,
            date:new Date(`${date}`),
            seatNumber,
            tickets,
            user
        });

        // payloads = {
        //     topic : 'bookings',
        //      messages: [
        //        { key: 'newBooking', value: JSON.stringify(newBooking) },
        // ]};

        //       await producer.send(payloads);
        //       console.log('Booking sent to Kafka:', payloads);
        //       await producer.disconnect();
             

        const session= await mongoose.startSession();
        session.startTransaction();
        existingUser.bookings.push(newBooking);
        existingMovie.bookings.push(newBooking);
        // Bookings.push(newBooking);
        
        try{
            if (existingMovie.noOfTickets >= tickets){
                existingMovie.bookedTickets += tickets 
                existingMovie.noOfTickets -= tickets
            }else{
                return res.status(404).json( {message: "No. of Tickets Available are less than the booking size"})
            }    
            }catch(err){
                return res.send(err.message)
            }
        
        const savedBooking = await newBooking.save();
        console.log('Booking saved successfully:', savedBooking);
        await existingUser.save({ session });
        await existingMovie.save({ session });
        await new Bookings(newBooking).save({ session });
        
        session.commitTransaction();
        // newBooking = await newBooking.save();
    }
    catch(e)
    { 
        res.send(e.message);
    }

    if(!newBooking)
    {
        res.status(400).json({message:"Something Went Wrong"})
    }
    // console.log(newBooking);
    return res.status(201).json({newBooking}); 
} 

const getBookingsbyName = async(req,res,next) =>{
    // console.log(req.params)
    const {movieId} = req.params;
    if (!movieId){
        return res.status(500).json({message : 'Error in fetching tickets'})    
    }
    console.log(req.params)
    
    let film
    
    try{
        film = await Bookings.findOne({movie :movieId});
        console.log(film)
        return res.status(200).json([film]);        
    }catch(e){
        console.log(e.message);
        return res.status(500).json({message : 'Error in fetching tickets'})      

       
    }
}
const deleteBooking = async (req, res, next) => {
    const id = req.params.id;
    let booking;
    try {
        booking = await Bookings.findByIdAndRemove(id)
        // .populate("user movie");
        console.log(booking);
        const session = await mongoose.startSession();
        session.startTransaction();
        await booking.user.bookings.pull(booking);
        await booking.movie.bookings.pull(booking);
        await booking.movie.save({ session });
        await booking.user.save({ session });
        session.commitTransaction(); 
    }
    catch (err) {
        console.log(err);
     
    }
    if (!booking) {
        return res.status(404).json({ message: "Booking not found by given id" });
    }
    return res.status(200).json({ message: "Booking deleted successfully" });
}
  
module.exports = {Booking, deleteBooking, getBookingsbyName};   