import mongoose from 'mongoose';
import { provenanceFields } from './sharedSchemas.js';

const guideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  bio: { type: String },
  location: { type: String }, // Plain string, not GeoJSON
  districts: [{ type: String }],
  languages: [{ type: String }],
  specialties: [{ type: String }],
  experience: { type: String },
  phone: { type: String },
  profileUrl: { type: String },
  profileImage: { type: mongoose.Schema.Types.Mixed, default: null }, // Match frontend or imageSchema if uploaded
  rating: { type: Number, default: null },
  reviewCount: { type: Number, default: null },
  verifiedByGovt: { type: Boolean, default: true },
  verificationStatus: { type: String, default: 'verified' },
  
  // Backward compatibility fields
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  speciality: { type: String },
  category: { type: String },
  pricePerDay: { type: Number },
  image: { type: mongoose.Schema.Types.Mixed },
  totalReviews: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  categories: [{ type: String }],

  ...provenanceFields
}, { timestamps: true });

guideSchema.index({ districts: 1 });
guideSchema.index({ languages: 1 });
guideSchema.index({ specialties: 1 });
guideSchema.index({ verificationStatus: 1 });

const Guide = mongoose.model('Guide', guideSchema);
export default Guide;
