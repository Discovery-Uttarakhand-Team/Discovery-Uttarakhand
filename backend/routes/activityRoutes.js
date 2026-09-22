import express from 'express';
import { 
  getActivities, 
  getActivityBySlug, 
  createActivity, 
  updateActivity, 
  deleteActivity 
} from '../controllers/activityController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Activity from '../models/Activity.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';

const router = express.Router();

router.get('/', getActivities);
router.post('/', protect, adminOnly, createActivity);
router.get('/:slug/related', getRelatedBySlug(Activity, 'Activity'));
router.get('/:slug', getActivityBySlug);
router.patch('/:id', protect, adminOnly, updateActivity);
router.delete('/:id', protect, adminOnly, deleteActivity);

export default router;
