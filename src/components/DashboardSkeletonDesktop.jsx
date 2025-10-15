import React from 'react';

export default function DashboardSkeletonDesktop() {
  return (
    <div className="animate-pulse space-y-10">
      {/* Top row */}
      <section className="grid grid-cols-[1.1fr_0.9fr] gap-8">
        <div className="rounded-4xl border border-sky-100 bg-white/85 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-6 w-56 rounded-full bg-sky-100/70" />
              <div className="h-4 w-64 rounded-full bg-sky-100/50" />
            </div>
            <div className="flex gap-3">
              <div className="h-10 w-24 rounded-full bg-sky-100/60" />
              <div className="h-10 w-24 rounded-full bg-sky-100/60" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-3xl bg-sky-50/60 p-5 space-y-3">
                <div className="h-10 w-10 rounded-2xl bg-sky-100/70" />
                <div className="space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-sky-100/60" />
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
                </div>
                <div className="h-3 w-1/2 rounded-full bg-sky-100/30" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-4xl border border-sky-100 bg-white/85 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-5 w-40 rounded-full bg-sky-100/70" />
            <div className="h-4 w-28 rounded-full bg-sky-100/50" />
          </div>
          <div className="h-[260px] rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-100" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="h-3 rounded-full bg-sky-100/40" />
            ))}
          </div>
        </div>
      </section>

      {/* Mid row */}
      <section className="grid grid-cols-[0.6fr_0.4fr] gap-8">
        <div className="rounded-4xl border border-sky-100 bg-white/85 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-44 rounded-full bg-sky-100/70" />
            <div className="flex gap-3">
              <div className="h-9 w-24 rounded-full bg-sky-100/60" />
              <div className="h-9 w-24 rounded-full bg-sky-100/50" />
            </div>
          </div>
          <div className="h-48 rounded-3xl bg-sky-50/60" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-3xl bg-sky-50/50 p-4 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-sky-100/60" />
                <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-4xl border border-sky-100 bg-white/85 p-6 shadow-sm space-y-4">
          <div className="h-5 w-32 rounded-full bg-sky-100/70" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="flex items-center gap-3 rounded-3xl bg-sky-50/60 p-3">
                <div className="h-11 w-11 rounded-full bg-sky-100/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-100/40" />
                </div>
                <div className="h-8 w-16 rounded-full bg-sky-100/50" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom row */}
      <section className="rounded-4xl border border-sky-100 bg-white/85 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-36 rounded-full bg-sky-100/70" />
          <div className="h-4 w-28 rounded-full bg-sky-100/50" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="rounded-3xl border border-sky-100 bg-sky-50/50 p-4 space-y-3">
              <div className="h-28 rounded-3xl bg-white/60" />
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                <div className="h-3 w-2/3 rounded-full bg-sky-100/40" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-full bg-sky-100/60" />
                <div className="h-8 w-16 rounded-full bg-sky-100/50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

