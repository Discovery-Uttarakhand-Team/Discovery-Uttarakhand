import Stay from '../models/Stay.js';
import { createController } from './factoryController.js';

const stayController = createController(Stay, false);

export const getStays = stayController.getAll;
export const getStayBySlug = stayController.getBySlug;
export const createStay = stayController.create;
export const updateStay = stayController.update;
export const deleteStay = stayController.remove;
