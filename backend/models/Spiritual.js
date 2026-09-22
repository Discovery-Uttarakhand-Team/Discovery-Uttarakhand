import mongoose from 'mongoose';
import { imageSchema, pointSchema, provenanceFields } from './sharedSchemas.js';

const spiritualSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  shortDescription: { type: String },
  district: { type: String },
  region: { type: String },
  location: { type: pointSchema, default: null }, // GeoJSON
  locationSource: { type: String },
  bestTimeToVisit: { type: String, default: null },
  bestTimeSourceSentence: { type: String, default: null },
  idealDuration: { type: String, default: null },
  budgetLevel: { type: String, default: null },
  experiences: [{ type: String }],
  highlights: [{ type: String }],
  nearbyPlaces: [{ type: String }],
  coverImage: { type: imageSchema, default: null },
  gallery: [imageSchema],

  ...provenanceFields
}, { timestamps: true });

spiritualSchema.index({ district: 1 });
spiritualSchema.index({ location: '2dsphere' }, { sparse: true });
// No $text index specified for Spiritual

const Spiritual = mongoose.model('Spiritual', spiritualSchema);
export default Spiritual;
