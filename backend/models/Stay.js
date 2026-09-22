import mongoose from 'mongoose';
import { imageSchema, pointSchema, provenanceFields } from './sharedSchemas.js';

const staySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  shortDescription: { type: String },
  city: { type: String },
  district: { type: String },
  address: { type: String },
  location: { type: pointSchema, default: null }, // GeoJSON
  locationSource: { type: String },
  category: { 
    type: String, 
    enum: ['Government Tourist Rest House', 'Government Eco Camp', 'Heritage Luxury Hotel', 'Luxury Destination Spa Resort'] 
  },
  phone: { type: String, default: null },
  email: { type: String, default: null },
  website: { type: String, default: null },
  facilities: [{ type: String }],
  roomTypes: [{ type: String }],
  price: { 
    amount: { type: Number },
    currency: { type: String, default: "INR" }
  },
  priceNotes: { type: String },
  priceLastChecked: { type: Date },
  rating: { type: Number, default: null },
  reviewCount: { type: Number, default: null },
  images: [imageSchema],

  // Old fields for backward compatibility during transition
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  pricePerNight: { type: Number }, // we will compute this from price.amount in seed/API
  unit: { type: String, default: '/night' },
  image: { type: mongoose.Schema.Types.Mixed },
  amenities: [{ type: String }],
  rooms: { type: Number, default: 1 },
  maxGuests: { type: Number },
  available: { type: Boolean, default: true },
  isAvailable: { type: Boolean, default: true },
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },

  ...provenanceFields
}, { timestamps: true });

staySchema.index({ district: 1 });
staySchema.index({ location: '2dsphere' }, { sparse: true });

const Stay = mongoose.model('Stay', staySchema);
export default Stay;
