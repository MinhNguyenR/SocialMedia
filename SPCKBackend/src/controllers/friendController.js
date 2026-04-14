import User from '../models/User.js';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
// Gửi lời mời kết bạn
export const sendFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
        return res.status(400).json({ success: false, message: 'Không thể gửi lời mời kết bạn đến chính mình.' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    if (targetUser.friendRequests.includes(currentUserId) || targetUser.friends.includes(currentUserId)) {
        return res.status(400).json({ success: false, message: 'Đã gửi lời mời hoặc đã là bạn bè.' });
    }

    targetUser.friendRequests.push(currentUserId);
    await targetUser.save();

    res.status(200).json({ success: true, message: 'Đã gửi lời mời kết bạn.' });
});

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id; // Người nhận
    const senderId = req.params.id; // Người gửi (từ :id)

    const currentUser = await User.findById(currentUserId);
    const sender = await User.findById(senderId);

    if (!currentUser || !sender) {
        return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
    }

    if (!currentUser.friendRequests.includes(senderId)) {
        return res.status(400).json({ success: false, message: 'Không có lời mời kết bạn từ người này.' });
    }

    currentUser.friends.push(senderId);
    sender.friends.push(currentUserId);
    currentUser.friendRequests.pull(senderId);

    await currentUser.save();
    await sender.save();

    res.status(200).json({ success: true, message: 'Đã chấp nhận lời mời kết bạn.' });
});

export const declineFriendRequest = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const senderId = req.params.id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    if (!currentUser.friendRequests.includes(senderId)) {
        return res.status(400).json({ success: false, message: 'Không có lời mời kết bạn từ người này.' });
    }

    currentUser.friendRequests.pull(senderId);
    await currentUser.save();

    res.status(200).json({ success: true, message: 'Đã từ chối lời mời kết bạn.' });
});

// Hủy kết bạn
export const removeFriend = asyncHandler(async (req, res) => {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    currentUser.friends = currentUser.friends.filter(id => id.toString() !== targetUserId);
    targetUser.friends = targetUser.friends.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ success: true, message: 'Đã hủy kết bạn.' });
});

export const getFriends = asyncHandler(async (req, res) => {
    console.log('Request to /api/users/:id/friends with id:', req.params.id);
    const userId = req.params.id;
    try {
        const user = await User.findById(userId).populate('friends', 'username email avatar');
        if (!user) {
            console.log('User not found:', userId);
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
        }
        console.log('User found, friends:', user.friends);
        res.status(200).json({ success: true, data: user.friends || [] });
    } catch (error) {
        console.error('Error in getFriends:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ', error: error.message });
    }
});

// Trong friendController.js
export const getFriendRequests = asyncHandler(async (req, res) => {
  console.log('Request to /:id/friend-requests, params:', req.params, 'userId:', req.user.id);
  const userId = req.params.id;
  if (userId !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
  }
  const user = await User.findById(userId).select('friendRequests');
  if (!user) {
    console.log('User not found:', userId);
    return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  }
  console.log('Friend requests IDs from DB:', user.friendRequests);
  const requests = await User.find({ _id: { $in: user.friendRequests } }).select('username avatar');
  console.log('Populated requests:', requests);
  res.status(200).json({ success: true, data: requests });
});


export const getFriendSuggestions = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
    }

    const validFriendIds = currentUser.friends.filter(id => mongoose.Types.ObjectId.isValid(id));

    const excludedIds = [
        currentUser._id,
        ...validFriendIds
    ];


    // Sử dụng MongoDB Aggregation để lấy 3 người dùng ngẫu nhiên
    const suggestions = await User.aggregate([
        { $match: { _id: { $nin: excludedIds } } },
        { $sample: { size: 3 } },
        { $project: { username: 1, avatar: 1 } }
    ]);

    res.status(200).json({ success: true, data: suggestions });
});