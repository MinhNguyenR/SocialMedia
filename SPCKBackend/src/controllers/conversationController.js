import asyncHandler from 'express-async-handler';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Hàm chung để populate conversation
const populateConversation = (query) => {
    return query
        .populate('participants', 'username avatar')
        .populate('admin', 'username avatar') // Thêm populate trường admin
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username',
            },
        });
};

export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const conversations = await populateConversation(
        Conversation.find({ participants: userId, isDeleted: false })
    ).sort({ updatedAt: -1 });

    res.status(200).json({
        success: true,
        data: conversations,
    });
});

export const getConversationById = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id; // Lấy ID người dùng hiện tại từ token

    const conversation = await populateConversation(
        Conversation.findById(conversationId)
    );

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    const isParticipant = conversation.participants.some(p => p._id.toString() === currentUserId.toString());
    const isAdminOfGroup = conversation.isGroup && conversation.admin.some(a => a._id.toString() === currentUserId.toString());

    if (!isParticipant && !isAdminOfGroup) {
        res.status(403);
        throw new Error('Bạn không có quyền truy cập cuộc trò chuyện này.');
    }

    res.status(200).json({
        success: true,
        data: conversation,
    });
});

export const getConversationByParticipants = asyncHandler(async (req, res) => {
    const { targetUserId } = req.params;
    const currentUserId = req.user._id;

    let conversation = await populateConversation(
        Conversation.findOne({
            participants: { $all: [currentUserId, targetUserId], $size: 2 },
            isDeleted: false,
            isGroup: false, // Thêm điều kiện này để chỉ tìm cuộc trò chuyện 1-1
        })
    );

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [currentUserId, targetUserId],
            isGroup: false, 
        });
        conversation = await populateConversation(Conversation.findById(conversation._id));
    }

    res.status(200).json({
        success: true,
        data: conversation,
    });
});

export const createGroupConversation = asyncHandler(async (req, res) => {
    let { participantIds } = req.body; 
    const currentUserId = req.user._id;

    const combinedIds = [...(participantIds || []), currentUserId.toString()]; 
    const uniqueParticipantIds = Array.from(new Set(combinedIds));

    if (uniqueParticipantIds.length < 2) {
        res.status(400);
        throw new Error('Phải có ít nhất 2 người dùng để tạo nhóm (bao gồm cả bạn).');
    }

    const existingUsers = await User.find({ _id: { $in: uniqueParticipantIds } });
    if (existingUsers.length !== uniqueParticipantIds.length) {
        res.status(400);
        throw new Error('Có một hoặc nhiều người dùng không tồn tại trong danh sách thành viên.');
    }

    const existingConversation = await populateConversation(
        Conversation.findOne({
            participants: { $all: uniqueParticipantIds, $size: uniqueParticipantIds.length },
            isGroup: true, 
            isDeleted: false,
        })
    );

    if (existingConversation) {
        res.status(200).json({
            success: true,
            data: existingConversation,
            message: 'Nhóm với các thành viên này đã tồn tại.',
        });
        return;
    }

    const conversation = await Conversation.create({
        participants: uniqueParticipantIds,
        isGroup: true,
        name: `Nhóm ${uniqueParticipantIds.length} thành viên`, 
        admin: [currentUserId], 
    });

    const populatedConversation = await populateConversation(Conversation.findById(conversation._id));

    res.status(201).json({
        success: true,
        data: populatedConversation,
    });
});

export const softDeleteConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id; 
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (conversation.isGroup) {
        if (!conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
            res.status(403); 
            throw new Error('Bạn không có quyền xóa nhóm này.');
        }
    }
    
    conversation.isDeleted = true; 
    await conversation.save();
    res.status(200).json({
        success: true,
        message: 'Đã xóa cuộc trò chuyện thành công.',
    });
});

export const deleteGroupPermanently = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (!conversation.isGroup) {
        res.status(400);
        throw new Error('Đây không phải là cuộc trò chuyện nhóm.');
    }

    if (!conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
        res.status(403);
        throw new Error('Bạn không có quyền xóa vĩnh viễn nhóm này.');
    }

    await Conversation.deleteOne({ _id: conversationId }); 
    res.status(200).json({
        success: true,
        message: 'Đã xóa vĩnh viễn nhóm thành công.',
    });
});


export const updateConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { name } = req.body;
    const currentUserId = req.user._id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (conversation.isGroup && !conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
        res.status(403);
        throw new Error('Bạn không có quyền đổi tên nhóm này.');
    }

    if (name) {
        conversation.name = name;
    }
    await conversation.save();
    const updatedConversation = await populateConversation(Conversation.findById(conversationId));
    res.status(200).json({
        success: true,
        data: updatedConversation,
    });
});

