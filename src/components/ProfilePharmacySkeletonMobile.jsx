import React from 'react';

export default function ProfilePharmacySkeletonMobile() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Hero card */}
      <section className="rounded-3xl border border-sky-100 bg-white/85 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-3xl bg-sky-100" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded-full bg-sky-100/70" />
            <div className="h-3 w-2/3 rounded-full bg-sky-100/50" />
            <div className="h-3 w-1/2 rounded-full bg-sky-100/40" />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="h-10 flex-1 rounded-full bg-sky-50" />
          <div className="h-10 w-12 rounded-full bg-sky-50" />
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="rounded-3xl border border-sky-100 bg-white/85 p-4 shadow-sm">
            <div className="h-10 w-10 rounded-2xl bg-sky-100/70 mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-1/2 rounded-full bg-sky-100/60" />
              <div className="h-3 w-2/3 rounded-full bg-sky-100/50" />
            </div>
          </div>
        ))}
      </section>

      {/* Verification */}
      <section className="rounded-3xl border border-sky-100 bg-white/85 p-4 shadow-sm space-y-3">
        <div className="h-4 w-40 rounded-full bg-sky-100/70" />
        <div className="h-3 w-full rounded-full bg-sky-100/40" />
        <div className="h-3 w-5/6 rounded-full bg-sky-100/40" />
        <div className="flex gap-3">
          <div className="h-9 flex-1 rounded-full bg-sky-100/70" />
          <div className="h-9 w-24 rounded-full bg-sky-100/70" />
        </div>
      </section>

      {/* Inventory */}
      <section className="space-y-3">
        <div className="h-4 w-44 rounded-full bg-sky-100/70" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="rounded-3xl border border-sky-100 bg-white/85 p-4 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-sky-100/80" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/50" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-9 flex-1 rounded-full bg-sky-100/60" />
                <div className="h-9 w-20 rounded-full bg-sky-100/50" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

