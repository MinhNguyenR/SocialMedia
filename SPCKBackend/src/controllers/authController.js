import User from '../models/User.js';
import jwt from 'jsonwebtoken'; 
import bcrypt from 'bcryptjs'; 

export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Đã nhận yêu cầu đăng ký', req.body); 

    try {
        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            console.log('Thất bại vì đã có người dùng email này');
            return res.status(400).json({ success: false, message: 'Đã có người dùng email này' });
        }

        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            console.log('Thất bại vì tên đã được dùng');
            return res.status(400).json({ success: false, message: 'Tên đã được sử dụng' });
        }

        console.log('Tạo người dùng mới...');
        const user = await User.create({
            username,
            email,
            password
        });
        console.log('User tạo thành công:', user); 

        const token = user.getSignedJwtToken();
        console.log('JWT token đã tạo');

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Lỗi', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server lỗi', error: error.message });
    }
};
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log('Nhận yêu cầu đăng nhập', req.body); 

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Nhậ mật khẩu và email' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');
        console.log('User found for login:', user ? user.email : 'None');

        if (!user) {
            console.log('Đăng nhập không thành công');
            return res.status(400).json({ success: false, message: 'Không hợp lệ' });
        }

        const isMatch = await user.matchPassword(password);
        console.log('Khớp', isMatch);

        if (!isMatch) {
            console.log('Mật khẩu không khớp.');
            return res.status(400).json({ success: false, message: 'Không hợp lệ' });
        }

        const token = user.getSignedJwtToken();
        console.log('Gen token để login');

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

export const getMe = async (req, res) => {
    const user = req.user; 

    if (user) {
        res.status(200).json({
            success: true,
            data: {
                _id: user._id, 
                username: user.username,
                email: user.email,
                createdAt: user.createdAt,
                bio: user.bio || '',
                avatar: user.avatar || '' 
            }
        });
    } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }
};

export const updateProfile = async (req, res) => {
    const user = req.user; 

    if (user) {

        user.username = req.body.username || user.username;
        user.email = req.body.email || user.email;

        try {
            const updatedUser = await user.save();
            res.json({
                success: true,
                message: 'Cập nhật profile thành công',
                data: {
                    _id: updatedUser._id,
                    username: updatedUser.username,
                    email: updatedUser.email,
                    createdAt: updatedUser.createdAt,
                    updatedAt: updatedUser.updatedAt,
                }
            });
        } catch (error) {
            console.error('Lỗi khi cập nhật profile:', error);
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: 'Email hoặc tên người dùng đã tồn tại.' });
            }
            res.status(500).json({ success: false, message: 'Không thể cập nhật profile', error: error.message });
        }
    } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng để cập nhật profile' });
    }
};

export const updatePassword = async (req, res) => {
    const user = await User.findById(req.user._id).select('+password'); 

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
    }

    if (user) {
        const isMatch = await user.matchPassword(currentPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
        }
        user.password = newPassword;

        try {
            await user.save();
            res.json({ success: true, message: 'Cập nhật mật khẩu thành công.' });
        } catch (error) {
            console.error('Lỗi khi cập nhật mật khẩu:', error);
            res.status(500).json({ success: false, message: 'Không thể cập nhật mật khẩu', error: error.message });
        }
    } else {
        res.status(404).json({ success: false, message: 'Không tìm thấy người dùng để cập nhật mật khẩu' });
    }
};
