import React from 'react';

export default function ProductDetailSkeletonMobile() {
  return (
    <div className="animate-pulse">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="w-[70px] h-[24px] bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-24 pb-36">
        <div className="w-full max-w-full px-4 pt-6">

          {/* Product Image */}
          <div className="mb-6 flex flex-col items-center">
            <div className="w-[68vw] h-[58vw] bg-gray-200 dark:bg-gray-700 rounded-md" />
          </div>

          {/* Product Name and Price */}
          <div className="mb-3 flex items-start justify-between">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Pharmacy Name */}
          <div className="mb-2">
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Address and ETA */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>

          {/* Category */}
          <div className="mt-2 mb-4">
            <div className="flex items-center justify-between">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>

          <div className="mt-4 border-b border-gray-200 dark:border-gray-700"></div>

          {/* Product Description */}
          <div className="mt-6">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>

          <div className="mt-8 border-b border-gray-200 dark:border-gray-700"></div>

          {/* Reviews Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-4 w-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>

            {/* Review Items */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <div key={starIndex} className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                        ))}
                      </div>
                    </div>
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
                    <div className="h-3 w-4/5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  </div>
                </div>
              ))}
            </div>

            {/* Review Form */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-full mb-3" />
              <div className="space-y-3">
                <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="flex gap-2">
                  <div className="h-10 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
