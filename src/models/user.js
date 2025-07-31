const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 20,
    },
    lastName: {
      type: String,
      minLength: 3,
      maxLength: 20,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
      minLength: 3,
      maxLength: 20,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      immutable: true,
    },
    profile: {
      profile_url: {
        type: String,
      },
      secure_url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    age: {
      type: Number,
      min: 6,
      max: 80,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "not to say",null],
      default: null,
    },

    summary: {
      type: String,
      max: 300,
    },
    social_Url: {

        website: {
          type: String,
        },
        github: {
          type: String,
        },
        linkedin: {
          type: String,
        },
        x_twitter: {
          type: String,
        },
 
    },

    problemSolved: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "problem",
          unique: true,
        },
      ],
    },
    coursesPurchase: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "course",
          // unique: true,
        },
      ],
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.post("findOneAndDelete", async function (userInfo) {
  if (userInfo) {
    await mongoose.model("submission").deleteMany({ userId: userInfo._id });
  }
});

const User = mongoose.model("user", userSchema);

module.exports = User;