export const addMemberToConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user._id; 
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (!conversation.isGroup) {
        res.status(400);
        throw new Error('Không thể thêm thành viên vào cuộc trò chuyện 1-1.');
    }

    if (!conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
        res.status(403);
        throw new Error('Bạn không có quyền thêm thành viên vào nhóm này.');
    }

    if (conversation.participants.some(p => p.toString() === userId.toString())) {
        res.status(400);
        throw new Error('Người dùng đã nằm trong nhóm.');
    }

    conversation.participants.push(userId);
    await conversation.save();
    const updatedConversation = await populateConversation(Conversation.findById(conversationId));
    res.status(200).json({
        success: true,
        data: updatedConversation,
    });
});

export const kickMemberFromConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { memberId } = req.body;
    const currentUserId = req.user._id; 
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (!conversation.isGroup) {
        res.status(400);
        throw new Error('Không thể kick thành viên khỏi cuộc trò chuyện 1-1.');
    }

    if (!conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
        res.status(403);
        throw new Error('Bạn không có quyền kick thành viên khỏi nhóm này.');
    }

    if (!conversation.participants.some(p => p.toString() === memberId.toString())) {
        res.status(400);
        throw new Error('Người dùng không nằm trong nhóm.');
    }
    
    if (memberId.toString() === currentUserId.toString()) { 
        res.status(400);
        throw new Error('Không thể kick chính mình.');
    }
    
    if (conversation.admin.some(adminUser => adminUser._id.toString() === memberId.toString())) { 
        res.status(403);
        throw new Error('Bạn không thể kick một admin khác.');
    }

    conversation.participants = conversation.participants.filter(id => id.toString() !== memberId.toString());
    await conversation.save();
    const updatedConversation = await populateConversation(Conversation.findById(conversationId));
    res.status(200).json({
        success: true,
        data: updatedConversation,
    });
});

export const leaveGroupConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (!conversation.isGroup) {
        res.status(400);
        throw new Error('Không thể rời khỏi cuộc trò chuyện 1-1. Hãy xóa nó.');
    }

    if (!conversation.participants.some(p => p.toString() === userId.toString())) {
        res.status(400);
        throw new Error('Bạn không nằm trong nhóm này.');
    }

    conversation.participants = conversation.participants.filter(id => id.toString() !== userId.toString());
    
    if (conversation.admin.some(adminUser => adminUser._id.toString() === userId.toString())) { 
        conversation.admin = conversation.admin.filter(adminUser => adminUser._id.toString() !== userId.toString());
    }

    await conversation.save();
    const updatedConversation = await populateConversation(Conversation.findById(conversationId));
    res.status(200).json({
        success: true,
        data: updatedConversation,
        message: 'Bạn đã thoát nhóm thành công.',
    });
});

export const transferAdminRights = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { newAdminId } = req.body;
    const currentUserId = req.user._id; 

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Cuộc trò chuyện không tồn tại.');
    }

    if (!conversation.isGroup) {
        res.status(400);
        throw new Error('Không thể chuyển quyền admin trong cuộc trò chuyện 1-1.');
    }

    // Chỉ người hiện tại đang là admin mới có quyền chuyển quyền
    if (!conversation.admin.some(adminUser => adminUser._id.toString() === currentUserId.toString())) { 
        res.status(403);
        throw new Error('Bạn không có quyền chuyển quyền admin.');
    }

    if (!conversation.participants.some(p => p.toString() === newAdminId.toString())) { 
        res.status(400);
        throw new Error('Người được chuyển quyền admin phải là thành viên hiện tại của nhóm.');
    }

    if (currentUserId.toString() === newAdminId.toString()) { 
        res.status(400);
        throw new Error('Không thể chuyển quyền admin cho chính mình.');
    }
    
    const newAdminUser = await User.findById(newAdminId);
    if (!newAdminUser) {
        res.status(404);
        throw new Error('Người dùng mới được chuyển quyền admin không tồn tại.');
    }

    // Kiểm tra xem newAdminUser đã tồn tại trong mảng admin hay chưa bằng cách so sánh _id
    const newAdminExists = conversation.admin.some(admin => admin._id.toString() === newAdminUser._id.toString());
    
    if (!newAdminExists) {
        // Nếu không tồn tại, thêm đối tượng User vào mảng admin
        conversation.admin.push(newAdminUser);
    }
    
    await conversation.save();

    const updatedConversation = await populateConversation(Conversation.findById(conversation._id));

    res.status(200).json({
        success: true,
        data: updatedConversation,
        message: 'Đã chuyển quyền admin thành công.',
    });
});