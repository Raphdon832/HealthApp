import React from 'react';
import { Star, MessageCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/language';

const RecentReviewsPreview = ({ reviews = [], onViewAllReviews }) => {
  const { t } = useTranslation();
  if (!reviews.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="text-sky-500" size={20} />
            {t('recent_reviews', 'Recent Reviews')}
          </h3>
        </div>
        <div className="text-center py-8">
          <MessageCircle size={32} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('no_recent_reviews', 'No recent reviews')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {t('new_reviews_appear_here', 'New customer reviews will appear here')}
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
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="text-sky-500" size={20} />
          {t('recent_reviews', 'Recent Reviews')}
          {reviews.length > 0 && (
            <span className="bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-300 text-xs px-2 py-1 rounded-full font-medium">
              {reviews.length}
            </span>
          )}
        </h3>
        <button
          onClick={onViewAllReviews}
          className="text-sky-500 hover:text-sky-600 dark:text-sky-400 dark:hover:text-sky-300 text-sm font-medium flex items-center gap-1"
        >
          {t('view_all', 'View All')}
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {reviews.slice(0, 3).map((review) => (
          <div
            key={review.id}
            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={onViewAllReviews}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {review.productName}
                </h4>
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {t('by_customer', 'by {customerName}', { customerName: review.customerName })}
              </p>
              
              <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                {review.comment}
              </p>
              
              {!review.pharmacyResponse && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                    <MessageCircle size={12} className="mr-1" />
                    {t('needs_response', 'Needs Response')}
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
          className="w-full mt-4 py-2 text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium transition-colors"
        >
          {t('view_more_reviews', 'View {count} more review{plural}', { count: reviews.length - 3, plural: (reviews.length - 3) > 1 ? 's' : '' })}
        </button>
      )}
    </div>
  );
};

export default RecentReviewsPreview;