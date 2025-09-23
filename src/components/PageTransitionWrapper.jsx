import React, { useEffect, useState } from 'react';

export default function PageTransitionWrapper({ children, location }) {
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fade-in');

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fade-out');
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === 'fade-out') {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('fade-in');
      }, 150); // Half of the transition duration
      return () => clearTimeout(timer);
    }
  }, [transitionStage, location]);

  return (
    <div 
      className={`page-transition ${transitionStage} min-h-screen`}
      style={{
        transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: transitionStage === 'fade-out' ? 0 : 1
      }}
    >
      {React.cloneElement(children, { key: displayLocation?.pathname })}
    </div>
  );
}

// Hook for programmatic page transitions with loading states
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = (callback) => {
    setIsTransitioning(true);
    
    // Fade out
    setTimeout(() => {
      callback();
      // Fade in after navigation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
    }, 150);
  };

  return { isTransitioning, startTransition };
}
