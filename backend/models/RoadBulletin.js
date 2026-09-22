import mongoose from 'mongoose';

const roadBulletinSchema = new mongoose.Schema({
  corridor: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  highway: {
    type: String,
    trim: true,
    default: null
  },
  district: {
    type: String,
    trim: true,
    default: null
  },
  roadStatus: {
    type: String,
    enum: ['OPEN', 'RESTRICTED', 'CLOSED'],
    default: 'OPEN',
    required: true
  },
  restrictionType: {
    type: String,
    enum: [
      'NONE',
      'LANDSLIDE',
      'LANDSLIDE_SINGLE_LANE',
      'SNOW_BLOCKED',
      'MONSOON_HOLD',
      'NIGHT_CURFEW',
      'ROAD_WORK',
      'BRIDGE_REPAIR'
    ],
    default: 'NONE',
    required: true
  },
  severity: {
    type: String,
    enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'INFO',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  effectiveFrom: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  source: {
    type: String,
    default: 'Border Roads Organisation (BRO) / UKSDMA',
    required: true
  },
  sourceUrl: {
    type: String,
    default: 'https://usdma.uk.gov.in/'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

roadBulletinSchema.index({ corridor: 1, isActive: 1, expiresAt: 1 });

const RoadBulletin = mongoose.model('RoadBulletin', roadBulletinSchema);
export default RoadBulletin;
