import type { TagCategory, Party } from "@/types/party";

/**
 * Farbwelt pro Kategorie – gibt jeder Party-Art einen eigenen Charakter.
 * Alle Töne liegen bewusst auf der Achse Pink → Blau:
 * Pink · Magenta/Fuchsia · Violett · Indigo/Blau.
 */
export type CategoryTheme = {
  label: string;
  emoji: string;
  /** Verlauf für Cover-Flächen */
  gradient: string;
  /** Farbe für Chips, Ringe, Glows */
  accent: string;
  chip: string;
  glow: string;
};

export const CATEGORY_THEMES: Record<TagCategory, CategoryTheme> = {
  mottoparty: {
    label: "Mottoparty",
    emoji: "🎭",
    gradient: "from-pink-500/75 via-pink-400/45 to-fuchsia-600/60",
    accent: "#ff4d97",
    chip: "border-pink-400/30 bg-pink-400/12 text-pink-100",
    glow: "shadow-[0_18px_50px_-20px_rgba(255,77,151,0.8)]",
  },
  musik: {
    label: "Musik",
    emoji: "🎧",
    gradient: "from-blue-500/75 via-blue-400/45 to-indigo-600/60",
    accent: "#5b9dff",
    chip: "border-blue-300/30 bg-blue-300/12 text-blue-100",
    glow: "shadow-[0_18px_50px_-20px_rgba(91,157,255,0.75)]",
  },
  aktivitaet: {
    label: "Aktivität",
    emoji: "🎲",
    gradient: "from-violet-500/75 via-purple-400/40 to-indigo-600/60",
    accent: "#a78bfa",
    chip: "border-violet-300/30 bg-violet-300/12 text-violet-100",
    glow: "shadow-[0_18px_50px_-20px_rgba(167,139,250,0.75)]",
  },
  sonstiges: {
    label: "Sonstiges",
    emoji: "✨",
    gradient: "from-fuchsia-500/75 via-purple-400/40 to-blue-600/60",
    accent: "#e879f9",
    chip: "border-fuchsia-300/30 bg-fuchsia-300/12 text-fuchsia-100",
    glow: "shadow-[0_18px_50px_-20px_rgba(232,121,249,0.75)]",
  },
};

/** Fällt auf "sonstiges" zurück, wenn eine Party (noch) keine Tags hat. */
export function partyTheme(party: Pick<Party, "tags">): CategoryTheme {
  const category = party.tags[0]?.category ?? "sonstiges";
  return CATEGORY_THEMES[category] ?? CATEGORY_THEMES.sonstiges;
}

export const CATEGORY_ORDER: TagCategory[] = [
  "mottoparty",
  "sonstiges",
  "aktivitaet",
  "musik",
];
