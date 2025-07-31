const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Correctly references your user model
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const discussionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters'],
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', // Correctly references your user model
        required: true,
    },
    tags: {
        type: [String],
        default: [],
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }],
    comments: [commentSchema],
}, {
    timestamps: true,
});

const Discussion = mongoose.model('Discussion', discussionSchema);
module.exports = Discussion;