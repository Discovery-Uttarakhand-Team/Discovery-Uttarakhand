import User from '../models/User.js';
import Destination from '../models/Destination.js';
import Rental from '../models/Rental.js';
import Stay from '../models/Stay.js';
import Guide from '../models/Guide.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Activity from '../models/Activity.js';

export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDestinations,
      totalRentals,
      totalStays,
      totalGuides,
      totalSpiritual,
      totalCulture,
      totalActivities,
      bookingsByStatus,
      reviewsByStatus
    ] = await Promise.all([
      User.countDocuments({}),
      Destination.countDocuments({}),
      Rental.countDocuments({}),
      Stay.countDocuments({}),
      Guide.countDocuments({}),
      Spiritual.countDocuments({}),
      Culture.countDocuments({}),
      Activity.countDocuments({}),
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    ]);

    res.status(200).json({
      success: true,
      data: {
        users: totalUsers,
        destinations: totalDestinations,
        rentals: totalRentals,
        stays: totalStays,
        guides: totalGuides,
        spiritual: totalSpiritual,
        culture: totalCulture,
        activities: totalActivities,
        bookingsByStatus: bookingsByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
        reviewsByStatus: reviewsByStatus.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {}),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('user', 'name email').populate('item');
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    booking.status = req.body.status || booking.status;
    booking.paymentStatus = req.body.paymentStatus || booking.paymentStatus;
    
    const updatedBooking = await booking.save();
    res.json({ success: true, data: updatedBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
