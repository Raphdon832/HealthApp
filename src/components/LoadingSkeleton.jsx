export default function LoadingSkeleton({ className = '', style = {}, lines = 3, desktopAlign = 'center' }) {
  const desktopClass = desktopAlign === 'left' ? 'lg:justify-start lg:pl-12' : 'lg:justify-center';

  return (
    <div
      className={`w-screen h-screen flex items-center justify-center ${desktopClass} bg-white ${className}`}
      style={style}
      role="status"
      aria-live="polite"
    >
      <div className="animate-fadeInScale">
        <picture>
          {/* Use DesktopLoading.svg for desktop viewports (>= 1024px) */}
          <source media="(min-width: 1024px)" srcSet="/DesktopLoading.svg" />
          {/* Fallback for smaller screens. Image will now fill the viewport while preserving aspect ratio */}
          <img
            src="/Loading.svg"
            alt="Loading"
            className="w-full h-full object-contain lg:object-cover lg:w-screen lg:h-screen animate-pulse-gentle"
          />
        </picture>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
