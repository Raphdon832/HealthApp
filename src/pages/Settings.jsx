import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell, Smartphone, Palette, Shield, Eye, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';
import NotificationSettings from '@/components/NotificationSettings';

// Fixed Header Component
const FixedHeader = ({ title, onBackClick }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="rounded-full p-2 hover:bg-sky-50 transition-all duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-sky-600 mt-8" />
          </button>
          <h1 className="mt-8 text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none text-gray-900 dark:text-white">Settings</h1>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSetting, updateSetting, resetSettings } = useSettings();
  const [expandedSections, setExpandedSections] = useState({});

  // Check if user is on mobile/tablet
  const isMobileOrTablet = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;

  const handleSwipeToggle = (enabled) => {
    updateSetting(SETTINGS_KEYS.SWIPE_NAVIGATION, enabled);
    
    // Show a brief toast or feedback (optional)
    if (enabled) {
      console.log('Swipe navigation enabled - swipe left/right to navigate between pages on mobile');
    } else {
      console.log('Swipe navigation disabled');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      <FixedHeader title="Settings" onBackClick={() => navigate(-1)} />
      <div className="pt-24 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen animate-fadeInUp">

      {/* Settings content */}
      <div className="mt-4 space-y-6">
        {/* General Settings Section - First */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gray-100 p-2">
              <SettingsIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">General</h2>
              <p className="text-sm text-gray-600">App preferences and navigation settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Swipe Navigation Toggle - Now part of General */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Swipe Navigation</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Enable swipe gestures to navigate between pages on mobile devices
                  {!isMobileOrTablet && <span className=" text-orange-500"> (Desktop - feature available on mobile only)</span>}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.SWIPE_NAVIGATION)}
                  onChange={(e) => handleSwipeToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
              </label>
            </div>
            
            {/* Help text when swipe is enabled */}
            {getSetting(SETTINGS_KEYS.SWIPE_NAVIGATION) && isMobileOrTablet && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-gray-700">
                  <span className="font-medium">How to use:</span> Swipe left or right anywhere on the screen to navigate between Home, Cart, Messages, and Orders pages.
                </p>
              </div>
            )}

            {/* Data Saver Mode */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Data Saver Mode</h3>
                <p className="text-xs text-gray-500 mt-1">Reduce bandwidth usage and optimize for slower connections</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.DATA_SAVER_MODE)}
                  onChange={(e) => updateSetting(SETTINGS_KEYS.DATA_SAVER_MODE, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
              </label>
            </div>

            {/* Message Read Receipts */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Read Receipts</h3>
                <p className="text-xs text-gray-500 mt-1">Show when you've read messages in chats</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.MESSAGE_READ_RECEIPTS)}
                  onChange={(e) => updateSetting(SETTINGS_KEYS.MESSAGE_READ_RECEIPTS, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Region - Second */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-orange-100 p-2">
              <Globe className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Language & Region</h2>
              <p className="text-sm text-gray-600">Set your language and regional preferences</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">App Language</h3>
                <p className="text-xs text-gray-500 mt-1">Choose your preferred language</p>
              </div>
              <select 
                value={getSetting(SETTINGS_KEYS.LANGUAGE)} 
                onChange={(e) => updateSetting(SETTINGS_KEYS.LANGUAGE, e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="en">English</option>
                <option value="yo">Yoruba</option>
                <option value="ha">Hausa</option>
                <option value="ig">Igbo</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance Settings - Third */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-purple-100 p-2">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Appearance</h2>
              <p className="text-sm text-gray-600">Customize how the app looks and feels</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Theme Mode */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Theme</h3>
                <p className="text-xs text-gray-500 mt-1">Choose your preferred color scheme</p>
              </div>
              <select 
                value={getSetting(SETTINGS_KEYS.THEME_MODE)} 
                onChange={(e) => updateSetting(SETTINGS_KEYS.THEME_MODE, e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Font Size</h3>
                <p className="text-xs text-gray-500 mt-1">Adjust text size for better readability</p>
              </div>
              <select 
                value={getSetting(SETTINGS_KEYS.FONT_SIZE)} 
                onChange={(e) => updateSetting(SETTINGS_KEYS.FONT_SIZE, e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-purple-300"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>

        {/* Accessibility - Fourth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Eye className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Accessibility</h2>
              <p className="text-sm text-gray-600">Make the app easier to use for everyone</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* High Contrast */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">High Contrast</h3>
                <p className="text-xs text-gray-500 mt-1">Increase contrast for better visibility</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.HIGH_CONTRAST)}
                  onChange={(e) => updateSetting(SETTINGS_KEYS.HIGH_CONTRAST, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Reduce Motion</h3>
                <p className="text-xs text-gray-500 mt-1">Minimize animations and transitions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.REDUCE_MOTION)}
                  onChange={(e) => updateSetting(SETTINGS_KEYS.REDUCE_MOTION, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Notifications Section - Fifth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-sky-100 p-2">
              <Bell className="h-5 w-5 text-sky-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Notifications</h2>
              <p className="text-sm text-gray-600">Manage your notification preferences</p>
            </div>
          </div>
          
          <div className="pl-0">
            <NotificationSettings />
          </div>
        </div>

        {/* Privacy & Security - Sixth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-sky-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-green-100 p-2">
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Privacy & Security</h2>
              <p className="text-sm text-gray-600">Control your data and security settings</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Biometric Login */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Biometric Login</h3>
                <p className="text-xs text-gray-500 mt-1">Use fingerprint or face recognition to unlock</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={getSetting(SETTINGS_KEYS.BIOMETRIC_LOGIN)}
                  onChange={(e) => updateSetting(SETTINGS_KEYS.BIOMETRIC_LOGIN, e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Auto Lock */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Auto Lock</h3>
                <p className="text-xs text-gray-500 mt-1">Lock app after period of inactivity</p>
              </div>
              <select 
                value={getSetting(SETTINGS_KEYS.AUTO_LOCK)} 
                onChange={(e) => updateSetting(SETTINGS_KEYS.AUTO_LOCK, e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="1min">1 minute</option>
                <option value="5min">5 minutes</option>
                <option value="15min">15 minutes</option>
                <option value="never">Never</option>
              </select>
            </div>

            {/* Location Precision */}
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-sm font-medium text-gray-800">Location Sharing</h3>
                <p className="text-xs text-gray-500 mt-1">Choose location accuracy for deliveries</p>
              </div>
              <select 
                value={getSetting(SETTINGS_KEYS.LOCATION_PRECISION)} 
                onChange={(e) => updateSetting(SETTINGS_KEYS.LOCATION_PRECISION, e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <option value="precise">Precise</option>
                <option value="approximate">Approximate</option>
                <option value="off">Off</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reset Settings - Last */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-red-100 dark:border-gray-600 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-red-100 p-2">
              <SettingsIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-600 font-poppins">Reset Settings</h2>
              <p className="text-sm text-gray-600">Restore all settings to their default values</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-700 mb-3">
                <span className="font-medium">Warning:</span> This will reset all your preferences including theme, language, navigation settings, and accessibility options. This action cannot be undone.
              </p>
              <button 
                onClick={() => {
                  if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
                    resetSettings();
                  }
                }}
                className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Reset All Settings
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}