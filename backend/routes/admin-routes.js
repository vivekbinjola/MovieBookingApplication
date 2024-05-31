const express = require('express');
const adminRouter = express.Router();

const { addAdmin, adminLogin, getAdmins, getAdminByID,deleteAdminByID, getTicketsUsingConsumer,deleteMovieUsingKafka  } = require('../controllers/admin-controller');

adminRouter.post('/signup', addAdmin);
adminRouter.post("/login", adminLogin);
adminRouter.get('/',getAdmins);
adminRouter.get('/consumerMovie', getTicketsUsingConsumer);
adminRouter.get('/deleteMovieProducer', deleteMovieUsingKafka );
adminRouter.delete('/:id',deleteAdminByID);
adminRouter.get("/:id", getAdminByID);

module.exports = adminRouter
