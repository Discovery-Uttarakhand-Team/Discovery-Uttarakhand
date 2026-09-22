import User from '../models/User.js';
import Favorite from '../models/Favorite.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import SavedTrip from '../models/SavedTrip.js';
import Trip from '../models/Trip.js';
import Destination from '../models/Destination.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Activity from '../models/Activity.js';
import Stay from '../models/Stay.js';
import Rental from '../models/Rental.js';
import Guide from '../models/Guide.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.location = req.body.location !== undefined ? req.body.location : user.location;
    if (req.body.profileImage) {
      user.profileImage = typeof req.body.profileImage === 'string' 
        ? { url: req.body.profileImage } 
        : req.body.profileImage;
    }
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();
    res.json({
      success: true,
      data: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
        location: updatedUser.location
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Get user bookings
// @route   GET /api/users/bookings
// @access  Private
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate('stay')
      .populate('rental')
      .populate('guide');
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create booking
// @route   POST /api/users/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { 
      type, 
      bookingType, 
      stay, 
      rental, 
      guide, 
      item, 
      vehicleName, 
      startDate, 
      endDate, 
      guests, 
      notes, 
      totalAmount 
    } = req.body;
    
    const resolvedType = type || bookingType || 'stay';
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    const days = Math.max(1, Math.ceil(Math.abs(eDate - sDate) / (1000 * 60 * 60 * 24)));

    let stayId = stay;
    let rentalId = rental;
    let guideId = guide;

    if (item) {
      if (resolvedType === 'stay') stayId = item;
      if (resolvedType === 'rental') rentalId = item;
      if (resolvedType === 'guide') guideId = item;
    }

    let calculatedAmount = totalAmount || null;

    if (!calculatedAmount && stayId) {
      const stayDoc = await Stay.findById(stayId);
      if (stayDoc?.price?.amount) {
        calculatedAmount = stayDoc.price.amount * days;
      }
    }

    const booking = await Booking.create({
      user: req.user.id,
      type: resolvedType,
      stay: stayId,
      rental: rentalId,
      guide: guideId,
      startDate: sDate,
      endDate: eDate,
      guests: guests || 1,
      amount: calculatedAmount,
      notes: notes || '',
      status: 'pending'
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user reviews
// @route   GET /api/users/reviews
// @access  Private
export const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user trips
// @route   GET /api/users/trips
// @access  Private
export const getUserTrips = async (req, res) => {
  try {
    const savedTrips = await SavedTrip.find({ user: req.user.id })
      .populate('destinations')
      .populate('activities')
      .populate('stays');
    const legacyTrips = await Trip.find({ user: req.user.id }).populate('destinations');
    res.json({ success: true, data: [...savedTrips, ...legacyTrips] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};