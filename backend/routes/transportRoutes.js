import express from 'express';
import { getTransports, getCorridorTransports } from '../controllers/transportController.js';

const router = express.Router();

router.get('/', getTransports);
router.get('/corridor', getCorridorTransports);

export default router;
