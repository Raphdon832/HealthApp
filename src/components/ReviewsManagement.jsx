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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reviews Management</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Filter className="h-4 w-4" />
            Filters
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-blue-600">Total Reviews</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
            <div className="text-sm text-green-600">Responded</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
            <div className="text-sm text-yellow-600">Avg Rating</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.positiveReviews}</div>
            <div className="text-sm text-purple-600">Positive (4+ ⭐)</div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
      <div className="divide-y divide-gray-200">
        {filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-600">
              {reviews.length === 0 
                ? "You don't have any reviews yet. Encourage customers to leave reviews!"
                : "No reviews match your current filters."
              }
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
              {/* Review header */}
              <div className="flex items-start gap-4 mb-3">
                <ProductAvatar 
                  name={review.productName}
                  image={products[review.productId]?.image}
                  category={products[review.productId]?.category}
                  size={48}
                  className="flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{review.productName}</h4>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm text-gray-500">
                        {review.createdAt && new Date(review.createdAt.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">By: {review.name}</p>
                  <p className="text-gray-800">{review.comment}</p>
                  
                  {/* Pharmacy response */}
                  {review.pharmacyResponse && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Reply className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Your Response</span>
                        <span className="text-xs text-blue-600">
                          {review.responseDate && new Date(review.responseDate.seconds * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-blue-900">{review.pharmacyResponse}</p>
                    </div>
                  )}
                  
                  {/* Response form */}
                  {!review.pharmacyResponse && (
                    <div className="mt-4">
                      <button
                        onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: !prev[review.id] }))}
                        className="flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium"
                      >
                        <Reply className="h-4 w-4" />
                        {expandedReviews[review.id] ? 'Cancel Response' : 'Respond to Review'}
                      </button>
                      
                      {expandedReviews[review.id] && (
                        <div className="mt-3 space-y-3">
                          <textarea
                            value={responseText[review.id] || ''}
                            onChange={(e) => setResponseText(prev => ({ ...prev, [review.id]: e.target.value }))}
                            placeholder="Write your response to this review..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleResponse(review.id, review.productId, responseText[review.id] || '')}
                              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                              disabled={!responseText[review.id]?.trim()}
                            >
                              Submit Response
                            </button>
                            <button
                              onClick={() => setExpandedReviews(prev => ({ ...prev, [review.id]: false }))}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
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
            </div>
          ))
        )}
      </div>
    </div>
  );
}