import React from 'react';

export default function DashboardSkeletonMobile() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header / stats */}
      <section className="rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm">
        <div className="space-y-4">
          <div className="h-10 w-3/4 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
          <div className="flex gap-3">
            <div className="h-4 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
            <div className="h-4 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-3xl bg-sky-50/60 dark:bg-slate-800/60 p-4 space-y-3">
                <div className="h-9 w-9 rounded-2xl bg-sky-100/70 dark:bg-slate-700/70" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Charts placeholder */}
      <section className="rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-4 w-32 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
          <div className="h-4 w-20 rounded-full bg-sky-100/60 dark:bg-slate-600/60" />
        </div>
        <div className="h-40 rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="h-3 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
          ))}
        </div>
      </section>

      {/* Orders preview */}
      <section className="space-y-3">
        <div className="h-4 w-32 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
        {Array.from({ length: 3 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <div key={index} className="flex items-center gap-3 rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-3 shadow-sm">
            <div className="h-12 w-12 rounded-2xl bg-sky-100/70 dark:bg-slate-700/70" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
              <div className="h-3 w-2/3 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
            </div>
            <div className="h-9 w-16 rounded-full bg-sky-100/60 dark:bg-slate-700/70" />
          </div>
        ))}
      </section>

      {/* Messages & reviews */}
      <section className="grid gap-4">
        <div className="space-y-3 rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm">
          <div className="h-4 w-28 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
          {Array.from({ length: 2 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="space-y-2 rounded-3xl bg-sky-50/60 dark:bg-slate-800/60 p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-2xl bg-sky-100/70 dark:bg-slate-700/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-sky-100/40 dark:bg-slate-600/40" />
            </div>
          ))}
        </div>
        <div className="space-y-3 rounded-3xl border border-sky-100 bg-white/85 dark:bg-slate-900/80 dark:border-slate-700/70 p-4 shadow-sm">
          <div className="h-4 w-32 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
          {Array.from({ length: 2 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="space-y-2 rounded-3xl bg-sky-50/60 dark:bg-slate-800/60 p-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-sky-100/70 dark:bg-slate-700/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-4/5 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                </div>
              </div>
              <div className="h-3 w-full rounded-full bg-sky-100/40 dark:bg-slate-600/40" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
