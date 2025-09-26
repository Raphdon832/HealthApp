// src/pages/auth/AuthLayout.jsx
import React, { useState, useEffect } from 'react';
import PharmaseaLogo from '@/icons/PharmaseaLogo.png';


export default function AuthLayout({ children }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial dark mode state
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    // Check on component mount
    checkDarkMode();

    // Set up observer to watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

return (
<div className="min-h-screen bg-white dark:bg-gray-900">
<div className="max-w-md mx-auto px-6 pt-14 pb-10">
{/* Logo */}
<div className="flex flex-col items-center mb-10">
  <img 
    src={isDark ? '/PharmLogoDark.png' : PharmaseaLogo} 
    alt="Pharmasea" 
    className="w-40 h-15 object-contain transition-opacity duration-300" 
  />
  <div className="mt-3 text-zinc-600 dark:text-zinc-400 text-[13px]"></div>
</div>
{children}
</div>
</div>
);
}