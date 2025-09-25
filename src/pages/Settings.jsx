import React from 'react';
import { ArrowLeft, Settings as SettingsIcon, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import NotificationSettings from '@/components/NotificationSettings';

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="pt-10 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen animate-fadeInUp">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 transition-all duration-200">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="rounded-full p-2 hover:bg-sky-50 btn-interactive icon-interactive transition-all duration-200"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-sky-600" />
            </button>
            <div className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none animate-slideInLeft">Settings</div>
          </div>
          <div className="flex items-center gap-2 animate-slideInRight">
            <SettingsIcon className="h-6 w-6 text-sky-600" />
          </div>
        </div>
      </div>

      {/* Settings content */}
      <div className="mt-6 space-y-6">
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
  );
}