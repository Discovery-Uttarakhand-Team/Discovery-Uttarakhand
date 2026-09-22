import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const ReviewSection = ({ targetId, targetType }) => {
  const { isAuthenticated, requireAuth, currentUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({ review: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get(`/reviews/${targetType}/${targetId}`);
        if (res.data.success) {
          setReviews(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoading(false);
      }
    };
    if (targetId) fetchReviews();
  }, [targetId]);

  const handleRatingClick = (selected) => {
    setRating(selected);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    requireAuth(async () => {
      if (rating === 0) {
        setError('Please select a rating.');
        return;
      }
      if (!formData.review.trim()) {
        setError('Please write a brief review.');
        return;
      }

      try {
        const res = await api.post('/reviews', {
          targetId,
          targetType,
          rating,
          comment: formData.review
        });
        if (res.data.success) {
          setIsSubmitted(true);
          setReviews([...reviews, { ...res.data.data, user: { name: currentUser?.name } }]);
        }
      } catch (err) {
        setError('Failed to submit review. Try again.');
      }
    });
  };

  if (isSubmitted) {
    return (
      <section className="px-4 md:px-8 max-w-[800px] mx-auto w-full mb-16">
        <div className="bg-white rounded-[2rem] p-10 md:p-16 text-center card-shadow border border-border-light/50 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-beige rounded-full flex items-center justify-center mb-6">
            <Star size={40} className="text-earth-brown fill-earth-brown" />
          </div>
          <h2 className="text-3xl font-bold text-text-dark mb-4">
            Thank you for sharing your experience!
          </h2>
          <p className="text-lg text-muted-text max-w-md mx-auto">
            Your feedback helps us and other travellers discover the true beauty of Uttarakhand.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 md:px-8 max-w-[800px] mx-auto w-full mb-16">
      <div className="bg-white rounded-[2rem] p-8 md:p-12 card-shadow border border-border-light/50">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-3">
            How was your Uttarakhand experience?
          </h2>
          <p className="text-muted-text text-lg">
            Your experience can help other travellers discover the beauty of Uttarakhand.
          </p>
        </div>

        <form onSubmit={handleSubmitReview} className="flex flex-col gap-6 max-w-xl mx-auto mb-16">
          
          <div className="flex flex-col items-center justify-center mb-4">
            <span className="text-sm font-bold text-muted-text uppercase tracking-wider mb-4">Rate your experience</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    size={40} 
                    strokeWidth={1.5}
                    className={`transition-colors duration-200 ${
                      (hoverRating || rating) >= star 
                        ? 'text-earth-brown fill-earth-brown' 
                        : 'text-border-light'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-center text-red-500 font-medium text-sm">{error}</div>}

          <div className="flex flex-col gap-2">
            <label htmlFor="review" className="text-sm font-bold text-text-dark pl-1">Tell us about your experience</label>
            <textarea 
              id="review"
              name="review"
              rows={4}
              placeholder="The mountains were absolutely stunning..."
              value={formData.review}
              onChange={handleInputChange}
              className="p-4 rounded-xl border border-border-light focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green transition-all bg-warm-white resize-none"
            />
          </div>

          <button 
            type="submit" 
            className="mt-4 w-full bg-forest-green text-white font-bold text-sm tracking-wide py-4 rounded-full hover:bg-dark-green transition-colors shadow-md hover:shadow-lg"
          >
            SUBMIT REVIEW
          </button>
        </form>

        <div className="mt-12 border-t border-border-light pt-12">
          <h3 className="text-2xl font-bold text-text-dark mb-8">What Others Say</h3>
          {loading ? (
            <p className="text-muted-text">Loading reviews...</p>
          ) : reviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((rev) => (
                <div key={rev._id} className="p-6 bg-warm-white rounded-2xl border border-beige shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-text-dark">{rev.user?.name || 'Traveler'}</span>
                    <span className="text-earth-brown flex items-center text-sm ml-auto font-bold"><Star size={16} className="fill-earth-brown mr-1" />{rev.rating}/5</span>
                  </div>
                  <p className="text-muted-text italic">"{rev.comment}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-blue-800 font-medium">No user reviews yet. Be the first to share your experience!</p>
              <p className="text-sm text-blue-600 mt-1">
                Note: Overall ratings shown for this property are aggregated from external platforms or estimated based on service quality standards until direct user reviews are collected.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewSection;
