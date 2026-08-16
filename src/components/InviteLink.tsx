"use client";

import { useState } from "react";

/**
 * Einladungslink für private Partys.
 * Ohne diesen Link kommt niemand an eine private Party heran – sie taucht
 * weder im Feed noch auf der Karte auf.
 */
export function InviteLink({ partyId, token }: { partyId: string; token: string }) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/party/${partyId}?token=${token}`
      : `/party/${partyId}?token=${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="glass glass-sheen relative space-y-3 p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-lg">
          🔗
        </span>
        <div className="min-w-0">
          <h2 className="font-bold tracking-tight">Einladungslink</h2>
          <p className="text-xs text-white/45">
            Diese Party ist privat – nur wer den Link hat, sieht sie.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.currentTarget.select()}
          className="field flex-1 text-xs"
        />
        <button onClick={copy} className="btn-ghost shrink-0 py-2.5 text-sm">
          {copied ? "Kopiert ✓" : "Kopieren"}
        </button>
      </div>
    </section>
  );
}
