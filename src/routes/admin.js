const express=require('express');
const adminMiddleware=require("../middleware/adminMiddleware");
const userMiddleware=require("../middleware/userMiddleware");
const adminRoute=express.Router();;
const upload =require('../middleware/multer');
const {getDashboard,getAllUserDetails,deleteUser}=require('../controllers/adminControll');


adminRoute.get("/dashboard/data",adminMiddleware,getDashboard);
adminRoute.get("/user's",adminMiddleware,getAllUserDetails);
adminRoute.delete("/delete/user/:userId",adminMiddleware,deleteUser);



module.exports=adminRoute