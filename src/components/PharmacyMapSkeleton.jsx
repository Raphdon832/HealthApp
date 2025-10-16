import React from 'react';

export default function PharmacyMapSkeleton() {
  return (
    <div className="grid h-full w-full gap-4 lg:grid-cols-[420px_1fr] animate-pulse">
      {/* Sidebar skeleton */}
      <div className="flex flex-col rounded-3xl border border-sky-100 bg-white/80 dark:bg-slate-900/70 dark:border-slate-700/60 p-4 shadow-sm lg:h-full">
        <div className="rounded-2xl bg-sky-100/60 dark:bg-slate-700/80 h-12 mb-4" />
        <div className="flex items-center gap-2 mb-6">
          <div className="h-10 flex-1 rounded-2xl bg-sky-50 dark:bg-slate-800/70" />
          <div className="h-10 w-10 rounded-2xl bg-sky-50 dark:bg-slate-800/70" />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="h-4 w-24 rounded-full bg-sky-50 dark:bg-slate-800/80" />
          <div className="flex gap-2">
            <span className="h-8 w-20 rounded-full bg-sky-50 dark:bg-slate-800/80" />
            <span className="h-8 w-20 rounded-full bg-sky-50 dark:bg-slate-800/80" />
          </div>
        </div>

        <div className="space-y-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="rounded-3xl border border-sky-50 bg-white/90 dark:bg-slate-800/80 dark:border-slate-700/60 p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-sky-100/60 dark:bg-slate-700/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-50 dark:bg-slate-800/70" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-50 dark:bg-slate-800/70" />
                </div>
              </div>
              <div className="mb-3 h-3 w-2/3 rounded-full bg-sky-50 dark:bg-slate-800/70" />
              <div className="flex items-center gap-3">
                <span className="h-8 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
                <span className="h-8 w-24 rounded-full bg-sky-100/80 dark:bg-slate-700/80" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map skeleton */}
      <div className="relative h-[55vh] rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-inner lg:h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.2),_transparent_50%)] dark:bg-[radial-gradient(circle_at_center,_rgba(125,211,252,0.15),_transparent_55%)]" />
        <div className="absolute inset-4 rounded-[26px] border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-900/50 backdrop-blur-xl shadow-[inset_0_30px_60px_-30px_rgba(12,74,110,0.25)] dark:shadow-[inset_0_30px_60px_-30px_rgba(148,163,184,0.2)] flex flex-col items-center justify-center gap-6">
          <div className="h-16 w-16 rounded-full bg-sky-100/80 dark:bg-slate-700/80 shadow-lg" />
          <div className="space-y-3 text-center">
            <div className="mx-auto h-4 w-40 rounded-full bg-sky-100/80 dark:bg-slate-600/70" />
            <div className="mx-auto h-3 w-52 rounded-full bg-sky-100/60 dark:bg-slate-600/60" />
          </div>
          <div className="flex gap-3">
            <span className="h-8 w-28 rounded-full bg-sky-100/80 dark:bg-slate-700/70" />
            <span className="h-8 w-28 rounded-full bg-sky-100/60 dark:bg-slate-700/60" />
          </div>
        </div>
      </div>
    </div>
  );
}
