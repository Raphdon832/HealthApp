import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Settings as SettingsIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
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