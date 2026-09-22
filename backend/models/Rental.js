import mongoose from 'mongoose';
import { imageSchema, pointSchema, provenanceFields } from './sharedSchemas.js';

const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["Scooter", "Motorcycle", "Hatchback", "Sedan", "SUV", "MPV"] },
  typeDetail: { type: String },
  pricePerDay: { type: Number, default: null },
  priceNotes: { type: String },
  image: { type: imageSchema }
}, { _id: false });

const rentalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  city: { type: String },
  district: { type: String },
  address: { type: String },
  location: { type: pointSchema, default: null }, // GeoJSON
  locationNotes: { type: String, default: null },
  category: { type: String, enum: ['Bike & Scooter Rental', 'Self-Drive Car Rental'] },
  phone: { type: String },
  website: { type: String },
  vehicles: [vehicleSchema],
  
  priceNotes: { type: String },
  priceLastChecked: { type: Date },
  currency: { type: String, default: "INR" },
  rating: { type: Number, default: null },
  reviewCount: { type: Number, default: null },
  ratingSource: { type: String },
  images: [imageSchema],
  
  // Backward compatibility fields
  type: { type: String },
  ratingSourceNotes: { type: String },
  
  ...provenanceFields
}, { timestamps: true });

rentalSchema.index({ district: 1 });
rentalSchema.index({ location: '2dsphere' }, { sparse: true });

const Rental = mongoose.model('Rental', rentalSchema);
export default Rental;
