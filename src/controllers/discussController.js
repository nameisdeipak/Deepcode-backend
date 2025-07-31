

const Discussion = require('../models/discuss');

const transformAuthor = (author) => {
    if (!author || !author.userName) {
        return {
            _id: null,
            username: " Anonymous",
            avatar: `https://api.dicebear.com/8.x/initials/svg?seed=DeletedUser`
        };
    }
    return {
        _id: author._id,
        username: author.userName,
        avatar: author.profile?.secure_url || `https://api.dicebear.com/8.x/initials/svg?seed=${author.userName}`,
    };
};

const discussionPopulateOptions = [
    {
        path: 'author',
        model: 'user', // Based on your provided model schema
        select: 'userName profile'
    },
    {
        path: 'comments.author',
        model: 'user', // Based on your provided model schema
        select: 'userName profile'
    }
];

const createDiscussion = async (req, res) => {
    const { title, content, tags } = req.body;
    
    if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
    }

    try {
        const discussion = await Discussion.create({
            title,
            content,
            tags,
            author: req.result._id, 
        });
       
        await discussion.populate(discussionPopulateOptions[0]);
        const plainObject = discussion.toObject();

        res.status(201).json({
            ...plainObject,
            author: transformAuthor(plainObject.author)
        });
    } catch (error) {
        console.error("Error in createDiscussion:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getAllDiscussions = async (req, res) => {
    try {
        const discussions = await Discussion.find({})
            .populate(discussionPopulateOptions)
            .sort({ createdAt: -1 })
            .lean();

        const transformedDiscussions = discussions.map(d => ({
            ...d,
            author: transformAuthor(d.author),
            comments: d.comments.map(c => ({
                ...c,
                author: transformAuthor(c.author),
            }))
        }));
        
        res.status(200).json(transformedDiscussions);
    } catch (error) {
        console.error("Error in getAllDiscussions:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getDiscussionById = async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id)
            .populate(discussionPopulateOptions)
            .lean();
            
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }
        
        const transformedDiscussion = {
            ...discussion,
            author: transformAuthor(discussion.author),
            comments: discussion.comments.map(c => ({
                ...c,
                author: transformAuthor(c.author),
            }))
        };
        
        res.status(200).json(transformedDiscussion);
    } catch (error) {
        console.error("Error in getDiscussionById:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addComment = async (req, res) => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Comment text is required' });
    }

    try {
        let discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found' });
        }

        discussion.comments.push({ text, author: req.result._id });
        await discussion.save();
        await discussion.populate(discussionPopulateOptions);
        
        const plainDiscussionObject = discussion.toObject();

        const transformedDiscussion = {
            ...plainDiscussionObject,
            author: transformAuthor(plainDiscussionObject.author),
            comments: plainDiscussionObject.comments.map(comment => ({
                ...comment,
                author: transformAuthor(comment.author),
            }))
        };

        res.status(201).json(transformedDiscussion);
    } catch (error) {
        console.error("Error in addComment:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const handleVote = async (req, res) => {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.result._id;

    if (!['upvote', 'downvote'].includes(voteType)) {
        return res.status(400).json({ message: 'Invalid vote type.' });
    }

    try {
        let discussion = await Discussion.findById(id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found.' });
        }
        
        const isUpvoted = discussion.upvotes.includes(userId);
        const isDownvoted = discussion.downvotes.includes(userId);

        if (voteType === 'upvote') {
            discussion.downvotes.pull(userId);
            if (isUpvoted) {
                discussion.upvotes.pull(userId);
            } else {
                discussion.upvotes.push(userId);
            }
        } else if (voteType === 'downvote') {
            discussion.upvotes.pull(userId);
            if (isDownvoted) {
                discussion.downvotes.pull(userId);
            } else {
                discussion.downvotes.push(userId);
            }
        }

        await discussion.save();
        await discussion.populate(discussionPopulateOptions);

        const plainDiscussionObject = discussion.toObject();

        const transformedDiscussion = {
            ...plainDiscussionObject,
            author: transformAuthor(plainDiscussionObject.author),
            comments: plainDiscussionObject.comments.map(comment => ({
                ...comment,
                author: transformAuthor(comment.author),
            }))
        };
        
        res.status(200).json(transformedDiscussion);
    } catch (error) {
        console.error("Error in handleVote:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getMyDiscussions = async (req, res) => {
    try {
        const discussions = await Discussion.find({ author: req.result._id })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json(discussions);
    } catch (error) {
        console.error("Error in getMyDiscussions:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateDiscussion = async (req, res) => {
    const { title, content, tags } = req.body;
    try {
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found.' });
        }
        if (discussion.author.toString() !== req.result._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to update this post.' });
        }

        discussion.title = title || discussion.title;
        discussion.content = content || discussion.content;
        discussion.tags = Array.isArray(tags) ? tags : discussion.tags;

        const updatedDiscussion = await discussion.save();
        res.status(200).json(updatedDiscussion);

    } catch (error) {
        console.error("Error in updateDiscussion:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteDiscussion = async (req, res) => {
    try {
        const discussion = await Discussion.findById(req.params.id);
        if (!discussion) {
            return res.status(404).json({ message: 'Discussion not found.' });
        }
        if (discussion.author.toString() !== req.result._id.toString()) {
            return res.status(403).json({ message: 'User not authorized to delete this post.' });
        }

        await Discussion.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Discussion removed successfully.' });

    } catch (error) {
        console.error("Error in deleteDiscussion:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


module.exports = {
    createDiscussion,
    getAllDiscussions,
    getDiscussionById,
    addComment,
    handleVote,
    getMyDiscussions,
    updateDiscussion,
    deleteDiscussion,
};