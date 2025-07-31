const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      required: true,
    },
    chapters: [
      {
        chapterName: {
          type: String,
          required: true,
        },
        chapterDetails: {
          type: String,
          required: true,
        },
      },
    ],
    descriptions: [
      {
        descriptionTitle: {
          type: String,
          required: true,
        },
        description: {
          type: String,
          required: true,
        },
      },
    ],
    courseType: {
      type: String,
      enum: ["feature", "learn", "interview"],
      default: "feature",
      required: true,
    },
   
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    premium: {
      type: Boolean,
      required: true,
      default: "true",
    },
    image: {
      type: {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    },
    courseUrl: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("courses", courseSchema);

module.exports = Course;
