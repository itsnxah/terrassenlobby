"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Löscht alle eigenen Lobbys auf einmal – praktisch zum Aufräumen nach
 * Testläufen. Betrifft ausschließlich die eigenen Partys; fremde bleiben
 * unangetastet (die Zugriffsregeln lassen nichts anderes zu).
 */
export function DeleteAllParties({ count }: { count: number }) {
  const supabase = createClient();
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function deleteAll() {
    setBusy(true);
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Erst die Bilddateien der eigenen Partys räumen
    const { data: own } = await supabase
      .from("parties")
      .select("id")
      .eq("host_id", user.id);

    for (const p of own ?? []) {
      const { data: files } = await supabase.storage.from("party-photos").list(p.id);
      if (files && files.length > 0) {
        await supabase.storage
          .from("party-photos")
          .remove(files.map((f) => `${p.id}/${f.name}`));
      }
    }

    const { error } = await supabase.from("parties").delete().eq("host_id", user.id);

    setBusy(false);
    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setConfirming(false);
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="mt-2 text-xs text-white/30 underline-offset-4 transition hover:text-pink-200 hover:underline"
      >
        Alle meine Lobbys löschen
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-3 rounded-2xl border border-pink-400/40 bg-pink-500/[0.08] p-4">
      <p className="text-sm font-semibold">
        Wirklich alle {count} {count === 1 ? "Lobby" : "Lobbys"} löschen?
      </p>
      <p className="text-xs leading-relaxed text-white/60">
        Partys, Fotos, Adressen, Anfragen und Bewertungen werden endgültig
        entfernt. Dein Account bleibt bestehen.
      </p>

      {errorMsg && <p className="text-xs text-pink-200">{errorMsg}</p>}

      <div className="flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          disabled={busy}
          className="btn-ghost flex-1 py-2.5 text-sm"
        >
          Abbrechen
        </button>
        <button
          onClick={deleteAll}
          disabled={busy}
          className="flex-1 rounded-2xl bg-lobby-pink py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {busy ? "Wird gelöscht…" : "Alle löschen"}
        </button>
      </div>
    </div>
  );
}
