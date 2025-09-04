import * as React from "react";

export default function AttachmentIcon({ className = "", style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      style={style}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.25 6.75v7.5a4.5 4.5 0 01-9 0v-7.5a3 3 0 016 0v7.5a1.5 1.5 0 01-3 0v-7.5"
      />
    </svg>
  );
}
