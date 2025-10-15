// src/components/VerifiedName.jsx
import React from "react";
import { BadgeCheck } from "lucide-react";

export default function VerifiedName({
  name,
  isVerified,
  className = "",
  nameClassName = "",
  iconClassName = "h-4 w-4 text-sky-500",
  label = "Verified pharmacy",
}) {
  if (!name) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`.trim()}
      title={isVerified ? label : undefined}
    >
      <span className={nameClassName}>{name}</span>
      {isVerified && (
        <BadgeCheck
          aria-label={label}
          role="img"
          className={iconClassName}
        />
      )}
    </span>
  );
}
