import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { sendMessage, getMessagesInConversation, markMessageAsRead, getUnreadMessageCount } from '../controllers/messageController.js';

const router = express.Router();

router.post('/:conversationId', protect, sendMessage);
router.get('/:conversationId', protect, getMessagesInConversation);
router.put('/:messageId/read', protect, markMessageAsRead);
router.get('/unread/count', protect, getUnreadMessageCount);
export default router;
