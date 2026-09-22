import SavedTrip from '../models/SavedTrip.js';

export const getTrips = async (req, res) => {
  try {
    const trips = await SavedTrip.find({ user: req.user._id })
      .populate('destinations')
      .populate('activities')
      .populate('stays');
    res.status(200).json({ success: true, count: trips.length, data: trips });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await SavedTrip.findById(req.params.id)
      .populate('destinations')
      .populate('activities')
      .populate('stays');
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    // Verify user ownership
    if (trip.user && !trip.user.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this trip' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTrip = async (req, res) => {
  try {
    const trip = await SavedTrip.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json({ success: true, data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    const trip = await SavedTrip.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const trip = await SavedTrip.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found or unauthorized' });
    }
    res.status(200).json({ success: true, message: 'Trip deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
