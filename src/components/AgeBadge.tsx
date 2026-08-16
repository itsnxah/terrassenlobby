import type { AgeRating } from "@/types/party";

/**
 * Altersfreigabe-Badge: 18+ blau, 16+ pink –
 * beide Töne liegen auf der Pink-Blau-Achse der Palette.
 */
export function AgeBadge({ rating }: { rating: AgeRating }) {
  const isAdult = rating === "18+";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-2xs font-bold tracking-wide backdrop-blur-md ${
        isAdult
          ? "border-blue-300/45 bg-blue-400/25 text-blue-50"
          : "border-pink-300/45 bg-pink-400/25 text-pink-50"
      }`}
    >
      {rating}
    </span>
  );
}

export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-lobby-pink/50 bg-lobby-pink/25 px-2.5 py-1 text-2xs font-bold uppercase tracking-wider text-white backdrop-blur-md">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-lobby-pink" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-lobby-pink" />
      </span>
      Live
    </span>
  );
}
