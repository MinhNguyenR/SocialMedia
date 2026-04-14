import express from 'express';
import { createPost, getPosts, deletePost, addReaction, addComment, getUserPosts, uploadPostWithImages } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js'; 
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); 

const router = express.Router();

router.post('/', protect, createPost);
router.get('/', getPosts);
router.get('/user/:userId', getUserPosts);
router.put('/:id/delete', protect, deletePost);
router.put('/:id/react', protect, addReaction);
router.post('/:id/comment', protect, addComment);
router.post('/upload', protect, upload.array('images', 5), uploadPostWithImages);


export default router;
