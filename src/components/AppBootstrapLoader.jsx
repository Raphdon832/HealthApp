import React from 'react';

export default function AppBootstrapLoader() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4 text-gray-500 dark:text-gray-400">
        <img
          src="/iconLoader.svg"
          alt="Loading"
          className="h-12 w-12 animate-spin"
        />
        <p className="text-sm tracking-wide uppercase">Preparing your experience…</p>
      </div>
    </div>
  );
}
