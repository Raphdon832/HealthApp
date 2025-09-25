// Test script to simulate adding reviews for testing notification system
// This is for development/testing purposes only

import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const addTestReview = async (productId, productName, pharmacyId) => {
  try {
    const testReview = {
      rating: Math.floor(Math.random() * 5) + 1, // Random rating 1-5
      comment: [
        "Great product, fast delivery!",
        "Excellent quality and packaging.",
        "Very satisfied with the service.",
        "Good value for money.",
        "Quick response and helpful staff.",
        "Product arrived in perfect condition.",
        "Highly recommend this pharmacy!",
        "Professional and reliable service."
      ][Math.floor(Math.random() * 8)],
      customerName: [
        "John Doe",
        "Sarah Johnson",
        "Mike Wilson", 
        "Lisa Brown",
        "David Smith",
        "Emma Davis"
      ][Math.floor(Math.random() * 6)],
      customerId: "test_customer_" + Math.random().toString(36).substr(2, 9),
      createdAt: serverTimestamp(),
      verified: true,
      helpful: Math.floor(Math.random() * 10)
    };

    const reviewRef = await addDoc(
      collection(db, 'products', productId, 'reviews'),
      testReview
    );

    console.log('Test review added:', reviewRef.id);
    return reviewRef.id;
  } catch (error) {
    console.error('Error adding test review:', error);
    throw error;
  }
};

// Test function to add multiple reviews quickly
export const addMultipleTestReviews = async (productId, productName, pharmacyId, count = 3) => {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(addTestReview(productId, productName, pharmacyId));
  }
  
  try {
    const results = await Promise.all(promises);
    console.log(`Added ${results.length} test reviews`);
    return results;
  } catch (error) {
    console.error('Error adding multiple test reviews:', error);
    throw error;
  }
};

// To use in console for testing:
// import { addTestReview } from './scripts/testReviews';
// addTestReview('your-product-id', 'Product Name', 'pharmacy-id');