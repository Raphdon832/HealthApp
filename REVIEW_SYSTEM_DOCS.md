# Review Management System

## Overview

The review management system allows pharmacies to efficiently view, manage, and respond to customer reviews on their products. The system includes real-time notifications, comprehensive filtering, and analytics.

## Components

### 1. ReviewsManagement.jsx
Main component for managing reviews with features:
- **Real-time data fetching** from Firestore
- **Filtering by product, rating, and response status**
- **Sorting** by date, rating, or helpfulness
- **Statistics display** with total reviews, average rating, and response rate
- **Response system** allowing pharmacies to reply to reviews
- **Product integration** with images and details

### 2. ReviewNotificationManager.jsx
Handles review notifications with:
- **Toast notifications** for new reviews
- **Auto-dismiss** after 5 seconds
- **Action buttons** (View & Respond, Dismiss)
- **Stacking system** for multiple notifications
- **Rating display** with star ratings

### 3. RecentReviewsPreview.jsx
Dashboard widget showing:
- **Recent review overview** in the main dashboard
- **Quick stats** and unresponded review indicators
- **Navigation** to full review management
- **Visual indicators** for reviews needing responses

### 4. useReviewNotifications.js
Custom hook providing:
- **Real-time review monitoring** for pharmacy products
- **Automatic filtering** of unresponded reviews
- **Count tracking** for notification badges
- **State management** for read/unread reviews

## Features

### Real-time Notifications
- Monitors all pharmacy products for new reviews
- Shows toast notifications for reviews needing responses
- Badge indicators on dashboard tabs
- Automatic updates when reviews are responded to

### Dashboard Integration
- **Tab system** with Overview and Reviews tabs
- **Notification badges** showing unread review count
- **Stats cards** displaying pending and recent review counts
- **Recent reviews widget** in overview tab

### Review Response System
- Direct response interface within review cards
- Character limit enforcement (500 characters)
- Real-time saving to Firestore
- Success feedback and error handling

### Filtering and Sorting
- **Product filter**: View reviews for specific products
- **Rating filter**: Filter by star rating (1-5 stars)
- **Response status**: All, Responded, or Unresponded reviews
- **Sorting options**: Newest first, Oldest first, Highest rated, Lowest rated

### Analytics
- **Total review count** for the pharmacy
- **Average rating** across all products
- **Response rate** percentage
- **Review distribution** by rating

## Database Structure

### Reviews Collection
```
products/{productId}/reviews/{reviewId}
{
  rating: number (1-5),
  comment: string,
  customerName: string,
  customerId: string,
  createdAt: timestamp,
  verified: boolean,
  helpful: number,
  pharmacyResponse?: {
    message: string,
    respondedAt: timestamp,
    respondedBy: string
  }
}
```

## Usage

### For Pharmacies
1. **Access reviews** via Dashboard → Reviews tab
2. **View notifications** in real-time as new reviews arrive
3. **Filter and search** reviews using the control panel
4. **Respond to reviews** using the built-in response system
5. **Monitor metrics** through the statistics display

### For Customers
1. **Add reviews** on product detail pages
2. **Rate products** from 1-5 stars
3. **Write comments** about their experience
4. **View pharmacy responses** to their reviews

## Technical Implementation

### Real-time Updates
- Uses Firestore `onSnapshot` for real-time data
- Efficient listener management to prevent memory leaks
- Automatic cleanup on component unmount

### Performance Optimization
- **Pagination** for large review sets
- **Debounced search** to reduce database queries
- **Memoization** of expensive computations
- **Lazy loading** of product images

### Error Handling
- Graceful fallbacks for network issues
- User-friendly error messages
- Retry mechanisms for failed operations
- Loading states during data fetching

### Security
- **Authentication required** for pharmacy access
- **Role-based access control** (pharmacy-only features)
- **Data validation** for review responses
- **Sanitized input** to prevent XSS attacks

## Future Enhancements

### Planned Features
- **Review analytics dashboard** with charts and trends
- **Automated response templates** for common scenarios
- **Review flagging system** for inappropriate content
- **Email notifications** for new reviews
- **Review export functionality** for reporting
- **Advanced filtering** by date ranges and keywords
- **Review moderation tools** for pharmacy owners

### Technical Improvements
- **Offline support** with local caching
- **Push notifications** for mobile app
- **Advanced search** with full-text indexing
- **Review sentiment analysis** using ML
- **Performance monitoring** and optimization
- **A/B testing** for UI improvements

## Testing

### Development Testing
- Use `testReviews.js` script to simulate reviews
- Test notification system with multiple reviews
- Verify real-time updates across multiple tabs
- Check responsive design on various screen sizes

### Production Monitoring
- Monitor review response times
- Track user engagement with notifications
- Analyze review system usage patterns
- Monitor error rates and performance metrics