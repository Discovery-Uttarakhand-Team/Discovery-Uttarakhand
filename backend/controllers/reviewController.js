import Review from '../models/Review.js';

export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ 
      targetType: req.params.targetType,
      target: req.params.targetId,
      status: 'approved'
    }).populate('user', 'name profileImage');
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createReview = async (req, res) => {
  try {
    const { targetId, targetType, rating, comment } = req.body;
    
    if (!targetId || !targetType || !rating || !comment) {
      return res.status(400).json({ success: false, message: 'Please provide all fields' });
    }

    const review = await Review.create({
      user: req.user.id,
      target: targetId,
      targetType, // capitalized e.g. 'Destination', 'Stay' based on enum
      rating,
      comment,
      status: 'pending' // always pending initially
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getOwnReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.id })
      .populate('target', 'name slug');
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Admin methods
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const reviews = await Review.find({}).populate('user', 'name').populate('target', 'name slug');
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateReviewStatusAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.status(200).json({ success: true, message: 'Review deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
