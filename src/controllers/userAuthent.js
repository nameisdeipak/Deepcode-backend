const redisClient = require("../config/redis");
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Submission = require("../models/submission");
const Problem = require("../models/problem");
const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const register = async (req, res) => {
  try {
    // validate the data;
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    const cleanFirst = firstName.trim().toLowerCase();
    const cleanLast = req.body.lastName.trim().toLowerCase();
    const userName = `${cleanFirst}${cleanLast}_${Math.floor(
      Math.random() * 1000
    )}`;

    // Example:

    req.body.password = await bcrypt.hash(password, 10);
    req.body.role = "user";
    req.body.userName = userName;
    //

    const user = await User.create(req.body);

    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: "user" },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );
    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      profile: user.profile,
      gender: user.gender,
      summary: user.summary,
      social_Url: user.social_Url,
      coursesPurchase: user.coursesPurchase,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };
    res.cookie("token", token, {  httpOnly: true,
  secure: true,
  sameSite: "None",
   maxAge: 60 * 60 * 1000 });
    res.status(201).json({
      user: reply,
      message: "Loggin Successfully",
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const login = async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId) throw new Error("Invalid Credentials");
    if (!password) throw new Error("Invalid Credentials");

    const user = await User.findOne({ emailId });

    const match = await bcrypt.compare(password, user.password);

    if (!match) throw new Error("Invalid Credentials ");

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      profile: user.profile,
      gender: user.gender,
      summary: user.summary,
      social_Url: user.social_Url,
      coursesPurchase: user.coursesPurchase,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };
    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
      // { expiresIn: 60 * 60 }
    );
    res.cookie("token", token, {  httpOnly: true,
  secure: true,
  sameSite: "None",
   maxAge: 24 * 60 * 60 * 1000 });
    res.status(201).json({
      user: reply,
      message: "Loggin Successfully",
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

//logOut Feature

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    const payload = jwt.decode(token);

    await redisClient.set(`token:${token}`, "Blocked");
    await redisClient.expireAt(`token:${token}`, payload.exp);

    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("Logged Out Successfully");
  } catch (err) {
    res.status(503).send("Error: " + err);
  }
};

