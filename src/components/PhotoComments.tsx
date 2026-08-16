"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  author: { display_name: string | null } | null;
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const h = Math.round(min / 60);
  if (h < 24) return `vor ${h} Std.`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

/**
 * Kommentare zu einem einzelnen Foto.
 *
 * Lesen dürfen alle, die die Party sehen dürfen (siehe
 * supabase/fotokommentare.sql). Schreiben nur der Host oder wer nachweislich
 * eingecheckt ist – das entscheidet die Datenbank, "canComment" hier steuert
 * nur, ob überhaupt ein Eingabefeld angezeigt wird.
 */
export function PhotoComments({
  photoId,
  canComment,
}: {
  photoId: string;
  canComment: boolean;
}) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("photo_comments")
      .select("id, body, created_at, author_id, author:profiles ( display_name )")
      .eq("photo_id", photoId)
      .order("created_at", { ascending: true });

    setComments((data ?? []) as unknown as Comment[]);
    setLoading(false);
  }, [photoId, supabase]);

  useEffect(() => {
    load();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [load, supabase]);

  async function submit() {
    const body = text.trim();
    if (!body) return;

    setBusy(true);
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Bitte zuerst einloggen.");
      setBusy(false);
      return;
    }

    const { error } = await supabase
      .from("photo_comments")
      .insert({ photo_id: photoId, author_id: user.id, body });

    setBusy(false);

    if (error) {
      setErrorMsg(
        "Kommentar konnte nicht gespeichert werden – nur wer gerade auf der Party eingecheckt ist (oder der Host), darf kommentieren.",
      );
      return;
    }

    setText("");
    load();
  }

  async function remove(id: string) {
    await supabase.from("photo_comments").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-white/35">Kommentare laden…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-white/35">Noch keine Kommentare zu diesem Foto.</p>
      ) : (
        <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-2xs font-bold">
                {(c.author?.display_name ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-relaxed text-white/80">
                  <span className="font-semibold text-white/95">
                    {c.author?.display_name ?? "Jemand"}
                  </span>{" "}
                  {c.body}
                </p>
                <p className="mt-0.5 text-2xs text-white/30">{timeAgo(c.created_at)}</p>
              </div>
              {c.author_id === userId && (
                <button
                  onClick={() => remove(c.id)}
                  aria-label="Kommentar löschen"
                  className="shrink-0 text-white/25 transition hover:text-pink-200"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {errorMsg && <p className="text-2xs leading-relaxed text-pink-200">{errorMsg}</p>}

      {canComment ? (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Kommentar schreiben…"
            className="field text-sm"
            maxLength={280}
          />
          <button
            onClick={submit}
            disabled={busy || !text.trim()}
            className="btn-ghost shrink-0 px-4 text-sm disabled:opacity-40"
          >
            Senden
          </button>
        </div>
      ) : (
        <p className="text-2xs text-white/30">
          Nur wer gerade eingecheckt ist, kann hier kommentieren.
        </p>
      )}
    </div>
  );
}
