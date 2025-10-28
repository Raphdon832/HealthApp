import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Settings keys
export const SETTINGS_KEYS = {
  SWIPE_NAVIGATION: 'swipe_navigation_enabled',
  THEME_MODE: 'theme_mode',
  LANGUAGE: 'language',
  FONT_SIZE: 'font_size',
  BIOMETRIC_LOGIN: 'biometric_login_enabled',
  AUTO_LOCK: 'auto_lock_timeout',
  LOCATION_PRECISION: 'location_precision',
  MESSAGE_READ_RECEIPTS: 'message_read_receipts',
  ORDER_NOTIFICATIONS: 'order_notifications_enabled',
  PRESCRIPTION_REMINDERS: 'prescription_reminders_enabled',
  DATA_SAVER_MODE: 'data_saver_mode_enabled',
  HIGH_CONTRAST: 'high_contrast_enabled',
  REDUCE_MOTION: 'reduce_motion_enabled',
  FLOATING_AI_BUTTON: 'floating_ai_button_enabled',
  AI_CHAT_IN_NAVBAR: 'ai_chat_in_navbar_enabled'
};

// Default settings
const DEFAULT_SETTINGS = {
  [SETTINGS_KEYS.SWIPE_NAVIGATION]: false, // Disabled by default
  [SETTINGS_KEYS.THEME_MODE]: 'light',
  [SETTINGS_KEYS.LANGUAGE]: 'en',
  [SETTINGS_KEYS.FONT_SIZE]: 'small',
  [SETTINGS_KEYS.BIOMETRIC_LOGIN]: false,
  [SETTINGS_KEYS.AUTO_LOCK]: '5min',
  [SETTINGS_KEYS.LOCATION_PRECISION]: 'precise',
  [SETTINGS_KEYS.MESSAGE_READ_RECEIPTS]: true,
  [SETTINGS_KEYS.ORDER_NOTIFICATIONS]: true,
  [SETTINGS_KEYS.PRESCRIPTION_REMINDERS]: true,
  [SETTINGS_KEYS.DATA_SAVER_MODE]: false,
  [SETTINGS_KEYS.HIGH_CONTRAST]: false,
  [SETTINGS_KEYS.REDUCE_MOTION]: false,
  [SETTINGS_KEYS.FLOATING_AI_BUTTON]: true, // Enabled by default
  [SETTINGS_KEYS.AI_CHAT_IN_NAVBAR]: true // Enabled by default (shows when floating is disabled)
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('app_settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    }
  }, [settings, isLoading]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getSetting = (key) => {
    return settings[key] ?? DEFAULT_SETTINGS[key];
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  const value = {
    settings,
    updateSetting,
    getSetting,
    resetSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;