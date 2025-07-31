const express=require('express');
const adminMiddleware=require("../middleware/adminMiddleware");
const userMiddleware=require("../middleware/userMiddleware");
const videoRouter=express.Router();
const {generateUploadSignature,saveVideoMetadata,deleteVideo,getProblemVideos,} = require("../controllers/videoSection")


videoRouter.get("/create/:problemId",adminMiddleware,generateUploadSignature);
videoRouter.post("/save",adminMiddleware,saveVideoMetadata);
videoRouter.delete("/delete/:problemId",adminMiddleware,deleteVideo);

videoRouter.get("/getAllProblemsVideos",adminMiddleware,getProblemVideos);


module.exports=videoRouter;
