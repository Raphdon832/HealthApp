import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Star } from 'lucide-react';

const ReviewNotificationToast = ({ review, onDismiss, onViewReview }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setIsVisible(true);
    
    // Auto dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleViewReview = () => {
    onViewReview();
    handleDismiss();
  };

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
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="bg-white border-l-4 border-sky-500 dark:border-gray-600 dark:border-gray-600 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageCircle size={16} className="text-sky-500" />
            <span className="text-sm font-semibold text-gray-900">New Review</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900 truncate">
            {review.productName}
          </p>
          <div className="flex items-center gap-1 mt-1">
            {renderStars(review.rating)}
            <span className="text-xs text-gray-600 ml-1">
              by {review.customerName}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {review.comment}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={handleViewReview}
            className="px-3 py-1 bg-sky-500 text-white text-xs rounded hover:bg-sky-600 transition-colors"
          >
            View & Respond
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewNotificationManager = ({ newReviews, onDismissReview, onViewReview }) => {
  const [visibleToasts, setVisibleToasts] = useState([]);

  useEffect(() => {
    // Show only the most recent review that hasn't been shown yet
    if (newReviews.length > 0) {
      const latestReview = newReviews[0];
      const isAlreadyVisible = visibleToasts.some(toast => toast.id === latestReview.id);
      
      if (!isAlreadyVisible) {
        setVisibleToasts(prev => [latestReview, ...prev.slice(0, 2)]); // Show max 3 toasts
      }
    }
  }, [newReviews]);

  const handleDismissToast = (reviewId) => {
    setVisibleToasts(prev => prev.filter(toast => toast.id !== reviewId));
    onDismissReview(reviewId);
  };

  const handleViewReview = (reviewId) => {
    setVisibleToasts(prev => prev.filter(toast => toast.id !== reviewId));
    onViewReview(reviewId);
  };

  return (
    <>
      {visibleToasts.map((review, index) => (
        <div 
          key={review.id} 
          style={{ 
            transform: `translateY(${index * 80}px)`,
            zIndex: 50 - index 
          }}
          className="absolute"
        >
          <ReviewNotificationToast
            review={review}
            onDismiss={() => handleDismissToast(review.id)}
            onViewReview={() => handleViewReview(review.id)}
          />
        </div>
      ))}
    </>
  );
};

export default ReviewNotificationManager;