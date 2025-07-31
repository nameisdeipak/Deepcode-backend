const User = require("../models/user");
const Course = require("../models/course");
const Problem = require("../models/problem");
const SolutionVideo = require("../models/solutionVideo");
const Submission = require("../models/submission");

const getDashboard = async (req, res) => {
  try {

    const user = await User.countDocuments();
    const course = await Course.countDocuments();
    const problem = await Problem.countDocuments();
    const video = await SolutionVideo.countDocuments();

  
 
    const result = [user, course, problem, video];

    res.status(200).json({
      result,
 
      message: "Successfully fetched dashboard data",
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch dashboard data" });
  }
};

const getAllUserDetails = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 7; 
    const search = req.query.search || ""; 
    const skip = (page - 1) * limit;

    
    const query = search
      ? {
          $or: [
            { userName: { $regex: search, $options: "i" } },
            { firstName: { $regex: search, $options: "i" } },
            { lastName: { $regex: search, $options: "i" } },
            { emailId: { $regex: search, $options: "i" } },
          ],
        }
      : {};


    const [users, totalUsers] = await Promise.all([
      User.find(query) // Use the constructed query
        .select(" userName firstName role createdAt lastName emailId profile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query), // Count documents matching the query
    ]);

    if (totalUsers === 0) {
      return res.status(200).json({ 
          message: "No users found matching the criteria",
          users: [],
          currentPage: 1,
          totalPages: 0,
          totalUsers: 0
      });
    }

    res.status(200).json({
      message: "Successfully fetched users data",
      users: users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers: totalUsers,
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to fetch Users data" });
  }
};

const deleteUser = async (req, res) => {

  const {userId}=req.params
  try {
    
    if(!userId) throw new Error("User Id Is Missing")

      const user=await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User Deleted SuccessFully",
      user: user
     
    });
  } catch (err) {
    console.error("Error:", err);
    res
      .status(500)
      .json({ error: err.message || "Failed to Delete User data" });
  }
};

module.exports = {
  getDashboard,
  getAllUserDetails,
  deleteUser
};
