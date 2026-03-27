// Logo MOUBARIK Parking - Icône parking personnalisée
export default function Logo({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
      <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
      <path d="M14 18h20v3H14z" fill="currentColor" opacity="0.9" />
      <path d="M16 21v9h3v-4h6v4h3v-9H16z" fill="currentColor" />
      <rect x="20" y="24" width="4" height="3" rx="0.5" fill="var(--bg-primary)" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-dim)" />
        </linearGradient>
      </defs>
    </svg>
  )
}
