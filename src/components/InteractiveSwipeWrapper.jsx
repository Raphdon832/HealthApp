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
  const rafRef = useRef(null); // For animation frame optimization
  
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
    
    // Prevent default scrolling during active swipe
    e.preventDefault();
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const deltaX = currentX - swipeStartRef.current;
    const screenWidth = window.innerWidth;
    
    currentXRef.current = currentX;
    
    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    // Use requestAnimationFrame for smooth updates
    rafRef.current = requestAnimationFrame(() => {
      // Calculate progress (0 to 1) with easing
      const maxSwipe = screenWidth * 0.7; // 70% of screen width for full transition (more forgiving)
      let progress = Math.abs(deltaX) / maxSwipe;
      
      // Apply easing function for more natural feel
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : -1 + (4 - 2 * progress) * progress;
      
      progress = Math.min(easedProgress, 1);
      
      // Only update if swipe is in correct direction
      if (swipeDirection === 'left' && deltaX < 0) {
        setSwipeProgress(progress);
        
        // Haptic feedback at threshold with improved timing
        if (progress > 0.25 && swipeProgress <= 0.25) {
          if ('vibrate' in navigator) {
            navigator.vibrate(30); // Lighter feedback
          }
        }
      } else if (swipeDirection === 'right' && deltaX > 0) {
        setSwipeProgress(progress);
        
        // Haptic feedback at threshold with improved timing
        if (progress > 0.25 && swipeProgress <= 0.25) {
          if ('vibrate' in navigator) {
            navigator.vibrate(30); // Lighter feedback
          }
        }
      } else if (Math.abs(deltaX) > 15) { // Slightly more tolerant
        // Wrong direction, cancel swipe with animation
        handleTouchEnd();
      }
    });
  };

  const handleTouchEnd = () => {
    if (!isSwipingActive) return;
    
    const completionThreshold = 0.25; // 25% completion to trigger navigation (more responsive)
    const shouldComplete = swipeProgress > completionThreshold;
    
    if (shouldComplete && nextPageContent) {
      // Haptic feedback for successful navigation
      if ('vibrate' in navigator) {
        navigator.vibrate([50, 50, 100]); // Pattern for success
      }
      
      // Animate to completion before navigation
      setSwipeProgress(1);
      
      // Complete the navigation with smooth transition
      setTimeout(() => {
        const slideDirection = swipeDirection === 'left' ? 'left' : 'right';
        navigate(nextPageContent, { state: { slide: slideDirection } });
      }, 200); // Slightly longer for smoother feel
    } else {
      // Haptic feedback for cancelled navigation
      if ('vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      // Animate back to original position
      const snapBackAnimation = () => {
        let currentProgress = swipeProgress;
        const animate = () => {
          currentProgress *= 0.85; // Exponential decay
          setSwipeProgress(currentProgress);
          
          if (currentProgress > 0.01) {
            requestAnimationFrame(animate);
          } else {
            // Reset state after animation completes
            setSwipeProgress(0);
            setSwipeDirection(null);
            setNextPageContent(null);
            setIsSwipingActive(false);
            swipeStartRef.current = null;
          }
        };
        requestAnimationFrame(animate);
      };
      
      snapBackAnimation();
      return; // Don't reset state immediately, let animation handle it
    }
    
    // Reset state for successful navigation
    setTimeout(() => {
      setSwipeProgress(0);
      setSwipeDirection(null);
      setNextPageContent(null);
      setIsSwipingActive(false);
      swipeStartRef.current = null;
    }, 250);
  };

  // Add touch event listeners
  useEffect(() => {
    if (!isMobile) return;
    
    const element = document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false }); // Not passive for preventDefault
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
      
      // Clean up animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isMobile, isSwipingActive, swipeProgress, swipeDirection, currentIndex]);

  const getTransformStyle = () => {
    if (!isSwipingActive || !swipeDirection) return {};
    
    // Use more sophisticated easing for current page movement
    const easedProgress = swipeProgress < 0.5 
      ? 4 * swipeProgress * swipeProgress * swipeProgress 
      : 1 - Math.pow(-2 * swipeProgress + 2, 3) / 2;
    
    const translateX = swipeDirection === 'left' 
      ? -easedProgress * 100 
      : easedProgress * 100;
    
    // Add subtle scale and rotation for more dynamic feel
    const scale = 1 - (easedProgress * 0.05); // Slight scale down
    const rotateY = swipeDirection === 'left' 
      ? easedProgress * 3 
      : -easedProgress * 3; // Subtle 3D rotation
    
    return {
      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
      transformOrigin: swipeDirection === 'left' ? 'right center' : 'left center',
      transition: isSwipingActive ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      filter: `brightness(${1 - (easedProgress * 0.1)})` // Slight darkening
    };
  };

  const getNextPageTransform = () => {
    if (!isSwipingActive || !swipeDirection) return { display: 'none' };
    
    // Improved easing for incoming page
    const easedProgress = swipeProgress < 0.5 
      ? 4 * swipeProgress * swipeProgress * swipeProgress 
      : 1 - Math.pow(-2 * swipeProgress + 2, 3) / 2;
    
    const translateX = swipeDirection === 'left' 
      ? 100 - (easedProgress * 100)
      : -100 + (easedProgress * 100);
    
    // Add entrance effects
    const scale = 0.95 + (easedProgress * 0.05); // Scale up from 95% to 100%
    const rotateY = swipeDirection === 'left' 
      ? (1 - easedProgress) * -5 
      : (1 - easedProgress) * 5; // Subtle 3D rotation
    
    return {
      transform: `translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
      transformOrigin: swipeDirection === 'left' ? 'left center' : 'right center',
      transition: isSwipingActive ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'white',
      zIndex: isSwipingActive ? 10 : -1,
      boxShadow: swipeDirection === 'left' 
        ? `-10px 0 30px rgba(0,0,0,${0.1 * (1-easedProgress)})` 
        : `10px 0 30px rgba(0,0,0,${0.1 * (1-easedProgress)})`, // Dynamic shadow
      filter: `brightness(${0.9 + (easedProgress * 0.1)})` // Brighten as it comes in
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
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ 
              opacity: swipeProgress * 0.2, // Reduced opacity for subtlety
              zIndex: 5,
              transition: 'opacity 0.1s ease-out'
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
            {swipeProgress < 0.6 && (
              <div 
                className="absolute inset-0 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                style={{ 
                  opacity: Math.max(0, 1 - (swipeProgress * 2)), // Fade out more gradually
                  transition: 'opacity 0.15s ease-out'
                }}
              >
                <div className="text-center space-y-3">
                  {/* Enhanced progress circle */}
                  <div className="relative w-14 h-14 mx-auto">
                    <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 100 100">
                      {/* Background circle */}
                      <circle 
                        cx="50" cy="50" r="30" 
                        fill="none" stroke="#e5e7eb" strokeWidth="4"
                      />
                      {/* Progress circle with gradient */}
                      <circle 
                        cx="50" cy="50" r="30" 
                        fill="none" stroke="url(#progressGradient)" strokeWidth="4"
                        strokeDasharray={`${swipeProgress * 188.4} 188.4`}
                        className="transition-all duration-75 ease-out"
                        strokeLinecap="round"
                      />
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#0ea5e9" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-sky-600">
                        {Math.round(swipeProgress * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Enhanced instructions */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                      {swipeProgress < 0.25 ? 'Keep swiping...' : 'Almost there!'}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {swipeProgress < 0.25 
                        ? 'Continue to preview' 
                        : 'Release to navigate'
                      }
                    </div>
                  </div>

                  {/* Dynamic progress dots */}
                  <div className="flex items-center justify-center space-x-1">
                    {[0.1, 0.15, 0.2, 0.25].map((threshold, index) => (
                      <div 
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          swipeProgress > threshold 
                            ? 'bg-gradient-to-r from-sky-500 to-cyan-500 scale-110' 
                            : 'bg-gray-300 scale-100'
                        }`} 
                      />
                    ))}
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