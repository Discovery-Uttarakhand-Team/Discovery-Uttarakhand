import Culture from '../models/Culture.js';
import { createController } from './factoryController.js';

const cultureController = createController(Culture, false);

export const getCulturePlaces = cultureController.getAll;
export const getCultureBySlug = cultureController.getBySlug;
export const createCulture = cultureController.create;
export const updateCulture = cultureController.update;
export const deleteCulture = cultureController.remove;
