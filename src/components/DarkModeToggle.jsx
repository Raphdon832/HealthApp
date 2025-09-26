import React from 'react';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';

export default function DarkModeToggle() {
  const { getSetting, updateSetting } = useSettings();
  const currentTheme = getSetting(SETTINGS_KEYS.THEME_MODE);

  const toggleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    updateSetting(SETTINGS_KEYS.THEME_MODE, nextTheme);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-16 right-4 z-50 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors"
      style={{ fontSize: '12px' }}
    >
      Theme: {currentTheme}
    </button>
  );
}