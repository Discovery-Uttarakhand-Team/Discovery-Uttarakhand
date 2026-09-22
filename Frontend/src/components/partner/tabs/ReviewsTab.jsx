import React, { useState } from 'react';
import { 
  MessageSquare, 
  Star, 
  CornerDownRight, 
  Send, 
  Check, 
  Loader2,
  Calendar,
  User
} from 'lucide-react';

const ReviewsTab = ({ 
  reviews = [], 
  onReplyReview, 
  isReplying 
}) => {
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    await onReplyReview(reviewId, replyText.trim());
    setReplyingId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Customer Feedback & Reviews</h3>
            <p className="text-xs text-gray-500 mt-0.5">Direct tourist ratings and official business replies</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {reviews.length} Reviews
          </span>
        </div>

        {reviews.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="font-semibold text-gray-700">No customer reviews yet.</p>
            <p className="text-gray-400 mt-1">When tourists complete their trips and rate your vehicle or stay, their verified feedback will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((rev) => (
              <div key={rev._id} className="p-5 space-y-3">
                {/* Review Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-xs md:text-sm flex items-center gap-2">
                      <span>{rev.user?.name || 'Tourist Guest'}</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < (rev.rating || 5) ? 'currentColor' : 'none'}
                            className={i < (rev.rating || 5) ? 'text-amber-500' : 'text-gray-200'}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-forest-green bg-forest-green/5 px-2.5 py-1 rounded-lg border border-forest-green/10">
                    {rev.target?.title || rev.targetName || 'Listing'}
                  </span>
                </div>

                {/* Review Content */}
                <p className="text-xs text-gray-700 leading-relaxed">
                  {rev.comment || 'Great experience touring Uttarakhand with this service!'}
                </p>

                {/* Existing Reply if already answered */}
                {rev.reply?.text ? (
                  <div className="mt-2 p-3.5 rounded-xl bg-forest-green/5 border border-forest-green/15 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-forest-green text-[11px] mb-1">
                      <CornerDownRight size={12} />
                      <span>Partner Response ({new Date(rev.reply.repliedAt).toLocaleDateString('en-IN')}):</span>
                    </div>
                    <p className="text-gray-800 text-xs">{rev.reply.text}</p>
                  </div>
                ) : replyingId === rev._id ? (
                  /* Reply Input Form */
                  <div className="mt-2 p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                    <label className="block font-semibold text-gray-700">Write Business Response:</label>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Thank the tourist and address any notes or feedback professionally..."
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => { setReplyingId(null); setReplyText(''); }}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendReply(rev._id)}
                        disabled={isReplying}
                        className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white font-semibold"
                      >
                        {isReplying ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                        Post Reply
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Reply Trigger */
                  <div className="pt-1">
                    <button
                      onClick={() => setReplyingId(rev._id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-forest-green hover:underline"
                    >
                      <CornerDownRight size={13} />
                      Reply as Business Partner
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsTab;
