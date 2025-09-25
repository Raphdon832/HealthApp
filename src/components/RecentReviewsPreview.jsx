import React from 'react';
import { Star, MessageCircle, ChevronRight } from 'lucide-react';

const RecentReviewsPreview = ({ reviews = [], onViewAllReviews }) => {
  if (!reviews.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-sky-500" size={20} />
            Recent Reviews
          </h3>
        </div>
        <div className="text-center py-8">
          <MessageCircle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No recent reviews</p>
          <p className="text-sm text-gray-400 mt-1">
            New customer reviews will appear here
          </p>
        </div>
      </div>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star 
        key={i} 
        size={12} 
        className={`${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="text-sky-500" size={20} />
          Recent Reviews
          {reviews.length > 0 && (
            <span className="bg-sky-100 text-sky-700 text-xs px-2 py-1 rounded-full font-medium">
              {reviews.length}
            </span>
          )}
        </h3>
        <button
          onClick={onViewAllReviews}
          className="text-sky-500 hover:text-sky-600 text-sm font-medium flex items-center gap-1"
        >
          View All
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {reviews.slice(0, 3).map((review) => (
          <div
            key={review.id}
            className="flex gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={onViewAllReviews}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-gray-900 text-sm truncate">
                  {review.productName}
                </h4>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 mb-2">
                by {review.customerName}
              </p>
              
              <p className="text-sm text-gray-700 line-clamp-2">
                {review.comment}
              </p>
              
              {!review.pharmacyResponse && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-700">
                    <MessageCircle size={12} className="mr-1" />
                    Needs Response
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button
          onClick={onViewAllReviews}
          className="w-full mt-4 py-2 text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
        >
          View {reviews.length - 3} more reviews
        </button>
      )}
    </div>
  );
};

export default RecentReviewsPreview;