import Link from "next/link";
import { ANGABEN_UNVOLLSTAENDIG, STAND } from "@/lib/legal";

/**
 * Gemeinsames Layout für Rechtstexte (Impressum, Datenschutz, AGB).
 * Bewusst schlicht gehalten – Lesbarkeit vor Effekten.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 transition hover:text-white"
      >
        ← Zurück
      </Link>

      <header>
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">{title}</h1>
        {intro && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">{intro}</p>
        )}
        <p className="mt-2 text-2xs uppercase tracking-wider text-white/30">
          Stand: {STAND}
        </p>
      </header>

      {/* Der Hinweis verschwindet automatisch, sobald in src/lib/legal.ts
          keine Platzhalter mehr stehen. */}
      {ANGABEN_UNVOLLSTAENDIG && (
        <div className="glass-soft border-pink-400/25 bg-pink-500/[0.08] p-4 text-xs leading-relaxed text-pink-100/90">
          <strong className="font-semibold">Anbieterangaben unvollständig.</strong>{" "}
          Name und Anschrift des Betreibers sind noch nicht eingetragen. Solange
          das so ist, erfüllt diese Seite die Impressumspflicht nicht – bitte vor
          der Weitergabe an Fremde in <code>src/lib/legal.ts</code> ergänzen.
        </div>
      )}

      <article className="glass glass-sheen relative space-y-5 p-6">{children}</article>

      <p className="text-xs leading-relaxed text-white/30">
        Diese Texte sind mit Sorgfalt auf den tatsächlichen Funktionsumfang der
        App zugeschnitten, ersetzen aber keine Rechtsberatung. Wer die Plattform
        dauerhaft oder gewerblich betreibt, sollte sie einmal anwaltlich prüfen
        lassen.
      </p>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="pt-2 text-base font-bold tracking-tight text-white first:pt-0">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-white/65">{children}</p>;
}

export function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="flex gap-2.5 text-sm leading-relaxed text-white/65"
        >
          <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full bg-lobby-violet" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
