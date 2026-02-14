import React from 'react'

export type VyntaroLogoAnimatedProps = {
  size?: number
  className?: string
  orbit?: boolean
}

export default function VyntaroLogoAnimated({
  size = 44,
  className,
  orbit = true
}: VyntaroLogoAnimatedProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      aria-label="Vyntaro logo"
      className={className}
    >
      <defs>
        <linearGradient id="vyntaro-core" x1="16" y1="16" x2="104" y2="104">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
        <radialGradient
          id="vyntaro-halo"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(60 60) rotate(90) scale(60)"
        >
          <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className={orbit ? 'vi-logo-float' : undefined}>
        <rect x="10" y="10" width="100" height="100" rx="30" fill="#060c1d" />
        <rect x="10.5" y="10.5" width="99" height="99" rx="29.5" stroke="rgba(255,255,255,0.12)" />
        <circle cx="60" cy="60" r="48" fill="url(#vyntaro-halo)" className="vi-logo-pulse" />

        <path
          d="M28 38 L60 86 L92 38"
          stroke="url(#vyntaro-core)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M35 72 C44 61, 58 56, 71 48 C79 43, 84 35, 89 28"
          stroke="url(#vyntaro-core)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.9"
        />

        <circle cx="89" cy="28" r="5" fill="#5EEAD4" />
        <circle cx="89" cy="28" r="10" fill="#22D3EE" opacity="0.25" />

        <rect x="42" y="52" width="8" height="20" rx="4" fill="#38BDF8" opacity="0.65" />
        <rect x="54" y="45" width="8" height="27" rx="4" fill="#22D3EE" opacity="0.75" />
        <rect x="66" y="38" width="8" height="34" rx="4" fill="#A78BFA" opacity="0.85" />
      </g>
    </svg>
  )
}
