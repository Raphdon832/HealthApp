import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

export function useReviewNotifications() {
  const [newReviews, setNewReviews] = useState([]);
  const [unreadReviewsCount, setUnreadReviewsCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    // Get pharmacy's products and listen for new reviews
    const productsQuery = query(
      collection(db, 'products'),
      where('pharmacyId', '==', user.uid)
    );

    const unsubscribeProducts = onSnapshot(productsQuery, (productsSnap) => {
      const allReviewUnsubscribers = [];
      setNewReviews([]); // Reset reviews when products change
      setUnreadReviewsCount(0);
      
      productsSnap.docs.forEach((productDoc) => {
        const productData = { id: productDoc.id, ...productDoc.data() };
        
        // Listen to recent reviews for this product (last 7 days for better UX)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const reviewsQuery = query(
          collection(db, 'products', productDoc.id, 'reviews'),
          where('createdAt', '>=', weekAgo),
          orderBy('createdAt', 'desc'),
          limit(20) // Increased limit for better coverage
        );
        
        const unsubscribeReviews = onSnapshot(reviewsQuery, (reviewsSnap) => {
          const productReviews = reviewsSnap.docs.map(doc => ({
            id: doc.id,
            productId: productDoc.id,
            productName: productData.name,
            productImage: productData.image,
            ...doc.data(),
            // Convert Firestore timestamp to JS Date for sorting
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          
          // Filter out reviews that already have pharmacy responses
          const unrespondedReviews = productReviews.filter(review => !review.pharmacyResponse);
          
          // Update state with all unresponded reviews from this product
          setNewReviews(prevReviews => {
            // Remove old reviews from this product and add new ones
            const otherProductReviews = prevReviews.filter(r => r.productId !== productDoc.id);
            const updatedReviews = [...otherProductReviews, ...unrespondedReviews]
              .sort((a, b) => b.createdAt - a.createdAt) // Sort by newest first
              .slice(0, 50); // Limit total reviews to prevent memory issues
            
            setUnreadReviewsCount(updatedReviews.length);
            return updatedReviews;
          });
        });
        
        allReviewUnsubscribers.push(unsubscribeReviews);
      });

      // Return cleanup function for all review listeners
      return () => {
        allReviewUnsubscribers.forEach(unsub => unsub());
      };
    });

    return () => unsubscribeProducts();
  }, [user?.uid]);

  const markReviewsAsRead = () => {
    setNewReviews([]);
    setUnreadReviewsCount(0);
  };

  const markReviewAsResponded = (reviewId) => {
    setNewReviews(prev => {
      const updated = prev.filter(review => review.id !== reviewId);
      setUnreadReviewsCount(updated.length);
      return updated;
    });
  };

  return {
    newReviews,
    unreadReviewsCount,
    markReviewsAsRead,
    markReviewAsResponded
  };
}