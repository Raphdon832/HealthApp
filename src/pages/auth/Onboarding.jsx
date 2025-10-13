// src/pages/auth/Onboarding.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const ONBOARDING_SLIDES = [
  {
    title: "Welcome to Pharmasea",
    description: "Your trusted digital pharmacy marketplace.",
    illustration: "/onboarding/Onboarding 1.png",
  },
  {
    title: "Find Verified Pharmacies",
    description: "Easily locate licensed pharmacies near you.",
    illustration: "/onboarding/Onboarding 2.png",
  },
  {
    title: "Order & Refill Medications",
    description: "Order prescriptions and over-the-counter drugs with ease.",
    illustration: "/onboarding/Onboarding 3.png",
  },
  {
    title: "Secure Payments & Fast Delivery",
    description: "Pay safely through integrated wallets and get doorstep delivery.",
    illustration: "/onboarding/Onboarding 4.png",
  },
  {
    title: "Pharmacy Dashboard (for Vendors)",
    description: "Manage your products, sales, and customers in one place.",
    illustration: "/onboarding/Onboarding 5.png",
  },
  {
    title: "Join the Pharmasea Community",
    description: "Connect with healthcare professionals and customers easily.",
    illustration: "/onboarding/Onboarding 6.png",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = ONBOARDING_SLIDES.length;

  const currentSlide = useMemo(
    () => ONBOARDING_SLIDES[currentIndex],
    [currentIndex]
  );

  const handleSkip = () => navigate("/auth/landing", { replace: true });

  const handleNext = () => {
    if (currentIndex >= totalSlides - 1) {
      navigate("/auth/landing", { replace: true });
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const handleBack = () => {
    if (currentIndex === 0) return;
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <button
        type="button"
        onClick={handleSkip}
        className="absolute right-6 top-6 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-400 dark:hover:text-white"
      >
        Skip
      </button>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-28 pt-20 sm:px-10 lg:px-14">
        <span className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
          Step {currentIndex + 1} of {totalSlides}
        </span>
        <h1 className="mt-8 text-4xl font-light leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {currentSlide.title}
        </h1>
        <p className="mt-4 max-w-xl text-[18px] font-thin text-slate-600 dark:text-slate-300 sm:text-lg">
          {currentSlide.description}
        </p>

        <div className="relative mt-auto flex w-full justify-end">
          <img
            src={currentSlide.illustration}
            alt={currentSlide.title}
            className="w-full max-w-[400px] object-contain sm:max-w-[440px]"
            loading="lazy"
          />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="pointer-events-auto mx-auto flex w-full max-w-4xl items-center justify-between px-6 pb-8 sm:px-10 lg:px-14">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0}
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:text-white"
          >
            back
          </button>

          <div className="flex items-center gap-2">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={`h-2 w-2 rounded-full transition-all ${
                  idx === currentIndex
                    ? "scale-110 bg-slate-900 dark:bg-white"
                    : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="flex h-20 w-20 z-10 items-center justify-center shadow-md rounded-full bg-sky-500 text-lg font-thin text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {currentIndex === totalSlides - 1 ? "Start" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
