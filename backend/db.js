// const mongoose = require('mongoose');
// const app = require('./app')
 
// let isConnected;

// const connectToDatabase = async () => {
//     if (isConnected) {
//       console.log('Using existing database connection');
//       return Promise.resolve();
//     }
  
//     console.log('Connecting to database...');
//     const db = await mongoose.connect(`${process.env.DATABASE}`,  {
//       // console.log(`Database connected.`);
//       useNewUrlParser : true,
//       useUnifiedTopology : true
//   });
  
//     isConnected = db.connections[0].readyState;
//     console.log('Database connected');
//   };
  
//   module.exports = {connectToDatabase} 