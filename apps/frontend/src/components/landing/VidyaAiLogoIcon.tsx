import React from "react";

interface VidyaAiLogoIconProps {
  className?: string;
}

export default function VidyaAiLogoIcon({ className = "w-9 h-9" }: VidyaAiLogoIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background Icon Frame */}
      <rect width="100" height="100" rx="22" fill="#1e1e1a" />
      
      {/* Glow highlight */}
      <circle cx="50" cy="50" r="35" fill="url(#radialGlow)" opacity="0.15" />

      {/* Left wing-leaf of book (Pure Knowledge / Vidya) */}
      <path
        d="M28 65C38 65 46 61 50 56V32C46 37 38 41 28 41V65Z"
        fill="url(#bookGradLeft)"
      />
      
      {/* Right wing-leaf of book (AI engine / Innovation) */}
      <path
        d="M72 65C62 65 54 61 50 56V32C54 37 62 41 72 41V65Z"
        fill="url(#bookGradRight)"
      />
      
      {/* Synapse Connection Center node */}
      <circle cx="50" cy="32" r="3.5" fill="#e05934" />
      
      {/* Left node anchor */}
      <circle cx="28" cy="41" r="2.5" fill="#e05934" />
      
      {/* Right node anchor */}
      <circle cx="72" cy="41" r="2.5" fill="#e05934" />
      
      {/* Bottom core spine node */}
      <circle cx="50" cy="56" r="3" fill="#e05934" />
      
      {/* Algorithmic Connecting Synapses (Dashed lines showing active AI grading process) */}
      <path
        d="M50 32L28 41"
        stroke="#e05934"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        opacity="0.8"
      />
      <path
        d="M50 32L72 41"
        stroke="#e05934"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        opacity="0.8"
      />
      <path
        d="M50 32L50 56"
        stroke="#e05934"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        opacity="0.8"
      />

      {/* Above center spark star representing guidance and accuracy */}
      <path
        d="M50 15C50.5 19 51 20 55 20.5C51 21 50.5 22 50 26C49.5 22 49 21 45 20.5C49 20 49.5 19 50 15Z"
        fill="#e05934"
      />

      <defs>
        {/* Academic / Knowledge paper gradient */}
        <linearGradient id="bookGradLeft" x1="28" y1="32" x2="50" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e5e5e0" />
        </linearGradient>

        {/* AI algorithmic processing gradient */}
        <linearGradient id="bookGradRight" x1="72" y1="32" x2="50" y2="65" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#e05934" />
          <stop offset="100%" stopColor="#ff7c59" />
        </linearGradient>

        {/* Subtle orange glow */}
        <radialGradient id="radialGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" transform="translate(50 50) rotate(90) scale(35)">
          <stop offset="0%" stopColor="#e05934" />
          <stop offset="100%" stopColor="#1e1e1a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
