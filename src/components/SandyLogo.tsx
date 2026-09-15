import React, { useState } from 'react';

interface SandyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showGlow?: boolean;
  variant?: 'image' | 'vector';
}

export const SandyLogo: React.FC<SandyLogoProps> = ({
  size = 'md',
  className = '',
  showGlow = false,
  variant = 'image',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap: Record<string, { container: string; img: string }> = {
    sm: { container: 'w-7 h-7 rounded-lg', img: 'w-7 h-7' },
    md: { container: 'w-8 h-8 rounded-xl', img: 'w-8 h-8' },
    lg: { container: 'w-12 h-12 rounded-2xl', img: 'w-12 h-12' },
    xl: { container: 'w-16 h-16 rounded-2xl', img: 'w-16 h-16' },
  };

  const dimensionClasses =
    typeof size === 'string' ? sizeMap[size] || sizeMap.md : null;

  const customStyle =
    typeof size === 'number'
      ? {
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: `${Math.round(size * 0.25)}px`,
        }
      : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden shadow-md shadow-indigo-900/30 border border-indigo-500/30 bg-slate-950 ${
        dimensionClasses ? dimensionClasses.container : ''
      } ${showGlow ? 'ring-2 ring-indigo-500/40 animate-sandy-glow' : ''} ${className}`}
      style={customStyle}
    >
      {variant === 'image' && !imgError ? (
        <img
          src="/sandy-logo.jpg"
          alt="SandY Chat Logo"
          className="w-full h-full object-cover select-none"
          onError={() => setImgError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          <defs>
            <linearGradient id="sandyGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="sandyGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
          {/* Stylized Modern S with Neural Interconnects */}
          <path
            d="M36 15C36 10.5817 32.4183 7 28 7H18C13.5817 7 10 10.5817 10 15C10 19.4183 13.5817 23 18 23H30C34.4183 23 38 26.5817 38 31C38 35.4183 34.4183 39 30 39H18C13.5817 39 10 35.4183 10 31"
            stroke="url(#sandyGradient1)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Sparkling intelligence nodes */}
          <circle cx="36" cy="15" r="3" fill="#38bdf8" />
          <circle cx="10" cy="31" r="3" fill="#a855f7" />
          <path
            d="M24 19L25.5 24L30.5 25.5L25.5 27L24 32L22.5 27L17.5 25.5L22.5 24L24 19Z"
            fill="url(#sandyGlow)"
          />
        </svg>
      )}
    </div>
  );
};
