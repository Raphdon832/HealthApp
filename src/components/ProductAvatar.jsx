import React, { useState } from 'react';

export default function ProductAvatar({
  name,
  image,
  category,
  size = 64,
  className = '',
  alt,
  style = {},
  imgClassName = '',
  roundedClass = 'rounded-xl',
}) {
  const [errored, setErrored] = useState(false);

  const normalizedCategory = (category || '')?.toString().toLowerCase().trim();
  let categoryIcon = null;
  if (normalizedCategory) {
    if (normalizedCategory.includes('prescription')) categoryIcon = 'PrescriptionDrugs.svg';
    else if (normalizedCategory.includes('over')) categoryIcon = 'Over-the-counter Icon.svg';
    else if (normalizedCategory.includes('syrup')) categoryIcon = 'Syrup.svg';
    else if (normalizedCategory.includes('therapeutic')) categoryIcon = 'Therapeutic.svg';
    else if (normalizedCategory.includes('control')) categoryIcon = 'ControlledSubstances.svg';
    else if (normalizedCategory.includes('target')) categoryIcon = 'TargetSystem.svg';
  }
  // Always fallback to GeneralPill.svg when no matching category icon
  const fallbackIcon = 'GeneralPill.svg';
  const iconToShow = categoryIcon || fallbackIcon;

  const sizeStyle = { width: size, height: size, ...style };

  // If image is provided and hasn't errored yet, try to show it
  if (image && !errored) {
    return (
      // eslint-disable-next-line jsx-a11y/img-redundant-alt
      <img
        src={image}
        alt={alt || name || 'Product image'}
        className={`${roundedClass} object-cover ${imgClassName}`.trim()}
        style={sizeStyle}
        onError={() => setErrored(true)}
      />
    );
  }

  // Show category SVG from /public (use encodeURIComponent to handle spaces)
  return (
    <div className={`${className}`} style={sizeStyle}>
      <img
        src={`/${encodeURIComponent(iconToShow)}`}
        alt={alt || (category ? `${category} icon` : 'product icon')}
        className={`${roundedClass} object-contain w-full h-full`}
        onError={(e) => {
          // If icon fails to load, fallback to GeneralPill (avoid infinite loop)
          if (iconToShow !== fallbackIcon) {
            e.currentTarget.src = `/${encodeURIComponent(fallbackIcon)}`;
            return;
          }
        }}
      />
    </div>
  );
}
