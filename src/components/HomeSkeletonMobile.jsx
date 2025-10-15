import React from 'react';

export default function HomeSkeletonMobile() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Hero skeleton */}
      <section className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white/80 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-sky-100/80" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded-full bg-sky-100/60" />
            <div className="h-3 w-2/3 rounded-full bg-sky-100/50" />
          </div>
        </div>
        <div className="h-11 rounded-2xl bg-sky-50/80" />
        <div className="flex gap-3">
          <div className="h-24 flex-1 rounded-3xl bg-sky-50/60" />
          <div className="h-24 flex-1 rounded-3xl bg-sky-50/50" />
        </div>
      </section>

      {/* Pills / quick actions */}
      <section className="flex gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="h-10 flex-1 rounded-full bg-sky-50/70" />
        ))}
      </section>

      {/* Featured sections */}
      <section className="flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={sectionIndex} className="space-y-3 rounded-3xl border border-sky-100 bg-white/80 p-4 shadow-sm">
            <div className="h-4 w-1/2 rounded-full bg-sky-100/70" />
            <div className="flex gap-3">
              {Array.from({ length: 2 }).map((__, cardIndex) => (
                // eslint-disable-next-line react/no-array-index-key
                <div key={cardIndex} className="flex flex-1 flex-col gap-3 rounded-3xl bg-sky-50/50 p-3">
                  <div className="aspect-video w-full rounded-2xl bg-sky-100/60" />
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                    <div className="h-3 w-1/2 rounded-full bg-sky-100/50" />
                  </div>
                  <div className="h-9 rounded-full bg-sky-100/70" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Pharmacies carousel */}
      <section className="flex flex-col gap-3">
        <div className="h-4 w-1/2 rounded-full bg-sky-100/70" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="flex w-48 flex-col gap-3 rounded-3xl border border-sky-100 bg-white/90 p-3 shadow-sm">
              <div className="h-20 rounded-2xl bg-sky-50/70" />
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-sky-100/60" />
                <div className="h-3 w-1/2 rounded-full bg-sky-100/50" />
              </div>
              <div className="flex gap-2">
                <div className="h-8 flex-1 rounded-full bg-sky-100/60" />
                <div className="h-8 w-16 rounded-full bg-sky-100/60" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

