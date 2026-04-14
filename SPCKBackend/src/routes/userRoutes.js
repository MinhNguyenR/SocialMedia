import express from 'express';
import { getMe, updateProfile, updatePassword, getUserById, updateBio, searchUsers, uploadAvatar } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, getFriends, getFriendRequests, getFriendSuggestions} from '../controllers/friendController.js';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.route('/me').get(protect, getMe).put(protect, updateProfile);
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getFriendSuggestions);
router.put('/updatepassword', protect, updatePassword);
router.put('/bio', protect, updateBio);
router.put('/avatar', protect, upload.single('avatar'), uploadAvatar);


router.get('/:id', protect, getUserById); 
router.post('/:id/friend-request', protect, sendFriendRequest);
router.put('/:id/accept-friend', protect, acceptFriendRequest);
router.get('/:id/friends', protect, getFriends);
router.put('/:id/decline-friend', protect, declineFriendRequest);
router.delete('/:id/remove-friend', protect, removeFriend);
router.get('/:id/friend-requests', protect, getFriendRequests);
export default router;
