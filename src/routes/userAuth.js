const express = require("express");

const authRouter = express.Router();
const {
  register,
  login,
  logout,
  adminRegister,
  deleteProfile,
  updateProfile,
  profileImage,
  changePassword,
  getRankAndLang,
} = require("../controllers/userAuthent");
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/multer");

// Register
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", userMiddleware, logout);
authRouter.post("/admin/register", adminMiddleware, adminRegister);
authRouter.delete("/deleteProfile", userMiddleware, deleteProfile);
authRouter.post(
  "/Profile/avatar/uploadImage",
  userMiddleware,
  upload.single("image"),
  profileImage
);

// this is for user Rank and thier Skills and Language 
authRouter.get("/RankAndLanguage",userMiddleware,getRankAndLang);


authRouter.put("/updateProfile", userMiddleware, updateProfile);
authRouter.patch("/profile/changepassword", userMiddleware, changePassword);
authRouter.get("/check", userMiddleware, (req, res) => {
  const reply = {
    // firstName:req.result.firstName,
    // emailId:req.result.emailId,
    // _id:req.result._id,
    // role:req.result.role,

    firstName: req.result.firstName,
    lastName: req.result.lastName,
    userName: req.result.userName,
    profile: req.result.profile,
    gender: req.result.gender,
    summary: req.result.summary,
    social_Url: req.result.social_Url,
    coursesPurchase: req.result.coursesPurchase,
    emailId: req.result.emailId,
    _id: req.result._id,
    role: req.result.role,
  };

  const { token } = req.cookies;

  // res.cookie('token',token,{maxAge:60*60*1000});
  res.status(201).json({
    user: reply,
    message: "Valid user",
  });
});
// authRouter.get("/getProfile",getProfile);
// Login
// Logout
// GetProfile

module.exports = authRouter;
