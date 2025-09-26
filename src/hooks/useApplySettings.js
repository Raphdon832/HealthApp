import { useEffect } from 'react';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';

// Hook to apply settings globally across the app
export const useApplySettings = () => {
  const { getSetting } = useSettings();

  useEffect(() => {
    // Apply High Contrast mode
    const highContrast = getSetting(SETTINGS_KEYS.HIGH_CONTRAST);
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [getSetting(SETTINGS_KEYS.HIGH_CONTRAST)]);

  useEffect(() => {
    // Apply Reduce Motion setting
    const reduceMotion = getSetting(SETTINGS_KEYS.REDUCE_MOTION);
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [getSetting(SETTINGS_KEYS.REDUCE_MOTION)]);

  useEffect(() => {
    // Apply Theme Mode
    const themeMode = getSetting(SETTINGS_KEYS.THEME_MODE);
    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (themeMode === 'system') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
      
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use explicit theme
      root.classList.add(themeMode);
    }
  }, [getSetting(SETTINGS_KEYS.THEME_MODE)]);

  useEffect(() => {
    // Apply Font Size
    const fontSize = getSetting(SETTINGS_KEYS.FONT_SIZE);
    const root = document.documentElement;
    
    // Remove existing font size classes
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
  }, [getSetting(SETTINGS_KEYS.FONT_SIZE)]);

  useEffect(() => {
    // Apply Language
    const language = getSetting(SETTINGS_KEYS.LANGUAGE);
    document.documentElement.lang = language;
  }, [getSetting(SETTINGS_KEYS.LANGUAGE)]);
};

export default useApplySettings;