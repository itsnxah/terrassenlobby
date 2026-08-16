/**
 * Terrassenlobby-Bildmarke (Variante F): Standort-Pin, dessen Kopf eine
 * Discokugel ist, plus Lichtstrahlen nach außen.
 *
 * variant="white"    – einfarbig weiß, für farbige Kacheln/Hintergründe
 * variant="gradient" – im Pink-Blau-Verlauf, für dunkle Flächen
 */
export function LogoMark({
  className = "h-6 w-6",
  variant = "white",
  gradientId = "tlLogoGradient",
}: {
  className?: string;
  variant?: "white" | "gradient";
  gradientId?: string;
}) {
  const stroke = variant === "gradient" ? `url(#${gradientId})` : "#fff";

  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        {variant === "gradient" && (
          <linearGradient
            id={gradientId}
            x1="4"
            y1="6"
            x2="60"
            y2="58"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ff4d97" />
            <stop offset="0.5" stopColor="#b06bff" />
            <stop offset="1" stopColor="#5b9dff" />
          </linearGradient>
        )}
        <clipPath id={`${gradientId}-ball`}>
          <circle cx="32" cy="26" r="9" />
        </clipPath>
      </defs>

      {/* Pin */}
      <path
        d="M32 8c9.94 0 18 8.06 18 18 0 12-18 30-18 30S14 38 14 26c0-9.94 8.06-18 18-18z"
        stroke={stroke}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      {/* Discokugel */}
      <circle cx="32" cy="26" r="9" stroke={stroke} strokeWidth={3.4} />
      <g clipPath={`url(#${gradientId}-ball)`} stroke={stroke} strokeWidth={2.6}>
        <path d="M32 15v22M22 22h20M22 30h20" />
      </g>
      {/* Lichtstrahlen */}
      <g stroke={stroke} strokeWidth={3.4} strokeLinecap="round" opacity={0.8}>
        <path d="M11.2 14 6.9 11.5M52.8 14l4.3-2.5M8 26H3.5M56 26h4.5" />
      </g>
    </svg>
  );
}
