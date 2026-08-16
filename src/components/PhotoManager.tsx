"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type PartyPhoto = { id: string; url: string };

const MAX_MB = 5;

/**
 * Fotoverwaltung für den Host einer Party: hochladen, ansehen, löschen.
 * Die Dateien liegen im Supabase-Bucket "party-photos" unter <party_id>/…,
 * die Zugriffsrechte hängen genau an diesem Ordnernamen (siehe fotos.sql).
 */
export function PhotoManager({
  partyId,
  initialPhotos,
}: {
  partyId: string;
  initialPhotos: PartyPhoto[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [photos, setPhotos] = useState(initialPhotos);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

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

    const added: PartyPhoto[] = [];

    for (const [i, file] of files.entries()) {
      setProgress(`Lade ${i + 1} von ${files.length} hoch…`);

      if (!file.type.startsWith("image/")) {
        setErrorMsg(`"${file.name}" ist kein Bild.`);
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setErrorMsg(`"${file.name}" ist größer als ${MAX_MB} MB.`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${partyId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("party-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setErrorMsg(uploadError.message);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("party-photos").getPublicUrl(path);

      const { data: row, error: insertError } = await supabase
        .from("party_photos")
        .insert({ party_id: partyId, url: publicUrl, uploaded_by: user.id })
        .select("id, url")
        .single();

      if (insertError) {
        setErrorMsg(insertError.message);
        continue;
      }
      if (row) added.push(row as PartyPhoto);
    }

    setPhotos((prev) => [...prev, ...added]);
    setProgress(null);
    setBusy(false);
    e.target.value = "";
    router.refresh();
  }

  async function removePhoto(photo: PartyPhoto) {
    setBusy(true);

    // Aus der Tabelle löschen …
    const { error } = await supabase.from("party_photos").delete().eq("id", photo.id);
    if (error) {
      setErrorMsg(error.message);
      setBusy(false);
      return;
    }

    // … und die Datei im Speicher gleich mit, sonst bleibt sie liegen.
    const marker = "/party-photos/";
    const path = photo.url.split(marker)[1];
    if (path) {
      await supabase.storage.from("party-photos").remove([decodeURIComponent(path)]);
    }

    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    setBusy(false);
    router.refresh();
  }

  return (
    <section className="glass glass-sheen relative space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Fotos</h2>
          <p className="mt-1 text-sm text-white/50">
            Das erste Bild wird zum Titelbild im Feed.
          </p>
        </div>
        <label className="btn-ghost shrink-0 cursor-pointer py-2.5 text-sm">
          {busy ? "Lädt…" : "+ Hinzufügen"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      {progress && <p className="text-xs text-white/45">{progress}</p>}

      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      {photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/12 p-8 text-center">
          <span className="text-3xl">🖼️</span>
          <p className="mt-2 text-sm text-white/45">
            Noch keine Fotos. Bilder machen Lust auf deine Party.
          </p>
          <p className="mt-1 text-2xs text-white/30">
            JPG oder PNG, maximal {MAX_MB} MB pro Bild.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-2xs font-semibold backdrop-blur-md">
                  Titelbild
                </span>
              )}
              <button
                onClick={() => removePhoto(photo)}
                disabled={busy}
                aria-label="Foto löschen"
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white/80 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
