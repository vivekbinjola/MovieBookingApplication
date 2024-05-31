const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const Movie = require("../models/Movies");
const { kafka } = require("../kafka/client");
// const { decrypted } = require("dotenv");

const getTicketsUsingConsumer = async (req, res, next) => {
  const consumer = kafka.consumer({ groupId: 'admin-group' });
  await consumer.connect();
  console.log("consumer connected")

  await consumer.subscribe({ topics: ["movieBookings"], fromBeginning: true });

  await consumer.run({

    eachMessage: async ({ topic, partition, message,heartbeat,pause }) => {
        console.log("inside consumer ")

        const booking = JSON.parse(message.value.toString());
        console.log(booking);
        const movieId = booking._id;
        console.log(movieId);
        

        try {
          const movie = await Movie.findById(movieId);
          if (movie) {
            console.log(`Total tickets booked for movie "${movie.title}": ${movie.bookedTickets}`);
            console.log(`Available tickets for movie "${movie.title}": ${movie.noOfTickets}`);
          }
        } catch (err) {
          console.error('Error processing booking message:', err);
        }
      
    // console.log({
    //     key: message.key.toString(),
    //     value: message.value.toString(),
    //     headers: message.headers,
    // })
    // console.log(
    //     `  [${topic}]:`,
    //     message.value.toString()
    //   );
    // await consumer.disconnect();
     }
    });

    return res.status(200).json({message:"Tickets fetched from Movies"});
};

const deleteMovieUsingKafka = async (req,res,next)=>{
  const extractedToken = req.headers.authorization.split(" ")[1];
  if (!extractedToken && extractedToken.trim() === "") {
    return res.status(404).json({ message: "Token not found" });
  }
  // console.log(extractedToken);
  let adminId;

  //verify token
  try {
    const decrypted = jwt.verify(extractedToken, process.env.SECRET_KEY);
    adminId = decrypted.id;
    // console.log(adminId);
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }

  const {name} = req.body

  const producer = kafka.producer()
  await producer.connect()
  console.log("Producer connected")

  let movie
  try{
    movie =  await Movie.findOne({title:name}); 
  }catch(err){
    console.log("Movie error",err.message)
  }
  if(!movie){
    return res.status(404).json({message: "Movie Not Found"})
  }

  payload ={
    topic: 'movies',
    messages: [
        { key: 'key1', value: JSON.stringify(movie) }
       
    ]}

  await producer.send(payload);
  console.log("Data sent to kafka Movies Consumer ",payload)
  await producer.disconnect();
  console.log("producer disconnected");
  return res.status(200).json({message : "data sent successfully"});


}
const addAdmin = async (req, res, next) => {
  const { email, password } = req.body;

  // if(!email && email.trim() === "" &&
  //     !password && password.trim() === "") {
  //     return res.status(422).json({ message: "Invalid Inputs"})
  // }

  let existingAdmin;

  try {
    existingAdmin = await Admin.findOne({ email });
  } catch (err) {
    return console.log(err);
  }

  if (existingAdmin) {
    return res.status(400).json({ message: "Admin Already Exists" });
  }

  let admin;
  const hashedPassword = bcrypt.hashSync(password);
  try {
    admin = new Admin({ email, password: hashedPassword });
    admin = await admin.save();
  } catch (err) {
    return console.log(err);
  }
  if (!admin) {
    return res.status(400).json({ message: "Unable to create admin" });
  }
  return res.status(201).json({ message: "Admin created", admin: admin });
};

const adminLogin = async (req, res, next) => {
  const { loginId, password } = req.body;

  if (!loginId && loginId.trim() === "" && !password && password.trim() === "") {
    return res.status(400).json({ message: "Invalid Inputs" });
  }
  let existingAdmin;
  try {
    existingAdmin = await Admin.findOne({ name:loginId });
  } catch (err) {
    return console.log(err);
  }
  if (!existingAdmin) {
    return res.status(401).json({ message: "Admin not found" });
  }
  const isPasswordCorrect = bcrypt.compareSync(
    password,
    existingAdmin.password
  );

  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Incorrect Password" });
  }
  const token = jwt.sign({ id: existingAdmin._id }, process.env.SECRET_KEY, {
    expiresIn: "7d",
  });
  return res
    .status(200)
    .json({
      message: "Authentication Successful",
      token,
      id: existingAdmin._id,
    });
};

const getAdmins = async (req, res) => {
  let admins;
  try {
    admins = await Admin.find();
  } catch (e) {
    return res.send(e.message);
  }
  if (!admins) {
    return res.status(400).json({ message: "cannot get admin" });
  }
  return res.status(200).json({ admins });
};
const deleteAdminByID = async (req, res, next) => {
  const id = req.params.id;
  let admin;
  try {
    admin = await Admin.findByIdAndDelete(id);
  } catch (err) {
    return console.log(err);
  }
  if (!admin) {
    console.log("Cannot find Admin");
    return res.status(400).json({message: "Cannot find Admin"});

    
  }
  return res.status(200).json("Admin Successfully Deleted");
};
const getAdminByID = async (req, res, next) => {
  const id = req.params.id;
  let admin;
  try {
    admin = await Admin.findById(id).populate("addedMovies");
  } catch (err) {
    return res.status(400).json({message: "Cannot find Admin"});
  }
  if (!admin) {
    
    return res.status(400).json({message: "Cannot find Admin"});
  }
  return res.status(200).json({ admin });
};

module.exports = {
  addAdmin,
  adminLogin,
  getAdmins,
  getAdminByID,
  deleteAdminByID,
  getTicketsUsingConsumer,
  deleteMovieUsingKafka,
};
