const express = require('express');
const {
    createDiscussion,
    getAllDiscussions,
    getDiscussionById,
    addComment,
    handleVote,
        getMyDiscussions,
    updateDiscussion,
    deleteDiscussion,
} = require('../controllers/discussController.js');


const userMiddleware = require('../middleware/userMiddleware.js');

const discussRouter = express.Router();


discussRouter.get('/getAllDiscuss',userMiddleware, getAllDiscussions);
discussRouter.get('/getDiscussBy/:id', userMiddleware,getDiscussionById);


discussRouter.post('/createDiscuss', userMiddleware, createDiscussion);
discussRouter.post('/:id/comment', userMiddleware, addComment);

discussRouter.put('/:id/vote', userMiddleware, handleVote);


discussRouter.get('/my-posts', userMiddleware, getMyDiscussions); 
discussRouter.put('/:id', userMiddleware, updateDiscussion);
discussRouter.delete('/:id', userMiddleware, deleteDiscussion);

module.exports = discussRouter;