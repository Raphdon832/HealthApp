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

const SLIDE_BACKGROUNDS = [
  '#D1FFF8',
  '#FFDBDB',
  '#D9FFE1',
  '#FFF7CD',
  '#EFE1FF',
  '#E1F2FF',
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

  const currentBg = SLIDE_BACKGROUNDS[currentIndex] || '#FFFFFF';
  // full-bleed style to escape surrounding layout padding and span the full viewport width
  const fullBleedStyle = {
    backgroundColor: currentBg,
    width: '100vw',
    marginLeft: 'calc(50% - 50vw)',
    marginRight: 'calc(50% - 50vw)'
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden transition-colors duration-300" style={fullBleedStyle}>
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip onboarding"
        className="fixed right-4 top-4 z-50 pointer-events-auto text-sm font-normal text-sky-500 transition-colors hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-400 dark:hover:text-white"
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        Skip
      </button>

      {/* CONTENT WRAPPER — flush-left */}
      <div
        className="flex w-full max-w-none flex-1 flex-col items-start px-0 pb-28 sm:px-0 lg:px-0"
        style={{ paddingTop: 23 }}
      >
        <div {...handlers} className="flex flex-col mr-auto self-start w-full">
          {/* step indicator moved to fixed top-left to remain visible */}

          <div className="w-full max-w-xl pr-6 sm:pr-8 md:pr-56 lg:pr-64 lg:max-w-none">
            {/* Pharmasea logo (subtle entrance) */}
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-4 mt-16 flex justify-center lg:justify-center"
            >
              <img
                src="/PharmLogo.png"
                alt="Pharmasea"
                className="mx-auto h-8 sm:h-10 md:h-12 lg:h-16 object-contain"
              />
            </motion.div>
            <AnimatePresence mode="wait">
              <motion.h1
                key={currentSlide.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.45 }}
                className="mt-8 text-left text-4xl font-light leading-tight sm:text-3xl md:text-4xl lg:text-6xl pl-4 sm:pl-6 lg:pl-6"
              >
                {currentSlide.title.includes("(for Vendors)") ? (
                  <>
                    {currentSlide.title.replace(" (for Vendors)", "")}
                    <span className="ml-2 align-left text-sm font-light text-slate-500 dark:text-slate-400">(for Vendors)</span>
                  </>
                ) : (
                  currentSlide.title
                )}
              </motion.h1>

              <motion.p
                key={currentSlide.description}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.45, delay: 0.04 }}
                className="mt-4 max-w-xl lg:max-w-none text-left text-[17px] font-normal text-slate-500 dark:text-slate-300 sm:text-lg lg:text-[22px] pl-4 sm:pl-6 lg:pl-6"
              >
                {currentSlide.description}
              </motion.p>
            </AnimatePresence>
          </div>

            {/* image placeholder keeps layout stable while actual image is fixed */}
            <div
              className="relative mt-8 flex w-full justify-end"
              style={{ bottom: 70 }}
            >
              <div
                className="w-full max-w-[400px] sm:max-w-[440px] h-0"
                aria-hidden
              />
            </div>
        </div>
      </div>

      {/* fixed step indicator at top-left */}
      <motion.span
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="fixed left-4 top-4 z-50 text-xs uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500 pointer-events-none"
      >
        Step {currentIndex + 1} of {totalSlides}
      </motion.span>

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
      <div
        aria-hidden
        className="fixed inset-x-0 bottom-6 z-40 flex justify-center pointer-events-none"
      >
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
                  backgroundColor:
                    idx === currentIndex ? "#0f172a" : "#e6e9ee",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                onClick={() => {
                  if (isAnimating) return;
                  setIsAnimating(true);
                  setCurrentIndex(idx);
                }}
                className="h-2 w-2 rounded-full cursor-pointer dark:cursor-pointer"
                aria-label={`Go to step ${idx + 1}`}
              />
            ))}
          </div>

          <motion.button
            type="button"
            onClick={handleNext}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="flex h-20 w-20 z-50 items-center justify-center shadow-md rounded-full bg-sky-600 text-lg font-normal text-white transition-colors lg:bg-sky-600 hover:bg-sky-600 hover:backdrop-blur-md active:scale-[1] dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {currentIndex === totalSlides - 1 ? "Start" : "Next"}
          </motion.button>
        </div>
      </div>
    </div>
  );
}