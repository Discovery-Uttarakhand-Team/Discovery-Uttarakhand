import express from 'express';
import { registerUser, loginUser, getMe, logoutUser, registerPartner } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/register-partner', registerPartner);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/logout', logoutUser);

export default router;
