import express from 'express';
import { getFavorites, addFavorite, removeFavorite, toggleFavorite } from '../controllers/favoriteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getFavorites);
router.post('/', addFavorite);
router.post('/:itemType/:item/toggle', toggleFavorite);
router.delete('/:itemType/:item', removeFavorite);
router.delete('/:id', removeFavorite);

export default router;
