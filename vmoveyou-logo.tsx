type Props = { className?: string; size?: number };

export function UTransferLogo({ className, size = 32 }: Props) {
  return (
    <div className={className} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
        style={{ flex: "0 0 auto" }}
      >
        <path
          d="M18 44c-6.6 0-12-5.2-12-11.5S11.4 21 18.4 21c1.2-7.2 7.5-12.8 15.1-12.8 7.1 0 13 4.8 14.7 11.2h1.3c6.3 0 11.5 4.9 11.5 11s-5.2 11-11.5 11H18z"
          stroke="#2F6BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M25 25h14v18H25z"
          fill="#fff"
          stroke="#2F6BFF"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M32 30v8" stroke="#2F6BFF" strokeWidth="2.5" strokeLinecap="round" />
        <path
          d="M28.5 33.5 32 30l3.5 3.5"
          stroke="#2F6BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37.5 38.5 32 44l-5.5-5.5"
          stroke="#2F6BFF"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M12 32h6" stroke="#2F6BFF" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M10 28.5h4" stroke="#2F6BFF" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M10 35.5h4" stroke="#2F6BFF" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#2F6BFF" }}>v move you</div>
        <div style={{ fontSize: 10, letterSpacing: 1.2, fontWeight: 700, color: "#4B5563" }}>
          WORLDWIDE. FAST. SECURE.
        </div>
      </div>
    </div>
  );
}
