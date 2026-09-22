import Spiritual from '../models/Spiritual.js';
import { createController } from './factoryController.js';

const spiritualController = createController(Spiritual, false);

export const getSpiritualPlaces = spiritualController.getAll;
export const getSpiritualBySlug = spiritualController.getBySlug;
export const createSpiritual = spiritualController.create;
export const updateSpiritual = spiritualController.update;
export const deleteSpiritual = spiritualController.remove;
