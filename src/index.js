const express=require("express");
const app=express();
require("dotenv").config();
const main=require("./config/db");
const cookieParser=require("cookie-parser")
const authRouter=require("./routes/userAuth");
const redisClient=require("./config/redis");
const problemRouter = require("./routes/problemCreator");
const submitRouter = require("./routes/submit");
const aiRouter=require("./routes/aiChatting")
const videoRouter=require("./routes/videoCreator");
const coursesRoute=require("./routes/courseCreate")
const adminRoute=require("./routes/admin");
const discussRouter=require("./routes/discuss");
const cors =require('cors');



app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(cookieParser());;


app.use('/user',authRouter);
app.use('/problem',problemRouter);;
app.use('/submission',submitRouter);;
app.use('/ai',aiRouter);;
app.use('/video',videoRouter);;
app.use('/course',coursesRoute);;
app.use('/admin',adminRoute);;
app.use('/discuss',discussRouter);;


const InitalizeConnection=async()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB's  Connected");

    app.listen(process.env.PORT,()=>{
        console.log("Server Listening at port"+process.env.PORT);
    })

    }catch(err){
        console.log("Error: "+err);
    }
}

InitalizeConnection();

