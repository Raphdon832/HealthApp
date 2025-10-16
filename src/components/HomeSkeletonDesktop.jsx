import React from 'react';

export default function HomeSkeletonDesktop() {
  return (
    <div className="animate-pulse space-y-10">
      {/* Hero row */}
      <section className="grid grid-cols-[1.2fr_0.8fr] gap-6 rounded-4xl border border-sky-100 bg-white/80 dark:bg-slate-900/80 dark:border-slate-700/70 p-6 shadow-sm">
        <div className="flex flex-col gap-5">
          <div className="h-10 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
          <div className="h-4 w-2/3 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
          <div className="flex gap-3">
            <div className="h-12 flex-1 rounded-full bg-sky-50 dark:bg-slate-800/70" />
            <div className="h-12 w-36 rounded-full bg-sky-50 dark:bg-slate-800/70" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="rounded-3xl bg-sky-50/50 dark:bg-slate-800/60 p-4">
                <div className="h-16 rounded-2xl bg-sky-100/60 dark:bg-slate-700/70" />
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-50 via-white to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.3),_transparent_65%)] dark:bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.25),_transparent_60%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 w-40 rounded-full bg-sky-100/70 dark:bg-slate-600/70" />
              <div className="h-3 w-56 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full bg-sky-100/60 dark:bg-slate-600/60" />
              <div className="h-3 w-2/3 rounded-full bg-sky-100/40 dark:bg-slate-600/40" />
            </div>
            <div className="flex gap-3">
              <span className="h-10 flex-1 rounded-full bg-sky-100/70 dark:bg-slate-700/70" />
              <span className="h-10 w-36 rounded-full bg-sky-100/70 dark:bg-slate-700/70" />
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations row */}
      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-8 space-y-4 rounded-4xl border border-sky-100 bg-white/85 dark:bg-slate-900/85 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="h-4 w-44 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="flex flex-col gap-4 rounded-3xl bg-sky-50/40 dark:bg-slate-800/60 p-4">
                <div className="aspect-video w-full rounded-3xl bg-sky-100/60 dark:bg-slate-700/70" />
                <div className="space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-1/2 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/50 dark:bg-slate-600/60" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-10 flex-1 rounded-full bg-sky-100/60 dark:bg-slate-700/70" />
                  <div className="h-10 w-24 rounded-full bg-sky-100/50 dark:bg-slate-700/60" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="col-span-4 space-y-4 rounded-4xl border border-sky-100 bg-white/85 dark:bg-slate-900/85 dark:border-slate-700/70 p-5 shadow-sm">
          <div className="h-4 w-32 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} className="flex items-center gap-3 rounded-3xl bg-sky-50/40 dark:bg-slate-800/60 p-3">
                <div className="h-12 w-12 rounded-2xl bg-sky-100/60 dark:bg-slate-700/70" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                  <div className="h-3 w-2/3 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
                </div>
                <div className="h-8 w-16 rounded-full bg-sky-100/50 dark:bg-slate-700/60" />
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Bottom carousel */}
      <section className="space-y-3">
        <div className="h-4 w-36 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <div key={index} className="flex flex-col gap-3 rounded-3xl border border-sky-100 bg-white/90 dark:bg-slate-900/85 dark:border-slate-700/70 p-4 shadow-sm">
              <div className="h-40 rounded-3xl bg-sky-50/70 dark:bg-slate-800/70" />
              <div className="space-y-2">
                <div className="h-3 w-3/4 rounded-full bg-sky-100/60 dark:bg-slate-600/70" />
                <div className="h-3 w-1/2 rounded-full bg-sky-100/40 dark:bg-slate-600/50" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 flex-1 rounded-full bg-sky-100/60 dark:bg-slate-700/70" />
                <div className="h-9 w-20 rounded-full bg-sky-100/50 dark:bg-slate-700/60" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
