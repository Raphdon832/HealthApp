import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

// Import page components for preview rendering
import Home from '@/pages/Home';
import Orders from '@/pages/Orders';
import Messages from '@/pages/Messages';
import Cart from '@/pages/Cart';
import ProfileCustomer from '@/pages/ProfileCustomer';
import ProfilePharmacy from '@/pages/ProfilePharmacy';
import Dashboard from '@/pages/Dashboard';

export default function InteractiveSwipeWrapper() {
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [nextPageContent, setNextPageContent] = useState(null);
  const [isSwipingActive, setIsSwipingActive] = useState(false);
  const swipeStartRef = useRef(null);
  const currentXRef = useRef(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();

  // Page order for swipe navigation
  const customerPages = ['/', '/orders', '/messages', '/cart', '/profile'];
  const pharmacyPages = ['/dashboard', '/orders', '/messages', '/profile'];
  const pageOrder = profile?.role === 'pharmacy' ? pharmacyPages : customerPages;
  const currentIndex = pageOrder.indexOf(location.pathname);

  // Device detection: only enable on mobile/tablet
  const isMobile = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;

  // Function to render page component based on path
  const renderPageComponent = (path) => {
    switch (path) {
      case '/':
        return <Home />;
      case '/orders':
        return <Orders />;
      case '/messages':
        return <Messages />;
      case '/cart':
        return <Cart />;
      case '/profile':
        return profile?.role === 'pharmacy' ? <ProfilePharmacy /> : <ProfileCustomer />;
      case '/dashboard':
        return <Dashboard />;
      default:
        return null;
    }
  };

  const handleTouchStart = (e) => {
    if (!isMobile) return;
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const screenWidth = window.innerWidth;
    const edgeThreshold = 50;

    // Check if starting from edges
    const isFromLeftEdge = startX < edgeThreshold;
    const isFromRightEdge = startX > screenWidth - edgeThreshold;
    
    if (!isFromLeftEdge && !isFromRightEdge) return;

    swipeStartRef.current = startX;
    currentXRef.current = startX;
    
    // Determine potential direction and next page
    let direction = null;
    let nextIndex = -1;
    
    if (isFromRightEdge && currentIndex < pageOrder.length - 1) {
      direction = 'left';
      nextIndex = currentIndex + 1;
    } else if (isFromLeftEdge && currentIndex > 0) {
      direction = 'right';
      nextIndex = currentIndex - 1;
    }
    
    if (direction && nextIndex !== -1) {
      setSwipeDirection(direction);
      setNextPageContent(pageOrder[nextIndex]);
      setIsSwipingActive(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isSwipingActive || swipeStartRef.current === null) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const deltaX = currentX - swipeStartRef.current;
    const screenWidth = window.innerWidth;
    
    currentXRef.current = currentX;
    
    // Calculate progress (0 to 1)
    const maxSwipe = screenWidth * 0.6; // 60% of screen width for full transition
    let progress = Math.abs(deltaX) / maxSwipe;
    progress = Math.min(progress, 1);
    
    // Only update if swipe is in correct direction
    if (swipeDirection === 'left' && deltaX < 0) {
      setSwipeProgress(progress);
      
      // Haptic feedback at threshold
      if (progress > 0.3 && swipeProgress <= 0.3) {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    } else if (swipeDirection === 'right' && deltaX > 0) {
      setSwipeProgress(progress);
      
      // Haptic feedback at threshold
      if (progress > 0.3 && swipeProgress <= 0.3) {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    } else if (Math.abs(deltaX) > 10) {
      // Wrong direction, cancel swipe
      handleTouchEnd();
    }
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive) return;
    
    const completionThreshold = 0.3; // 30% completion to trigger navigation
    const shouldComplete = swipeProgress > completionThreshold;
    
    if (shouldComplete && nextPageContent) {
      // Haptic feedback for successful navigation
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      // Complete the navigation with a slight delay for visual feedback
      setTimeout(() => {
        const slideDirection = swipeDirection === 'left' ? 'left' : 'right';
        navigate(nextPageContent, { state: { slide: slideDirection } });
      }, 150);
    } else {
      // Haptic feedback for cancelled navigation
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
    }
    
    // Reset state
    setSwipeProgress(0);
    setSwipeDirection(null);
    setNextPageContent(null);
    setIsSwipingActive(false);
    swipeStartRef.current = null;
  };

  // Add touch event listeners
  useEffect(() => {
    if (!isMobile) return;
    
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobile, isSwipingActive, swipeProgress, swipeDirection, currentIndex]);

  const getTransformStyle = () => {
    if (!isSwipingActive || !swipeDirection) return {};
    
    const translateX = swipeDirection === 'left' 
      ? -swipeProgress * 100 
      : swipeProgress * 100;
    
    return {
      transform: `translateX(${translateX}%)`,
      transition: isSwipingActive ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };
  };

  const getNextPageTransform = () => {
    if (!isSwipingActive || !swipeDirection) return { display: 'none' };
    
    const translateX = swipeDirection === 'left' 
      ? 100 - (swipeProgress * 100)
      : -100 + (swipeProgress * 100);
    
    return {
      transform: `translateX(${translateX}%)`,
      transition: isSwipingActive ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      zIndex: isSwipingActive ? 10 : -1
    };
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Current page */}
      <div style={getTransformStyle()} className="relative">
        <Outlet />
        {/* Overlay when swiping */}
        {isSwipingActive && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-100"
            style={{ 
              opacity: swipeProgress * 0.3,
              zIndex: 5 
            }}
          />
        )}
      </div>
      
      {/* Next page preview */}
      {isSwipingActive && nextPageContent && (
        <div style={getNextPageTransform()}>
          <div className="h-full bg-white relative">
            {/* Render actual page component */}
            {renderPageComponent(nextPageContent)}
            
            {/* Overlay with progress indicator - only shows during initial swipe */}
            {swipeProgress < 0.8 && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center pointer-events-none">
                <div className="text-center space-y-4">
                  {/* Progress circle */}
                  <div className="relative w-16 h-16 mx-auto">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle 
                        cx="50" cy="50" r="35" 
                        fill="none" stroke="#e5e7eb" strokeWidth="6"
                      />
                      {/* Progress circle */}
                      <circle 
                        cx="50" cy="50" r="35" 
                        fill="none" stroke="#0ea5e9" strokeWidth="6"
                        strokeDasharray={`${swipeProgress * 219.8} 219.8`}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-sky-600">
                        {Math.round(swipeProgress * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      {swipeProgress < 0.3 ? 'Keep swiping...' : 'Release to navigate'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {swipeProgress < 0.3 
                        ? 'Continue to see the page' 
                        : 'Let go to switch'
                      }
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}