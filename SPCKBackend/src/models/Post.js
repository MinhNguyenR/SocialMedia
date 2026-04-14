import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        required: [true, 'Bài viết không được để trống nội dung'],
        maxlength: [1000, 'Nội dung bài viết không được quá 1000 ký tự'],
    },
    images: [
        {
            url: String,
            public_id: String,
            resource_type: {
                type: String,
                enum: ['image', 'video'],
                default: 'image'
            }
        }
    ],
    isDeleted: {
        type: Boolean,
        default: false,
    },
    comments: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            text: {
                type: String,
                required: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    reactions: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            type: {
                type: String,
                enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
            },
        },
    ],
}, {
    timestamps: true,
});

const Post = mongoose.model('Post', PostSchema);

export default Post;