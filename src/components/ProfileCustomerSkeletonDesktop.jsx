import React from 'react';

export default function ProfileCustomerSkeletonDesktop() {
  return (
    <div className="animate-pulse space-y-8">
      {/* Header card */}
      <section className="grid grid-cols-[0.9fr_1.1fr] gap-6 rounded-4xl border border-sky-100 bg-white/80 p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-[32px] bg-sky-100" />
          <div className="flex-1 space-y-4">
            <div className="h-6 w-2/3 rounded-full bg-sky-100/70" />
            <div className="h-4 w-3/4 rounded-full bg-sky-100/50" />
            <div className="flex gap-3">
              <div className="h-4 flex-1 rounded-full bg-sky-50" />
              <div className="h-4 flex-1 rounded-full bg-sky-50" />
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div className="flex gap-3">
            <div className="h-14 flex-1 rounded-full bg-sky-50" />
            <div className="h-14 w-40 rounded-full bg-sky-50" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-3xl bg-sky-50/60 p-4">
                <div className="h-4 w-1/2 rounded-full bg-sky-100/70 mb-3" />
                <div className="h-3 w-3/4 rounded-full bg-sky-100/50 mb-2" />
                <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[0.45fr_0.55fr] gap-6">
        {/* Left column */}
        <section className="space-y-6">
          {/* Overview card */}
          <div className="rounded-4xl border border-sky-100 bg-white/80 p-6 shadow-sm space-y-4">
            <div className="h-4 w-32 rounded-full bg-sky-100/70" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="rounded-3xl bg-sky-50/50 p-4 space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-sky-100/60" />
                  <div className="space-y-2">
                    <div className="h-3 w-2/3 rounded-full bg-sky-100/60" />
                    <div className="h-3 w-1/2 rounded-full bg-sky-100/40" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity list */}
          <div className="rounded-4xl border border-sky-100 bg-white/80 p-6 shadow-sm space-y-4">
            <div className="h-4 w-36 rounded-full bg-sky-100/70" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="flex items-center gap-3 rounded-3xl bg-sky-50/50 p-3">
                  <div className="h-12 w-12 rounded-2xl bg-sky-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                    <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
                  </div>
                  <div className="h-9 w-20 rounded-full bg-sky-100/60" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right column */}
        <section className="space-y-6">
          {/* Prescriptions */}
          <div className="rounded-4xl border border-sky-100 bg-white/80 p-6 shadow-sm space-y-4">
            <div className="h-4 w-32 rounded-full bg-sky-100/70" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="space-y-3 rounded-3xl bg-sky-50/50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-sky-100/70" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded-full bg-sky-100/60" />
                      <div className="h-3 w-1/2 rounded-full bg-sky-100/40" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded-full bg-sky-100/40" />
                    <div className="h-3 w-5/6 rounded-full bg-sky-100/40" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 rounded-full bg-sky-100/60" />
                    <div className="h-9 w-24 rounded-full bg-sky-100/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Wishlist */}
          <div className="rounded-4xl border border-sky-100 bg-white/80 p-6 shadow-sm space-y-4">
            <div className="h-4 w-40 rounded-full bg-sky-100/70" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={index} className="flex items-center gap-3 rounded-3xl bg-sky-50/50 p-3">
                  <div className="h-11 w-11 rounded-2xl bg-sky-100/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                    <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
                  </div>
                  <div className="h-8 w-20 rounded-full bg-sky-100/50" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

