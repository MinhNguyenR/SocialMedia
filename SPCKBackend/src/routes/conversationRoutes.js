import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getConversations, getConversationByParticipants, createGroupConversation, softDeleteConversation, updateConversation, addMemberToConversation, kickMemberFromConversation, leaveGroupConversation, transferAdminRights, getConversationById, deleteGroupPermanently 
} from '../controllers/conversationController.js';

const router = express.Router();

router.get('/', protect, getConversations);
router.get('/user/:targetUserId', protect, getConversationByParticipants);
router.get('/:conversationId', protect, getConversationById); 
router.post('/group', protect, createGroupConversation);
router.put('/:conversationId/soft-delete', protect, softDeleteConversation);
router.put('/:conversationId', protect, updateConversation);
router.post('/:conversationId/add-member', protect, addMemberToConversation);
router.put('/:conversationId/kick-member', protect, kickMemberFromConversation);
router.put('/:conversationId/leave', protect, leaveGroupConversation); 
router.put('/:conversationId/transfer-admin', protect, transferAdminRights);
router.delete('/:conversationId/delete-permanently', protect, deleteGroupPermanently); 

export default router;
