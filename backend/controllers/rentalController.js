import Rental from '../models/Rental.js';
import { createController } from './factoryController.js';

const rentalController = createController(Rental, false);

export const getRentals = rentalController.getAll;
export const getRentalBySlug = rentalController.getBySlug;
export const createRental = rentalController.create;
export const updateRental = rentalController.update;
export const deleteRental = rentalController.remove;
