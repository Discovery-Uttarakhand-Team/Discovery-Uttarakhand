/**
 * Discovery Uttarakhand — Verification Routes
 * Public endpoints for on-chain integrity inspection and dynamic QR generation.
 */

import express from 'express';
import { 
  inspectListing, 
  inspectVehicle, 
  getListingQr 
} from '../controllers/verificationController.js';

const router = express.Router();

// Public verification inspections
router.get('/inspect/listing/:id', inspectListing);
router.get('/inspect/vehicle/:vehicleNumber', inspectVehicle);

// Dynamic on-demand QR code stream
router.get('/qr/listing/:id', getListingQr);

export default router;
