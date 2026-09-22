import mongoose from 'mongoose';

const savedTripSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  destinations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Destination' }],
  activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
  stays: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Stay' }],
  startDate: { type: Date },
  endDate: { type: Date },
  notes: { type: String },
  startingLocation: {
    name: { type: String },
    coordinates: [{ type: Number }]
  },
  duration: { type: String },
  travelers: { type: String },
  transport: { type: String },
  tripType: [{ type: String }],
  interests: [{ type: String }],
  pace: { type: String },
  budget: { type: String },
  status: { type: String, default: 'Planning' },
  routeData: { type: mongoose.Schema.Types.Mixed },
  generatedItinerary: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

savedTripSchema.index({ user: 1 });

const SavedTrip = mongoose.model('SavedTrip', savedTripSchema);
export default SavedTrip;
