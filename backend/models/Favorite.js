import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemType: { 
    type: String, 
    enum: ["Destination", "Spiritual", "Culture", "Activity", "Stay", "Rental", "Guide"], 
    required: true 
  },
  item: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "itemType" },
  
  // Backward compatibility fields
  targetType: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

favoriteSchema.index({ user: 1, itemType: 1, item: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);
export default Favorite;
