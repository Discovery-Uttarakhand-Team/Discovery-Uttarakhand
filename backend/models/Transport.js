import mongoose from 'mongoose';

const transportSchema = new mongoose.Schema({
  mode: {
    type: String,
    enum: ['Bus', 'Train', 'Taxi', 'Shared Jeep', 'Local Transfer', 'Trek on Foot'],
    required: true
  },
  routingType: {
    type: String,
    enum: ['road', 'rail', 'trek', 'local_transfer', 'unknown'],
    default: 'road',
    required: true
  },
  operator: {
    type: String,
    default: null
  },
  serviceName: {
    type: String,
    default: null
  },
  serviceNumber: {
    type: String,
    default: null
  },
  origin: {
    name: { type: String, required: true },
    district: { type: String, default: null },
    state: { type: String, default: 'Uttarakhand' },
    stationCode: { type: String, default: null }
  },
  destination: {
    name: { type: String, required: true },
    district: { type: String, default: null },
    state: { type: String, default: 'Uttarakhand' },
    stationCode: { type: String, default: null }
  },
  stops: [{ type: String }],
  departureTime: {
    type: String,
    default: null
  },
  arrivalTime: {
    type: String,
    default: null
  },
  duration: {
    type: String,
    default: null
  },
  price: {
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    fareType: { type: String, default: null }
  },
  availabilityStatus: {
    type: String,
    default: null
  },
  availabilitySource: {
    type: String,
    default: null
  },
  lastChecked: {
    type: Date,
    default: null
  },
  isLive: {
    type: Boolean,
    default: false
  },
  bookingUrl: {
    type: String,
    default: null
  },
  bookingType: {
    type: String,
    enum: ['official', 'partner', 'informational', null],
    default: null
  },
  routeCategory: {
    type: String,
    enum: ['Interstate Gateway', 'Himalayan Trunk Route', 'High Altitude Border Transit', 'Local Trailhead Shuttle'],
    default: 'Himalayan Trunk Route'
  },
  source: {
    type: String,
    required: true
  },
  sourceUrl: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

transportSchema.index({ 'origin.name': 1, 'destination.name': 1 });
transportSchema.index({ mode: 1 });
transportSchema.index({ routingType: 1 });

const Transport = mongoose.model('Transport', transportSchema);
export default Transport;
