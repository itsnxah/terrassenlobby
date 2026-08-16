"use client";

import { useState } from "react";

/**
 * "Freund informieren": Der Gast schickt Adresse und geplante Rückkehrzeit
 * aktiv an eine Vertrauensperson – ohne Account für den Empfänger und ohne
 * dauerhaftes Tracking. Die Daten verlassen das Gerät nur, wenn der Gast
 * selbst auf Teilen tippt.
 */
export function FriendNotify({
  partyTitle,
  address,
}: {
  partyTitle: string;
  address: string;
}) {
  const [open, setOpen] = useState(false);
  const [returnTime, setReturnTime] = useState("");
  const [copied, setCopied] = useState(false);

  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const message =
    `Hey! Ich bin heute auf einer Party über Terrassenlobby:\n\n` +
    `📍 ${partyTitle}\n${address}\n${mapsLink}\n\n` +
    (returnTime
      ? `🕐 Ich bin voraussichtlich gegen ${returnTime} Uhr zurück.\n\n`
      : "") +
    `Wenn du bis dahin nichts von mir hörst, meld dich bitte bei mir.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Wo ich heute bin", text: message });
      } catch {
        /* Nutzer hat abgebrochen – nichts zu tun */
      }
    } else {
      copy();
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="glass glass-sheen relative flex w-full items-center gap-4 p-5 text-left transition hover:border-white/20"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lobby-violet to-lobby-blue text-lg">
          🛟
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">Freund*in informieren</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-white/45">
            Schick Adresse und Rückkehrzeit an eine Person deines Vertrauens.
          </span>
        </span>
        <span className="ml-auto text-white/30">→</span>
      </button>
    );
  }

  return (
    <div className="glass glass-sheen relative space-y-4 p-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Freund*in informieren</h2>
        <p className="mt-1 text-sm leading-relaxed text-white/50">
          Nur du löst das aus – wir speichern weder den Kontakt noch verfolgen
          wir deinen Weg.
        </p>
      </div>

      <div>
        <label className="label">Wann bist du voraussichtlich zurück?</label>
        <input
          type="time"
          value={returnTime}
          onChange={(e) => setReturnTime(e.target.value)}
          className="field [color-scheme:dark] w-40"
        />
      </div>

      <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-2xl bg-white/[0.04] p-4 font-sans text-xs leading-relaxed text-white/70">
        {message}
      </pre>

      <div className="grid grid-cols-2 gap-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(message)}`}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost justify-center py-2.5 text-sm"
        >
          WhatsApp
        </a>
        <a
          href={`sms:?&body=${encodeURIComponent(message)}`}
          className="btn-ghost justify-center py-2.5 text-sm"
        >
          SMS
        </a>
        <a
          href={`mailto:?subject=${encodeURIComponent("Wo ich heute bin")}&body=${encodeURIComponent(message)}`}
          className="btn-ghost justify-center py-2.5 text-sm"
        >
          E-Mail
        </a>
        <button onClick={copy} className="btn-ghost justify-center py-2.5 text-sm">
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>

      <button onClick={share} className="btn-primary w-full">
        Teilen
      </button>

      <button
        onClick={() => setOpen(false)}
        className="w-full text-center text-xs text-white/35 transition hover:text-white/60"
      >
        Schließen
      </button>
    </div>
  );
}
