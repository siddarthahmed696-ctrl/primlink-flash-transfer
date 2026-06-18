type Props = { className?: string; size?: number };

export function UTransferLogo({ className, size = 32 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="V Move You"
    >
      <defs>
        <linearGradient id="utg" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.7 0.27 25)" />
          <stop offset="100%" stopColor="oklch(0.5 0.22 20)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#utg)" />
      <path
        d="M14 14v14a10 10 0 0 0 20 0V14"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M30 18l6 -6m0 0v5m0 -5h-5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
