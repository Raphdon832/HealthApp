import React from 'react';

export default function VendorProfileSkeletonDesktop() {
  return (
    <div className="animate-pulse">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 items-center gap-3 animate-slide-down-fade hidden md:flex">
        <div className="w-[72px] h-[25px] bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="w-48 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="ml-auto flex items-center gap-2">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-white/80 dark:bg-gray-900/80 backdrop-blur-md w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 pt-24 md:pt-8 pb-28">
        <div className="w-full mx-auto mt-6">
          <div className="flex flex-col md:grid md:grid-cols-3 gap-6">

            {/* VENDOR DETAILS (desktop: left column) */}
            <aside className="md:col-span-1 md:self-start md:sticky md:top-20 animate-fade-in-left">
              <div className="border border-zinc-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm p-5 mb-4 w-full flex flex-col items-start card-interactive">
                {/* Vendor Avatar */}
                <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-gray-700 flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Vendor Name */}
                <div className="w-48 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />

                {/* Email */}
                <div className="w-40 h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />

                {/* Address */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                {/* ETA */}
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-28 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>

                {/* Phone */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>

              {/* Message Button */}
              <div className="w-full mb-4">
                <div className="w-full h-[37px] bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </aside>

            {/* PRODUCTS SECTION (desktop: right columns) */}
            <div className="md:col-span-2 animate-fade-in-up">
              {/* Products Header */}
              <div className="border border-zinc-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-sm p-4 mb-4 flex items-center justify-between md:sticky md:top-20 md:bg-white/90 md:dark:bg-gray-800/90 md:backdrop-blur-sm md:z-20">
                <div>
                  <div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />
                  <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>

              {/* Products List */}
              <div className="md:max-h-[calc(100vh-12rem)] md:overflow-y-auto md:pr-4">
                <div className="space-y-3 px-0">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-zinc-200 dark:border-gray-600 p-3 flex items-center gap-3 bg-white dark:bg-gray-800 shadow-sm"
                    >
                      {/* Product Avatar */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />
                        <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
                      </div>

                      {/* Price */}
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