const adminRegister = async (req, res) => {
  try {
    // validate the data;
    validate(req.body);
    const { firstName, emailId, password } = req.body;

    req.body.password = await bcrypt.hash(password, 10);

    req.body.role=req.result.role;
    console.log(req.result.role, req.result.userName);

    const user = await User.create(req.body);
    const token = jwt.sign(
      { _id: user._id, emailId: emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1d" }
      // { expiresIn: 60 * 60 }
    );
    res.cookie("token", token, {   httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 24 * 60 * 60 * 1000 });
    res.status(201).send("User Registerd Successfully");
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const { token } = req.cookies;
    const payload = jwt.decode(token);

    // await redisClient.set(`token:${token}`, "Blocked");
    // await redisClient.expireAt(`token:${token}`, payload.exp);

    res.cookie("token", null, { expires: new Date(Date.now()) });
    // userSchema delete
    const user = await User.findByIdAndDelete(userId);



    res.cookie("token", null, { expires: new Date(Date.now()) });

    res.status(200).json({
      user: user,
      message: "Deleted Successfully",
    });
  } catch (err) {

    res.status(500).json({
      message: `Internal Server Error: ${err}`,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;

    console.log(req.body);
    const user = await User.findByIdAndUpdate(
      userId,
      { ...req.body },
      { new: true }
    );

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      profile: user.profile,
      gender: user.gender,
      summary: user.summary,
      social_Url: user.social_Url,
      coursesPurchase: user.coursesPurchase,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };

    res.status(201).json({
      user: reply,
      message: "update  Successfully",
    });
  } catch (err) {
    res.status(400).send("Error: " + err);
  }
};



const profileImage = async (req, res) => {
  const userId = req.result._id;

  try {
    

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    if (req.result.profile.public_id) {
      await cloudinary.uploader.destroy(req.result.profile.public_id, {
        resource_type: "image",
        invalidate: true,
      });
    }

    console.log("Scale:", req.body.scale);
    console.log("Rotation:", req.body.rotation);

    // 2. Generate secure upload signature
    const timestamp = Math.round(Date.now() / 1000);
    const public_id = `leetcode-user/${userId}_${timestamp}_${
      req.file.originalname.split(".")[0]
    }`;

    const MAX_DIMENSION = 65000;
    const MIN_SCALE = 0.1; 
    const MAX_SCALE = 10; 

    let scale = parseFloat(req.body.scale) || 1; 
    let rotation = parseFloat(req.body.rotation) || 0;


    scale = Math.max(MIN_SCALE, Math.min(scale || 1, MAX_SCALE));


    rotation = Math.round(rotation / 90) * 90; 

    const metadata = await sharp(req.file.buffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;


    const imageString = `data:${
      req.file.mimetype
    };base64,${req.file.buffer.toString("base64")}`;


    const ImageResult = await cloudinary.uploader.upload(imageString, {
      public_id: public_id,
      resource_type: "image",
      transformation: [
        {
          width: originalWidth,
          height: originalHeight,

          crop: "scale",
        },

      ],

      overwrite: true,

    });
    console.log(ImageResult);

    const user = await User.findByIdAndUpdate(userId, {
      profile: {
        profile_url: ImageResult.url,
        secure_url: ImageResult.secure_url,
        public_id: ImageResult.public_id,
      },
    });

    const reply = {
      firstName: user.firstName,
      lastName: user.lastName,
      userName: user.userName,
      profile: user.profile,
      gender: user.gender,
      summary: user.summary,
      social_Url: user.social_Url,
      coursesPurchase: user.coursesPurchase,
      emailId: user.emailId,
      _id: user._id,
      role: user.role,
    };
    res.status(201).json({
      user: reply,
      message: "Profile  Successfully uploded",
    });
  } catch (err) {
    console.error("Error :", err);
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
};

const changePassword = async (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const userId = req.result._id;

  try {
    const match = await bcrypt.compare(oldPassword, req.result.password);

    if (!match) throw new Error("Current  Password is wrong ");

    const password = await bcrypt.hash(newPassword, 10);

    const updateResult = await User.findByIdAndUpdate(userId, {
      password: password,
    });

    if (!updateResult) throw new Error("Faild to Change  Password  ");

    console.log(updateResult);

    res.status(201).json({

      message: "passwrod  Successfully uploded",
    });
  } catch (err) {
    console.error("Error :", err);
    res.status(500).json({ error: err.message || "Failed to change passwrod" });
  }
};

const getRankAndLang = async (req, res) => {
  const userId = req.result._id;

  try {
    // const result = await Submission.aggregate([
    //   {
    //     $match: {
    //       status: "accepted",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: "$userId",
    //       distinctProblems: { $addToSet: "$problemId" },
    //       languages: { $addToSet: "$language" },
    //     },
    //   },
    //   {
    //     $project: {
    //       userId: "$_id",
    //       problemCount: { $size: "$distinctProblems" },
    //       languages: 1,
    //     },
    //   },
    //   {
    //     $sort: {
    //       problemCount: -1,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       users: {
    //         $push: {
    //           userId: "$userId",
    //           problemCount: "$problemCount",
    //           languages: "$languages",
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $unwind: {
    //       path: "$users",
    //       includeArrayIndex: "rank",
    //     },
    //   },
    //   {
    //     $match: {
    //       "users.userId": userId,
    //     },
    //   },
    //   {
    //     $project: {
    //       userId: "$users.userId",
    //       rank: { $add: ["$rank", 1] },
    //       problemCount: "$users.problemCount",
    //       languages: "$users.languages",
    //       _id: 0,
    //     },
    //   },
    // ]);

  
    const result = await User.aggregate([
  // Stage 1: User collection se shuru karein aur Submission collection se data join karein
  {
    $lookup: {
      from: "submissions", // Submission collection ka naam
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$userId", "$$userId"] }, // User ID match karein
                { $eq: ["$status", "accepted"] }, // Sirf accepted submissions
              ],
            },
          },
        },
      ],
      as: "acceptedSubmissions", // Join kiye gaye submissions ko is field me rakhein
    },
  },

  // Stage 2: Har user ke liye unique problems aur languages ka count nikalein
  {
    $project: {
      userId: "$_id",
      // `$setUnion` duplicate problem IDs ko hata dega, fir `$size` se count nikal lenge
      problemCount: { $size: { $setUnion: "$acceptedSubmissions.problemId" } },
      languages: { $setUnion: "$acceptedSubmissions.language" },
      _id: 0,
    },
  },

  // Stage 3: Sabhi users ko unke problemCount ke hisab se descending order me sort karein
  // Jiske 0 problems hain, woh automatically neeche aa jayega
  {
    $sort: {
      problemCount: -1,
    },
  },

  // Stage 4: Ek group banakar sabhi users ko ek array me daalein taaki rank calculate kar sakein
  {
    $group: {
      _id: null,
      users: {
        $push: {
          userId: "$userId",
          problemCount: "$problemCount",
          languages: "$languages",
        },
      },
    },
  },

  // Stage 5: Array ko vapas alag-alag documents me todein aur rank (index) add karein
  {
    $unwind: {
      path: "$users",
      includeArrayIndex: "rank",
    },
  },
  
  // Stage 6: Sirf us user ko dhundein jiski rank humein chahiye
  {
    $match: {
      "users.userId": userId,
    },
  },

  // Stage 7: Final result ko saaf-suthre format me dikhayein
  {
    $project: {
      userId: "$users.userId",
      rank: { $add: ["$rank", 1] }, // Rank 0 se shuru hoti hai, isliye 1 add karein
      problemCount: "$users.problemCount",
      languages: "$users.languages",
      _id: 0,
    },
  },
]);

    const skills = await Submission.aggregate([
      {
        $facet: {
     
          userStats: [
        
            {
              $match: {
                userId: userId,
                status: "accepted",
              },
            },


            {
              $group: {
                _id: "$problemId",
                firstSubmission: { $first: "$$ROOT" },
              },
            },


            {
              $lookup: {
                from: "problems",
                localField: "_id",
                foreignField: "_id",
                as: "problem",
              },
            },


            { $unwind: "$problem" },


            {
              $group: {
                _id: null,
                totalSolved: { $sum: 1 },
                tags: { $push: "$problem.tags" },
                difficulties: { $push: "$problem.difficulty" },

                easySolved: {
                  $sum: {
                    $cond: [{ $eq: ["$problem.difficulty", "easy"] }, 1, 0],
                  },
                },
                mediumSolved: {
                  $sum: {
                    $cond: [{ $eq: ["$problem.difficulty", "medium"] }, 1, 0],
                  },
                },
                hardSolved: {
                  $sum: {
                    $cond: [{ $eq: ["$problem.difficulty", "hard"] }, 1, 0],
                  },
                },
              },
            },

         
            {
              $project: {
                _id: 0,
                totalSolved: 1,
                easySolved: 1,
                mediumSolved: 1,
                hardSolved: 1,
                tagCounts: {
                  $reduce: {
                    input: "$tags",
                    initialValue: [],
                    in: {
                      $concatArrays: [
                        "$$value",
                        {
                          $cond: [{ $isArray: "$$this" }, "$$this", ["$$this"]],
                        },
                      ],
                    },
                  },
                },
          
                difficultyCounts: {
                  easy: "$easySolved",
                  medium: "$mediumSolved",
                  hard: "$hardSolved",
                },
              },
            },


            {
              $project: {
                totalSolved: 1,
                easySolved: 1,
                mediumSolved: 1,
                hardSolved: 1,
                difficultyCounts: 1,
                tagCounts: {
                  $reduce: {
                    input: "$tagCounts",
                    initialValue: [],
                    in: {
                      $let: {
                        vars: {
                          existing: {
                            $filter: {
                              input: "$$value",
                              as: "item",
                              cond: { $eq: ["$$item.tag", "$$this"] },
                            },
                          },
                        },
                        in: {
                          $cond: [
                            { $gt: [{ $size: "$$existing" }, 0] },
                            {
                              $map: {
                                input: "$$value",
                                as: "item",
                                in: {
                                  $cond: [
                                    { $eq: ["$$item.tag", "$$this"] },
                                    {
                                      tag: "$$item.tag",
                                      count: { $add: ["$$item.count", 1] },
                                    },
                                    "$$item",
                                  ],
                                },
                              },
                            },
                            {
                              $concatArrays: [
                                "$$value",
                                [{ tag: "$$this", count: 1 }],
                              ],
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          ],


          totalProblems: [
            {
              $lookup: {
                from: "problems",
                pipeline: [{ $count: "total" }],
                as: "totalProblems",
              },
            },
            { $unwind: "$totalProblems" },
            {
              $project: {
                _id: 0,
                totalProblems: "$totalProblems.total",
              },
            },
          ],


          problemsByDifficulty: [
            {
              $lookup: {
                from: "problems",
                pipeline: [
                  {
                    $group: {
                      _id: null,
                      totalEasy: {
                        $sum: {
                          $cond: [{ $eq: ["$difficulty", "easy"] }, 1, 0],
                        },
                      },
                      totalMedium: {
                        $sum: {
                          $cond: [{ $eq: ["$difficulty", "medium"] }, 1, 0],
                        },
                      },
                      totalHard: {
                        $sum: {
                          $cond: [{ $eq: ["$difficulty", "hard"] }, 1, 0],
                        },
                      },
                    },
                  },
                ],
                as: "difficultyStats",
              },
            },
            { $unwind: "$difficultyStats" },
            {
              $project: {
                _id: 0,
                totalEasy: "$difficultyStats.totalEasy",
                totalMedium: "$difficultyStats.totalMedium",
                totalHard: "$difficultyStats.totalHard",
              },
            },
          ],
        },
      },


      {
        $project: {
          userStats: { $arrayElemAt: ["$userStats", 0] },
          totalProblems: { $arrayElemAt: ["$totalProblems.totalProblems", 0] },
          problemsByDifficulty: { $arrayElemAt: ["$problemsByDifficulty", 0] },
        },
      },
    ]); 



const submissionResult = await Submission.aggregate([
  {
    $match: {
      userId: userId,
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$createdAt"
        }
      },
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      _id: 0,
      date: "$_id",
      count: 1
    }
  },
  {
    $sort: {
      date: 1
    }
  }
]);




    res.status(201).json({
      result: result[0],
      skills:skills[0],
      submisson:submissionResult,
      message: "  Successfully find Rank and Language ",
    });
  } catch (err) {
    console.error("Error :", err);
    res.status(500).json({ error: err.message || "Failed to Fetch" });
  }
};

module.exports = {
  register,
  login,
  logout,
  adminRegister,
  deleteProfile,
  updateProfile,
  profileImage,
  changePassword,
  getRankAndLang,
};
