import React from 'react';

export default function ProductDetailSkeletonDesktop() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="pt-6 sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-2">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-8 lg:px-12 xl:px-0">
          <div className="flex items-center justify-between">
            <div className="w-[70px] h-[24px] bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-8 lg:px-12 xl:px-0 pt-1 pb-36">

          {/* Grey details sheet */}
          <div className="mt-1 border rounded-t-3xl border-zinc-100 dark:border-gray-700">
            <div className="w-full pt-6 pb-36">

              {/* CENTRAL CONTENT: two-column on desktop */}
              <div className="mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                  {/* LEFT: Product image */}
                  <div className="rounded-2xl border p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-full h-80 bg-gray-200 dark:bg-gray-700 rounded-md" />

                    {/* CTAs */}
                    <div className="w-full mt-4 flex flex-col gap-3">
                      <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>
                  </div>

                  {/* RIGHT: stacked widgets */}
                  <div className="flex flex-col space-y-4">

                    {/* Name + Price row */}
                    <div className="flex items-start justify-between">
                      <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>

                    {/* Price for desktop */}
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />

                    {/* Pharmacy name */}
                    <div className="h-5 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />

                    {/* Address row */}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>

                    {/* ETA */}
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>

                    {/* Get Directions */}
                    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded-full" />

                    {/* Category */}
                    <div>
                      <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-1" />
                      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                    </div>

                    <div className="border-b border-gray-200 dark:border-gray-700"></div>

                    {/* Product description */}
                    <div>
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mb-2" />
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded-full" />
                        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      </div>
                    </div>

                    <div className="border-b border-gray-200 dark:border-gray-700"></div>

                    {/* Reviews/Comments Section */}
                    <div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
