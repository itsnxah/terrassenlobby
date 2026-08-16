"use client";

import { useState } from "react";

function Star({ filled, half = false }: { filled: boolean; half?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full">
      <defs>
        {half && (
          <linearGradient id="halfStar">
            <stop offset="50%" stopColor="#ffb648" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.18)" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M12 2.6l2.9 5.88 6.5.95-4.7 4.58 1.11 6.46L12 17.42 6.19 20.47l1.11-6.46-4.7-4.58 6.5-.95z"
        fill={half ? "url(#halfStar)" : filled ? "#ffb648" : "rgba(255,255,255,0.18)"}
      />
    </svg>
  );
}

/** Reine Anzeige: Sterne + Durchschnitt + Anzahl. */
export function RatingDisplay({
  average,
  count,
  size = "sm",
  label,
}: {
  average: number | null;
  count: number;
  size?: "sm" | "lg";
  label?: string;
}) {
  if (!average || count === 0) {
    return (
      <span className="text-2xs text-white/30">
        {label ? `${label}: ` : ""}noch keine Bewertungen
      </span>
    );
  }

  const box = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={box}>
            <Star
              filled={average >= i}
              half={average >= i - 0.5 && average < i}
            />
          </span>
        ))}
      </span>
      <span
        className={
          size === "lg"
            ? "text-sm font-semibold text-white"
            : "text-2xs font-medium text-white/70"
        }
      >
        {average.toFixed(1)}
      </span>
      <span className="text-2xs text-white/35">({count})</span>
    </span>
  );
}

/** Eingabe: Sterne anklicken. */
export function StarInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          aria-label={`${i} von 5 Sternen`}
          className="h-9 w-9 transition hover:scale-110 active:scale-95 disabled:opacity-50"
        >
          <Star filled={shown >= i} />
        </button>
      ))}
    </div>
  );
}
