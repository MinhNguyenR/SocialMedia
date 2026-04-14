import Post from '../models/Post.js';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const createPost = asyncHandler(async (req, res) => {
    const { _id: userId } = req.user;
    const { content, images } = req.body;

    if (!content && (!images || images.length === 0)) {
        res.status(400);
        throw new Error('Bài viết không được để trống nội dung hoặc ảnh.');
    }

    let uploadedImageUrls = [];

    if (images && images.length > 0) {
        for (const base64Image of images) {
            try {
                const uploadResult = await cloudinary.uploader.upload(base64Image, {
                    folder: 'posts',
                    transformation: [{ width: 1080, height: 1080, crop: 'limit' }],
                });
                uploadedImageUrls.push({
                    url: uploadResult.secure_url,
                    public_id: uploadResult.public_id
                });
            } catch (error) {
                console.error('Lỗi upload ảnh lên Cloudinary:', error);
                throw new Error('Tải ảnh thất bại.');
            }
        }
    }

    const post = await Post.create({
        user: userId,
        content,
        images: uploadedImageUrls,
    });

    await post.populate('user', 'username email avatar');


    res.status(201).json({
        success: true,
        message: 'Bài viết đã được đăng thành công!',
        data: post,
    });
});

export const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({ isDeleted: false })
        .populate('user', 'username email avatar')
        .populate('comments.user', 'username avatar')
        .populate('reactions.user', 'username')
        .sort({ createdAt: -1 });


    res.status(200).json({
        success: true,
        message: 'Lấy bài viết thành công!',
        data: posts,
    });
});

export const deletePost = asyncHandler(async (req, res) => {
    const { id: postId } = req.params;
    const { _id: userId } = req.user;

    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Không tìm thấy bài viết.');
    }

    if (post.user.toString() !== userId.toString()) {
        res.status(403);
        throw new Error('Bạn không có quyền xóa bài viết này.');
    }

    post.isDeleted = true;
    await post.save();

    if (post.images && post.images.length > 0) {
        for (const media of post.images) {
            try {
                await cloudinary.uploader.destroy(media.public_id, {
                    resource_type: media.resource_type || 'image'
                });
            } catch (err) {
                console.warn(`Không thể xoá media Cloudinary: ${media.public_id}`, err.message);
            }
        }
    }

    res.status(200).json({
        success: true,
        message: 'Bài viết đã được xóa thành công!',
    });
});

export const addReaction = asyncHandler(async (req, res) => {
    const { id: postId } = req.params;
    const { _id: userId } = req.user;
    const { type = 'like' } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Không tìm thấy bài viết.');
    }

    const existingReactionIndex = post.reactions.findIndex(
        (reaction) => reaction.user.toString() === userId.toString()
    );

    let messageText;
    let statusCode;

    if (existingReactionIndex !== -1) {
        if (post.reactions[existingReactionIndex].type === type) {
            post.reactions.splice(existingReactionIndex, 1);
            messageText = 'Đã bỏ reaction!';
            statusCode = 200;
        } else {

            post.reactions[existingReactionIndex].type = type;
            messageText = 'Đã thay đổi reaction!';
            statusCode = 200;
        }
    } else {
        post.reactions.push({ user: userId, type });
        messageText = 'Đã thêm reaction!';
        statusCode = 201;
    }

    await post.save();
    const updatedPost = await Post.findById(postId)
        .populate('reactions.user', 'username');

    res.status(statusCode).json({
        success: true,
        message: messageText,
        data: updatedPost.reactions,
    });
});


export const addComment = asyncHandler(async (req, res) => {
    const { id: postId } = req.params;
    const { _id: userId } = req.user;
    const { text } = req.body;

    if (!text) {
        res.status(400);
        throw new Error('Nội dung bình luận không được để trống.');
    }

    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Không tìm thấy bài viết.');
    }

    const newComment = {
        user: userId,
        text,
        createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const commentUser = await User.findById(userId).select('username avatar');

    const addedSubdocumentComment = post.comments[post.comments.length - 1];

    const responseComment = {
        _id: addedSubdocumentComment._id,
        user: {
            _id: commentUser._id,
            username: commentUser.username,
            avatar: commentUser.avatar || ''
        },
        text: addedSubdocumentComment.text,
        createdAt: addedSubdocumentComment.createdAt,
    };

    res.status(201).json({
        success: true,
        message: 'Bình luận đã được thêm thành công!',
        data: responseComment,
    });
});

export const getUserPosts = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId, isDeleted: false })
        .populate('user', 'username email avatar')
        .populate('comments.user', 'username')
        .populate('reactions.user', 'username')
        .sort({ createdAt: -1 });


    res.status(200).json({
        success: true,
        message: `Lấy bài viết của người dùng ${userId} thành công!`,
        data: posts,
    });
});

export const uploadPostWithImages = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const content = req.body.content || '';
    const files = req.files || [];

    if (!content && files.length === 0) {
        res.status(400);
        throw new Error('Bài viết không được để trống nội dung hoặc ảnh.');
    }

    const imageUploads = [];

    for (const file of files) {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                folder: 'posts',
                resource_type: 'auto'
            });

            imageUploads.push({
                url: result.secure_url,
                public_id: result.public_id,
                resource_type: result.resource_type
            });
        } catch (error) {
            console.error('Lỗi khi upload ảnh:', error);
            throw new Error('Không thể upload ảnh lên Cloudinary.');
        } finally {
            fs.unlinkSync(file.path);
        }
    }

    const post = await Post.create({
        user: userId,
        content,
        images: imageUploads
    });

    await post.populate('user', 'username email avatar');

    res.status(201).json({
        success: true,
        message: 'Bài viết đã được đăng với ảnh!',
        data: post
    });
});