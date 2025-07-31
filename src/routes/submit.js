const express=require("express");
const submitRouter=express.Router();
const userMiddleware=require("../middleware/userMiddleware");
const submitCodeRateLimiter=require("../middleware/RateLimiter");
const {submitCode,runCode}=require("../controllers/userSubmission");


submitRouter.post("/submit/:id",userMiddleware,submitCodeRateLimiter,submitCode)
submitRouter.post("/run/:id",userMiddleware,submitCodeRateLimiter,runCode);

module.exports=submitRouter;