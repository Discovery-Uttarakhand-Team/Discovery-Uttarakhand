import mongoose from 'mongoose';

export const imageSchema = new mongoose.Schema({
  url:        { type: String, required: true },
  publicId:   { type: String, default: null },
  source:     { type: String, default: "Wikimedia Commons" },
  sourcePage: { type: String },
  license:    { type: String },
  attribution:{ type: String },
  alt:        { type: String },
}, { _id: false });

export const pointSchema = new mongoose.Schema({
  type:        { type: String, enum: ["Point"], default: "Point" },
  coordinates: {
    type: [Number],
    validate: {
      validator: function(coords) {
        if (!coords || coords.length === 0) return true;
        if (!Array.isArray(coords) || coords.length !== 2) return false;
        const [lng, lat] = coords;
        return typeof lng === 'number' && typeof lat === 'number' &&
               !isNaN(lng) && !isNaN(lat) &&
               lng >= -180 && lng <= 180 &&
               lat >= -90 && lat <= 90;
      },
      message: 'GeoJSON coordinates must be [longitude, latitude] with longitude (-180 to 180) and latitude (-90 to 90).'
    }
  }
}, { _id: false });

export const provenanceFields = {
  sourceName: { type: String },
  sourceUrl: { type: String },
  sourcePageUrl: { type: String },
  contentLicense: { type: String },
  lastVerified: { type: Date }
};
