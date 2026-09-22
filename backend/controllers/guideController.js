import Guide from '../models/Guide.js';
import { createController } from './factoryController.js';

const guideController = createController(Guide, false);

export const getGuides = guideController.getAll;
export const getGuideBySlug = guideController.getBySlug;
export const createGuide = guideController.create;
export const updateGuide = guideController.update;
export const deleteGuide = guideController.remove;
