/**
 * Discovery Uttarakhand — Public Marketplace Routes
 * Public endpoints returning only ACTIVE, verified partner inventory.
 */

import express from 'express';
import { getPublicListings, getPublicListingBySlug } from '../controllers/marketplaceController.js';

const router = express.Router();

router.get('/listings', getPublicListings);
router.get('/listings/:slug', getPublicListingBySlug);

export default router;
