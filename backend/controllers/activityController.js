import Activity from '../models/Activity.js';
import { createController } from './factoryController.js';

const activityController = createController(Activity, false);

export const getActivities = activityController.getAll;
export const getActivityBySlug = activityController.getBySlug;
export const createActivity = activityController.create;
export const updateActivity = activityController.update;
export const deleteActivity = activityController.remove;
