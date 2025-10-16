import React from 'react';

export default function ProfileCustomerSkeletonMobile() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header */}
      <section className="rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/85 dark:border-slate-700/70 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-3xl bg-sky-100 dark:bg-slate-700/80" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-3/5 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
            <div className="h-3 w-4/5 rounded-full bg-sky-100/50 dark:bg-slate-600/60" />
            <div className="flex gap-2">
              <div className="h-3 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
              <div className="h-3 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <div className="h-11 flex-1 rounded-2xl bg-sky-50 dark:bg-slate-800/70" />
          <div className="h-11 w-12 rounded-2xl bg-sky-50 dark:bg-slate-800/70" />
        </div>
      </section>

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm"
          >
            <div className="h-10 w-10 rounded-2xl bg-sky-100/70 dark:bg-slate-700/70 mb-3" />
            <div className="space-y-2">
              <div className="h-4 w-1/2 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
              <div className="h-3 w-3/4 rounded-full bg-sky-100/50 dark:bg-slate-600/60" />
            </div>
          </div>
        ))}
      </section>

      {/* Activity feed */}
      <section className="space-y-4 rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm">
        <div className="h-4 w-1/2 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              // eslint-disable-next-line react/no-array-index-key
              key={index}
              className="flex items-center gap-3 rounded-3xl bg-sky-50/60 dark:bg-slate-800/60 p-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-sky-100 dark:bg-slate-700/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
                <div className="h-3 w-1/2 rounded-full bg-sky-100/50 dark:bg-slate-600/60" />
              </div>
              <div className="h-8 w-16 rounded-full bg-sky-100/60 dark:bg-slate-700/70" />
            </div>
          ))}
        </div>
      </section>

      {/* Prescriptions */}
      <section className="space-y-3 rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm">
        <div className="h-4 w-1/2 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className="space-y-3 rounded-3xl bg-sky-50/60 dark:bg-slate-800/60 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-sky-100/80 dark:bg-slate-700/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/5 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
                <div className="h-3 w-2/3 rounded-full bg-sky-100/50 dark:bg-slate-600/60" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-sky-100/40 dark:bg-slate-600/40" />
              <div className="h-3 w-5/6 rounded-full bg-sky-100/40 dark:bg-slate-600/40" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 flex-1 rounded-full bg-sky-100/70 dark:bg-slate-700/70" />
              <div className="h-9 w-20 rounded-full bg-sky-100/70 dark:bg-slate-700/70" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
