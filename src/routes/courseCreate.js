const express=require('express');
const adminMiddleware=require("../middleware/adminMiddleware");
const userMiddleware=require("../middleware/userMiddleware");
const coursesRoute=express.Router();
const {createCourse,deleteCourse,updateCourse,getCourseById,getAllCourses,purchaseCourseByuser}=require("../controllers/courses")
const upload =require('../middleware/multer');



coursesRoute.post("/create",adminMiddleware,upload.single('image'),createCourse);
coursesRoute.delete("/delete/:courseId",adminMiddleware,deleteCourse);
coursesRoute.put("/update/:courseId",adminMiddleware,upload.single('image'),updateCourse);


coursesRoute.get("/courseById/:courseId",userMiddleware,getCourseById);
coursesRoute.get("/getAllCourses",userMiddleware,getAllCourses);
coursesRoute.get("/coursePurchaseByUser",userMiddleware,purchaseCourseByuser);

module.exports=coursesRoute;