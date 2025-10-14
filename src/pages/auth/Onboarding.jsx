// src/pages/auth/Onboarding.jsx
import React, { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipeable } from "react-swipeable";

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
  const [isAnimating, setIsAnimating] = useState(false);
  const totalSlides = ONBOARDING_SLIDES.length;

  const currentSlide = useMemo(
    () => ONBOARDING_SLIDES[currentIndex],
    [currentIndex]
  );

  const handleSkip = () => navigate("/auth/landing", { replace: true });

  const handleNext = () => {
    if (isAnimating) return;
    if (currentIndex >= totalSlides - 1) {
      navigate("/auth/landing", { replace: true });
      return;
    }
    setIsAnimating(true);
    setCurrentIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  };

  const handleBack = () => {
    if (isAnimating) return;
    if (currentIndex === 0) return;
    setIsAnimating(true);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  // keyboard navigation
  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "Escape") handleSkip();
    },
    [currentIndex, isAnimating]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  // swipe handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => handleNext(),
    onSwipedRight: () => handleBack(),
    delta: 50,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip onboarding"
        className="fixed right-4 top-4 z-50 pointer-events-auto text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-400 dark:hover:text-white"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        Skip
      </button>

      <div
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-28 sm:px-10 lg:px-14"
        style={{ paddingTop: 23 }}
      >
        <div {...handlers} className="flex flex-col">
          <motion.span
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500"
          >
            Step {currentIndex + 1} of {totalSlides}
          </motion.span>

          <AnimatePresence mode="wait">
            <motion.h1
              key={currentSlide.title}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.45 }}
              className="mt-8 text-4xl font-light leading-tight sm:text-3xl md:text-4xl lg:text-5xl"
            >
              {currentSlide.title}
            </motion.h1>

            <motion.p
              key={currentSlide.description}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.45, delay: 0.04 }}
              className="mt-4 max-w-xl text-[18px] font-thin text-slate-600 dark:text-slate-300 sm:text-lg"
            >
              {currentSlide.description}
            </motion.p>

            {/* image placeholder keeps layout stable while actual image is fixed */}
            <div className="relative mt-8 flex w-full justify-end" style={{ bottom: 70 }}>
              <div className="w-full max-w-[400px] sm:max-w-[440px] h-0" aria-hidden />
            </div>
          </AnimatePresence>
        </div>
      </div>

      {/* fixed illustration at bottom-right */}
      <motion.img
        key={currentSlide.illustration}
        src={currentSlide.illustration}
        alt=""
        aria-hidden="true"
        loading="lazy"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        onAnimationComplete={() => setIsAnimating(false)}
        className="fixed right-4 bottom-4 pointer-events-none z-10 w-[320px] max-w-[90vw] sm:w-[420px] md:w-[520px] object-contain will-change-transform"
      />

      {/* fixed bottom controls: back (left), dots (center), next (right) */}
      <div aria-hidden className="fixed inset-x-0 bottom-6 z-40 flex justify-center pointer-events-none">
        <div className="w-full max-w-md pointer-events-auto flex items-center justify-between px-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentIndex === 0}
            aria-label="Go to previous"
            className="z-50 text-sm font-normal text-slate-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:pointer-events-none disabled:opacity-0 dark:text-slate-400 dark:hover:text-white bg-white/0 backdrop-blur rounded-md px-3 py-2"
          >
            back
          </button>

          <div className="flex items-center gap-2">
            {ONBOARDING_SLIDES.map((_, idx) => (
              <motion.span
                key={idx}
                layout
                initial={false}
                animate={{
                  scale: idx === currentIndex ? 1.15 : 1,
                  backgroundColor: idx === currentIndex ? "#0f172a" : "#e6e9ee",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => {
                  if (isAnimating) return;
                  setIsAnimating(true);
                  setCurrentIndex(idx);
                }}
                className={`h-2 w-2 rounded-full cursor-pointer dark:cursor-pointer`}
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <motion.button
            type="button"
            onClick={handleNext}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="flex h-20 w-20 z-50 items-center justify-center shadow-md rounded-full bg-sky-500 text-lg font-normal text-white transition-colors hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-slate-400 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {currentIndex === totalSlides - 1 ? "Start" : "Next"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
