export default function FilterIcon({ className = "h-4 w-4", ...props }) {
  return (
    <svg 
      width="20" 
      height="18" 
      viewBox="0 0 20 18" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path 
        d="M3 9V1M17 17V14M3 17V13M17 10V1M10 4V1M10 17V8" 
        stroke="currentColor" 
        strokeLinecap="round"
      />
      <path 
        d="M3 13C4.10457 13 5 12.1046 5 11C5 9.89543 4.10457 9 3 9C1.89543 9 1 9.89543 1 11C1 12.1046 1.89543 13 3 13Z" 
        stroke="currentColor" 
        strokeLinecap="round"
      />
      <path 
        d="M10 8C11.1046 8 12 7.10457 12 6C12 4.89543 11.1046 4 10 4C8.89543 4 8 4.89543 8 6C8 7.10457 8.89543 8 10 8Z" 
        stroke="currentColor" 
        strokeLinecap="round"
      />
      <path 
        d="M17 14C18.1046 14 19 13.1046 19 12C19 10.8954 18.1046 10 17 10C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14Z" 
        stroke="currentColor" 
        strokeLinecap="round"
      />
    </svg>
  );
}
