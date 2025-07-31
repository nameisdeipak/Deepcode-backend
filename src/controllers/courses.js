const User = require("../models/user");
const Course = require("../models/course");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imageUploader = async (req) => {
  const userId = req.result._id;
  // 2. Generate secure upload signature
  const timestamp = Math.round(Date.now() / 1000);
  const public_id = `leetcode-course/${userId}_${timestamp}_${
    req.file.originalname.split(".")[0]
  }`;

  // uploads peramter
  const uploadParams = {
    timestamp: timestamp,
    public_id: public_id,
  };

  // Generate signature
  const signature = cloudinary.utils.api_sign_request(
    uploadParams,
    process.env.CLOUDINARY_API_SECRET
  );

  uploadParams.cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  uploadParams.api_key = process.env.CLOUDINARY_API_KEY;
  uploadParams.signature = signature;


  // Upload to cloudinary
  const ImageResult = await cloudinary.uploader.upload(
    `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
    uploadParams
  );

  return ImageResult;
};

const createCourse = async (req, res) => {
  const {
    title,
    subTitle,
    chapters,
    descriptions,
    courseType,
    // status,
    price,
    premium,
    courseUrl,
  } = req.body;

  const userId = req.result._id;
  // console.log("hello");
  try {
    // 1. Validate file exists

    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    const ImageResult = await imageUploader(req);


   
    const course = new Course({
      title,
      subTitle,
      chapters,
      descriptions,
      courseType,
      price,
      premium,
      courseUrl,
      image: {
        url: ImageResult.secure_url,
        public_id: ImageResult.public_id,
      },
    });

    // console.log(course);
    await course.save();
    res.status(201).json({ message: "Course Successfully Created", course });
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: err.message || "Failed to create course" });
  }
};

const deleteCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    console.log(courseId);
    if (!courseId) return res.status(400).send("CourseID is Missing");

    const deleteCourse = await Course.findByIdAndDelete(courseId);

    if (!deleteCourse) return res.status(400).send("Course is not found!!!");

    await cloudinary.uploader.destroy(deleteCourse.image.public_id, {
      resource_type: "image",
      invalidate: true,
    });

    // after delete db delete img of course from cloudinary

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (err) {
    // console.error("Error deleting Course:", err);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const {
    title,
    subTitle,
    chapters,
    descriptions,
    courseType,
    // status,
    price,
    premium,
    courseUrl,
  } = req.body;

  const updateData = {
    title,
    subTitle,
    chapters,
    descriptions,
    courseType,
    price,
    premium,
    courseUrl,
  };

  try {
    if (!courseId) return res.status(400).send("CourseID is Missing");

    if (req.file) {
      // First, find the existing course to get the old image's public_id
      const existingCourse = await Course.findById(courseId).select("image.public_id");

      // Upload the new image to Cloudinary
      const imageResult = await imageUploader(req);

      // Add the new image's data to our update object
      updateData.image = {
        url: imageResult.secure_url,
        public_id: imageResult.public_id,
      };

      // If an old image exists, delete it from Cloudinary to prevent orphans
      if (
        existingCourse &&
        existingCourse.image &&
        existingCourse.image.public_id
      ) {
        await cloudinary.uploader.destroy(existingCourse.image.public_id);
      }
    }


    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { $set: updateData }, // Use $set to update only the provided fields
      { new: true, runValidators: true } // `new: true` returns the updated doc
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found." });
    }

    res.status(200).json({
      message: "Course updated successfully!",
      course: updatedCourse,
    });

  } catch (err) {
    // 7. Improved error handling
    console.error("Error updating course:", err);
    res.status(500).json({ message: "An error occurred while updating the course." });
  }
};

const getCourseById = async (req, res) => {
  const { courseId } = req.params;
  try {
    if (!courseId) return res.status(400).send("CourseID is Missing");

    const getCourse = await Course.findById(courseId);

    if (!getCourse) return res.status(400).send("Course is not found!!!");
    // after delete db delete img of course from cloudinary

    res.status(200).send(getCourse);
  } catch (err) {
    res.status(400).send("Error:" + err);
  }
};
const getAllCourses = async (req, res) => {
  //   const { courseId } = req.params;
  try {

    const getAllCourse = await Course.find({});

    if (getAllCourse.length == 0)
      return res.status(400).send("Course is not Avaliable!!!");
    

    res.status(201).json({ getAllCourse });
  } catch (err) {
    console.error("Error Fialed to fethc Courses:", err);
    res.status(500).json({ error: message || "Failed to get any courses" });
  }
};
const purchaseCourseByuser = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.result._id;
  try {
    if (!courseId) return res.status(400).send("CourseID is Missing");

    const user = await User.findById(userId).populate({
      path: "coursesPurchase",
    });

    if (user.coursesPurchase.length == 0)
      return res.status(400).send("Course is not Purchase!!!");

    res.status(200).send(user.coursesPurchase);
  } catch (err) {
    res.status(400).send("Error:" + err);
  }
};

module.exports = {
  createCourse,
  deleteCourse,
  updateCourse,
  getCourseById,
  getAllCourses,
  purchaseCourseByuser,
};
