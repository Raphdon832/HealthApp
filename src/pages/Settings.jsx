import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';
import NotificationSettings from '@/components/NotificationSettings';

// Fixed Header Component
const FixedHeader = ({ title, onBackClick }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackClick}
            className="rounded-full p-2 hover:bg-sky-50 transition-all duration-200"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-sky-600 mt-8" />
          </button>
          <h1 className="mt-8 text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none">Settings</h1>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getSetting, updateSetting } = useSettings();

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

  return (
    <>
      <FixedHeader title="Settings" onBackClick={() => navigate(-1)} />
      <div className="pt-24 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen animate-fadeInUp">

      {/* Settings content */}
      <div className="mt-4 space-y-6">
        {/* Notifications Section */}
        <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm animate-fade-in-up">
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

        {/* Future settings sections can be added here */}
        <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gray-100 p-2">
              <Smartphone className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">Navigation</h2>
              <p className="text-sm text-gray-600">Customize your navigation experience</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Swipe Navigation Toggle */}
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
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
            
            {/* Help text when swipe is enabled */}
            {getSetting(SETTINGS_KEYS.SWIPE_NAVIGATION) && isMobileOrTablet && (
              <div className="bg-sky-50 rounded-lg p-3 mt-2">
                <p className="text-xs text-sky-700">
                  <span className="font-medium">How to use:</span> Swipe left or right anywhere on the screen to navigate between Home, Cart, Messages, and Orders pages.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* General Settings Section */}
        <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gray-100 p-2">
              <SettingsIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 font-poppins">General</h2>
              <p className="text-sm text-gray-600">App preferences and account settings</p>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 italic">
            More settings coming soon...
          </div>
        </div>
      </div>
      </div>
    </>
  );
}