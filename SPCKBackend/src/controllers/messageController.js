import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js'; 
import Conversation from '../models/Conversation.js';

export const sendMessage = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderId = req.user._id;

    if (!content) {
        res.status(400);
        throw new Error('Nội dung tin nhắn không được để trống.');
    }

    let conversation = await Conversation.findById(conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Không tìm thấy cuộc trò chuyện.');
    }

    const message = await Message.create({
        conversation: conversationId,
        sender: senderId,
        content,
        readBy: [senderId], 
    });

    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date(); 
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username avatar');

    res.status(201).json({
        success: true,
        data: populatedMessage,
    });
});

export const getMessagesInConversation = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'username avatar')
        .sort({ createdAt: 1 });

    for (const msg of messages) {
        if (msg.sender._id.toString() !== currentUserId.toString() && !msg.readBy.includes(currentUserId)) {
            msg.readBy.push(currentUserId);
            await msg.save(); 
        }
    }

    res.status(200).json({
        success: true,
        data: messages,
    });
});

export const markMessageAsRead = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = req.user._id; 

    const message = await Message.findById(messageId);

    if (!message) {
        res.status(404);
        throw new Error('Không tìm thấy tin nhắn.');
    }

    if (!message.readBy.includes(userId)) {
        message.readBy.push(userId);
        await message.save();
    }

    res.status(200).json({
        success: true,
        message: 'Tin nhắn đã được đánh dấu là đã đọc.',
    });
});

export const getUnreadMessageCount = asyncHandler(async (req, res) => {
    const userId = req.user._id; 

    if (!userId) {
        res.status(400);
        throw new Error('Không tìm thấy ID người dùng trong token.');
    }
    const distinctUnreadSenders = await Message.distinct('sender', {
        sender: { $ne: userId },
        readBy: { $nin: [userId] },
    });

    let count = distinctUnreadSenders.length;
    if (count > 9) {
        count = '9+';
    }

    console.log(`[MessageController] Lấy số lượng người gửi có tin nhắn chưa đọc cho người dùng ${userId}: ${count}`);

    res.status(200).json({
        success: true,
        count: count, 
        message: 'Lấy số lượng tin nhắn chưa đọc thành công!',
    });
});
