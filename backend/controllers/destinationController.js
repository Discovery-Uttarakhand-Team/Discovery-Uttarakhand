import Destination from '../models/Destination.js';
import { createController } from './factoryController.js';

const destinationController = createController(Destination, true); // true for isTextIndexed

export const getDestinations = destinationController.getAll;
export const getDestinationBySlug = destinationController.getBySlug;
export const createDestination = destinationController.create;
export const updateDestination = destinationController.update;
export const deleteDestination = destinationController.remove;
