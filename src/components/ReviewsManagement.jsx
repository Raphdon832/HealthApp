import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { Star, MessageCircle, Reply, ChevronDown, ChevronUp, Filter } from 'lucide-react';
import ProductAvatar from '@/components/ProductAvatar';

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [responseText, setResponseText] = useState({});
  const [expandedReviews, setExpandedReviews] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // First, get all products by this pharmacy
      const productsQuery = query(
        collection(db, 'products'),
        where('pharmacyId', '==', user.uid)
      );
      const productsSnap = await getDocs(productsQuery);
      const productsMap = {};
      const productsList = [];
      
      productsSnap.docs.forEach(doc => {
        const productData = { id: doc.id, ...doc.data() };
        productsMap[doc.id] = productData;
        productsList.push(productData);
      });
      
      setProducts(productsMap);
      
      // Fetch reviews for all products
      const allReviews = [];
      
      for (const product of productsList) {
        const reviewsQuery = query(
          collection(db, 'products', product.id, 'reviews'),
          orderBy('createdAt', 'desc')
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        
        reviewsSnap.docs.forEach(doc => {
          allReviews.push({
            id: doc.id,
            productId: product.id,
            productName: product.name,
            ...doc.data()
          });
        });
      }
      
      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (reviewId, productId, response) => {
    if (!response.trim()) return;
    
    try {
      const reviewRef = doc(db, 'products', productId, 'reviews', reviewId);
      await updateDoc(reviewRef, {
        pharmacyResponse: response,
        responseDate: serverTimestamp(),
        respondedBy: user.uid
      });
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, pharmacyResponse: response, responseDate: new Date() }
          : review
      ));
      
      // Clear response text
      setResponseText(prev => ({ ...prev, [reviewId]: '' }));
      
      alert('Response submitted successfully!');
    } catch (error) {
      console.error('Error submitting response:', error);
      alert('Failed to submit response. Please try again.');
    }
  };

  const getFilteredAndSortedReviews = () => {
    let filtered = reviews;

    // Filter by product
    if (selectedProduct !== 'all') {
      filtered = filtered.filter(review => review.productId === selectedProduct);
    }

    // Filter by rating
    if (filterBy !== 'all') {
      if (filterBy === 'positive') {
        filtered = filtered.filter(review => review.rating >= 4);
      } else if (filterBy === 'negative') {
        filtered = filtered.filter(review => review.rating <= 2);
      } else if (filterBy === 'responded') {
        filtered = filtered.filter(review => review.pharmacyResponse);
      } else if (filterBy === 'unresponded') {
        filtered = filtered.filter(review => !review.pharmacyResponse);
      }
    }

    // Sort reviews
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt?.seconds * 1000) - new Date(a.createdAt?.seconds * 1000);
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt?.seconds * 1000) - new Date(b.createdAt?.seconds * 1000);
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else if (sortBy === 'lowest') {
        return a.rating - b.rating;
      }
      return 0;
    });

    return filtered;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getReviewStats = () => {
    const total = reviews.length;
    const responded = reviews.filter(r => r.pharmacyResponse).length;
    const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    
    return { total, responded, avgRating, positiveReviews };
  };

  const stats = getReviewStats();
  const filteredReviews = getFilteredAndSortedReviews();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 overflow-hidden">
        <div className="text-center py-16">
          <div className="relative mx-auto w-12 h-12 mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 dark:border-gray-600"></div>
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 dark:border-sky-400 border-t-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading your reviews...</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 overflow-hidden">
      {/* Header with stats */}
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reviews Management</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Filter className="h-4 w-4" />
            Filters & Sort
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 dark:border-gray-600 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs sm:text-sm text-blue-600 font-medium">Total Reviews</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.responded}</div>
            <div className="text-xs sm:text-sm text-green-600 font-medium">Responded</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
            <div className="text-xs sm:text-sm text-yellow-600 font-medium">Avg Rating</div>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.positiveReviews}</div>
            <div className="text-xs sm:text-sm text-purple-600 font-medium">Positive (4+ ⭐)</div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">All Products</option>
                {Object.values(products).map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter By</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              >
                <option value="all">All Reviews</option>
                <option value="positive">Positive (4+ stars)</option>
                <option value="negative">Negative (1-2 stars)</option>
                <option value="responded">Responded</option>
                <option value="unresponded">Needs Response</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Reviews list */}
      <div className="divide-y divide-gray-100">
        {filteredReviews.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              {reviews.length === 0 
                ? "You don't have any reviews yet. Encourage customers to leave reviews by providing excellent service and follow-up communication!"
                : "No reviews match your current filters. Try adjusting your search criteria."
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review, index) => (
            <div 
              key={review.id} 
              className="p-4 sm:p-6 hover:bg-gray-50 transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Review Card */}
              <div className="space-y-3">
                {/* Date at the top */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {review.createdAt && new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {!review.pharmacyResponse && (
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full font-medium">
                      Needs Response
                    </span>
                  )}
                </div>

                {/* Product info with avatar and name */}
                <div className="flex items-center gap-3">
                  <ProductAvatar 
                    name={review.productName}
                    image={products[review.productId]?.image}
                    category={products[review.productId]?.category}
                    size={40}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1" title={review.productName}>
                      {review.productName}
                    </h4>
                    <p className="text-xs text-gray-500 truncate">
                      {products[review.productId]?.category || 'Medicine'}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-600">({review.rating}/5)</span>
                </div>

                {/* Reviewer name */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Reviewed by:</span>
                  <span className="font-medium text-gray-800 text-sm">{review.customerName || review.name}</span>
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
                      Verified
                    </span>
                  )}
                </div>

                {/* Review comment */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{review.comment}</p>
                </div>

                {/* Helpfulness indicator */}
                {review.helpful > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>👍</span>
                    <span>{review.helpful} people found this helpful</span>
                  </div>
                )}
                
                {/* Pharmacy response */}
                {review.pharmacyResponse && (
                  <div className="ml-0 sm:ml-4 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/20 dark:to-sky-900/20 rounded-lg p-3 sm:p-4 border-l-4 border-blue-400 dark:border-blue-500 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Reply className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">Your Response</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400 ml-auto">
                        {review.pharmacyResponse.respondedAt && new Date(review.pharmacyResponse.respondedAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-blue-900 dark:text-blue-200 text-sm leading-relaxed">{review.pharmacyResponse.message || review.pharmacyResponse}</p>
                  </div>
                )}
                
                {/* Response form */}
                {!review.pharmacyResponse && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <button
                      onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                      className="flex items-center gap-2 text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 text-sm font-medium transition-colors"
                    >
                      <Reply className="h-4 w-4" />
                      {expandedReviews[review.id] ? 'Cancel Response' : 'Respond to Review'}
                    </button>
                    
                    {expandedReviews[review.id] && (
                      <div className="mt-3 space-y-3">
                        <div className="relative">
                          <textarea
                            value={responseText[review.id] || ''}
                            onChange={(e) => setResponseText(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Write a thoughtful response to this review..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:focus:ring-sky-400 dark:focus:border-sky-400 resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                            rows={4}
                            maxLength={500}
                          />
                          <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500">
                            {(responseText[review.id] || '').length}/500
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleResponse(review.id, review.productId, responseText[review.id] || '')}
                            className="flex-1 sm:flex-none px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            disabled={!responseText[review.id]?.trim()}
                          >
                            Submit Response
                          </button>
                          <button
                            onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: false }))}
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}