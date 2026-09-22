import express from 'express';
import {
  getChats,
  getChatById,
  createChat,
  updateChat,
  deleteChat,
  sendMessage
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All chat routes require authentication

router.route('/')
  .get(getChats)
  .post(createChat);

router.route('/:id')
  .get(getChatById)
  .patch(updateChat)
  .delete(deleteChat);

router.post('/:id/messages', sendMessage);

export default router;
