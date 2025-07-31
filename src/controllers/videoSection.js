const cloudinary = require('cloudinary').v2;
const Problem = require("../models/problem");
const User = require("../models/user");
const SolutionVideo = require("../models/solutionVideo");


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const generateUploadSignature = async (req, res) => {
  try {
    const { problemId } = req.params;

    const userId = req.result._id;
    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Generate unique public_id for the video
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `leetcode-solutions/${problemId}/${userId}_${timestamp}`;

    // Upload parameters
   const uploadParams = {
      timestamp: timestamp,
      public_id: publicId,
    }; 

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      signature,
      timestamp,
      public_id: publicId,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`,
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    res.status(500).json({ error: 'Failed to generate upload credentials' });
  }
};

const saveVideoMetadata = async (req, res) => {
  try {
    const {
      problemId,
      cloudinaryPublicId,
      secureUrl,
      duration,
    } = req.body;

    const userId = req.result._id;

    // Verify the upload with Cloudinary
    const cloudinaryResource = await cloudinary.api.resource(
      cloudinaryPublicId,
      { resource_type: 'video' }
    );

    if (!cloudinaryResource) {
      return res.status(400).json({ error: 'Video not found on Cloudinary' });
    }

    const existingVideo = await SolutionVideo.findOne({
      problemId,
      userId,
      cloudinaryPublicId
    });

    if (existingVideo) {
      return res.status(409).json({ error: 'Video already exists' });
    }

    const thumbnailUrl = cloudinary.url(cloudinaryResource.public_id, {
    resource_type: 'video',
    transformation: [
    { width: 400, height: 225, crop: 'fill' },
    { quality: 'auto' },
    { start_offset: 'auto' }
    ],
    format: 'jpg'
    });


    const videoSolution = new SolutionVideo({
      problemId,
      userId,
      cloudinaryPublicId,
      secureUrl,
      duration: cloudinaryResource.duration || duration,
      thumbnailUrl
    });

    await videoSolution.save();

    res.status(201).json({
      message: 'Video solution saved successfully',
      videoSolution: {
        id: videoSolution._id,
        thumbnailUrl: videoSolution.thumbnailUrl,
        duration: videoSolution.duration,
        uploadedAt: videoSolution.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving video metadata:', error);
    res.status(500).json({ error: 'Failed to save video metadata' });
  }
};

const deleteVideo = async (req, res) => {
  const userId = req.result._id;
  try {
    const { problemId } = req.params;

    const video = await SolutionVideo.findOneAndDelete({
      problemId,
      userId
    });

    console.log(video);

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video' , invalidate: true });

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};
const getProblemVideos = async (req, res) => {
  try {
const [videosWithProblems, problemsWithoutVideos] = await Promise.all([
  SolutionVideo.find().populate({
    path: 'problemId',
    select: 'title tags difficulty'
  }),
  
  Problem.aggregate([
    {
      $lookup: {
        from: 'solutionvideos',
        localField: '_id',
        foreignField: 'problemId',
        as: 'videos'
      }
    },
    {
      $match: {
        videos: { $size: 0 }
      }
    },
    {
      $project: {
        title: 1,
        tags: 1,
        difficulty: 1
      }
    }
  ])
]);

   



    res.json({ 
      videosWithProblems,
      problemsWithoutVideos,
      message: 'Video Fectting  successfully'
     });

  } catch (error) {
    console.error('Error Fetchign  videos:', error);
    res.status(500).json({ error: 'Failed to Fetching  videos' });
  }
};

module.exports = {generateUploadSignature,saveVideoMetadata,deleteVideo,getProblemVideos};

