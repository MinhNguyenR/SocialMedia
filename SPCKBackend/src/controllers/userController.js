import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import asyncHandler from 'express-async-handler'
import cloudinary from '../config/cloudinary.js'; 
import fs from 'fs';
export const getMe = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};

export const updateProfile = async (req, res) => {
    const { username, email } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tìm thấy' });
        }

        if (username && username !== user.username) {
            const usernameExist = await User.findOne({ username });
            if (usernameExist && usernameExist._id.toString() !== user._id.toString()) {
                return res.status(400).json({ success: false, message: 'Username đã được sử dụng' });
            }
            user.username = username;
        }

        if (email && email !== user.email) {
            const emailExist = await User.findOne({ email });
            if (emailExist && emailExist._id.toString() !== user._id.toString()) {
                return res.status(400).json({ success: false, message: 'Email đã có người sử dụng' });
            }
            user.email = email;
        }

        await user.save(); 

        res.status(200).json({ success: true, user: user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const updatePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'Hãy điền hết tất cả' });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ success: false, message: 'Pass mới chưa được nhập lại đúng' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'Pass mới cần hơn 6 chữ' });
    }

    try {
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
        }

        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Pass hiện tại là sai' });
        }

        user.password = newPassword;
        await user.save(); 

        res.status(200).json({ success: true, message: 'Đổi pass thành công' });

    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .select('-password')
        .lean(); 

    if (user) {
        res.json({
            success: true,
            message: 'Lấy thông tin người dùng thành công!',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar,
                bio: user.bio || '',
                createdAt: user.createdAt,
                friends: user.friends || [],
                friendRequests: user.friendRequests || [],
            },
        });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy người dùng.');
    }
});

export const updateBio = asyncHandler(async (req, res) => {
    const user = req.user; 
    const { bio } = req.body;

    if (user) {
        user.bio = bio;
        await user.save(); 

        res.json({
            success: true,
            message: 'Cập nhật tiểu sử thành công!',
            data: {
                id: user._id,
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                bio: user.bio
            },
        });
    } else {
        res.status(404);
        throw new Error('Người dùng không tồn tại.');
    }
});

export const searchUsers = async (req, res) => {
        try {
            const searchBaseName = req.query.baseName;

            if (!searchBaseName || searchBaseName.trim() === '') {
                return res.status(200).json([]);
            }
            const users = await User.find({
                username: { $regex: searchBaseName, $options: 'i' }
            });
            return res.status(200).json(users);

        } catch (err) {
            console.error("Error in searchUser (userController):", err);
            return res.status(500).json("Internal Server Error during user search.");
        }
    }

export const uploadAvatar = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh.' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'avatars',
        transformation: [{ width: 300, height: 300, crop: 'thumb', gravity: 'face' }]
    });

    fs.unlinkSync(req.file.path);

    user.avatar = result.secure_url;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Cập nhật avatar thành công!',
        data: { avatar: user.avatar }
    });
});