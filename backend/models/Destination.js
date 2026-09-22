import mongoose from 'mongoose';
import { imageSchema, pointSchema, provenanceFields } from './sharedSchemas.js';

const destinationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  shortDescription: { type: String },
  
  // Backwards compatibility fields (keep them additive)
  locationString: { type: String }, // Old location was a string, renaming it so new location can be GeoJSON. Wait, existing code might use `location` as string. I will rename the new one `locationPoint`? No, the prompt says: destinations: { location: "2dsphere" } (sparse). So `location` must be GeoJSON. The old `location: String` might break if the frontend expects a string.
  
  // The Prompt specifies:
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

  // Backward compatibility fields (additive)
  category: { type: String },
  images: [{ type: mongoose.Schema.Types.Mixed }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  startingPrice: { type: Number },
  totalReviews: { type: Number, default: 0 },
  bestTime: { type: String },
  thingsToDo: [{ type: String }],
  attractions: [{ type: String }],
  culture: [{ type: String }],
  activities: [{ type: String }],
  latitude: { type: Number },
  longitude: { type: Number },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  ...provenanceFields
}, { timestamps: true });

destinationSchema.index({ district: 1 });
destinationSchema.index({ location: '2dsphere' }, { sparse: true });
destinationSchema.index({ name: 'text', description: 'text', highlights: 'text' });

const Destination = mongoose.model('Destination', destinationSchema);
export default Destination;
