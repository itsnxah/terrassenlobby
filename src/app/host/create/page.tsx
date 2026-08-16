"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_ORDER, CATEGORY_THEMES } from "@/lib/categories";
import { fuzzCoordinates, geocodeAddress } from "@/lib/geo";
import type {
  AgeRating,
  AlcoholStatus,
  ApprovalMode,
  PartyStatus,
  TagCategory,
} from "@/types/party";

/** Übliche Party-Kategorien – Vorauswahl, daneben bleibt "Sonstiges" frei. */
const TAG_OPTIONS: { category: TagCategory; label: string }[] = [
  { category: "mottoparty", label: "Kostümparty" },
  { category: "mottoparty", label: "Karneval/Fasching" },
  { category: "mottoparty", label: "80er/90er-Party" },
  { category: "mottoparty", label: "Neon/Blacklight" },
  { category: "mottoparty", label: "Halloween" },
  { category: "mottoparty", label: "Weihnachtsfeier" },
  { category: "mottoparty", label: "Geburtstag" },
  { category: "mottoparty", label: "Abschlussparty" },
  { category: "mottoparty", label: "Junggesellen(innen)abschied" },
  { category: "mottoparty", label: "Pool-/Gartenparty" },
  { category: "musik", label: "Techno/House" },
  { category: "musik", label: "Hip-Hop" },
  { category: "musik", label: "Charts/Mainstream" },
  { category: "musik", label: "Rock/Metal" },
  { category: "musik", label: "Karaoke" },
  { category: "musik", label: "Live-Band" },
  { category: "musik", label: "Vinyl-Abend" },
  { category: "aktivitaet", label: "Spieleabend" },
  { category: "aktivitaet", label: "Grillen/BBQ" },
  { category: "aktivitaet", label: "Filmabend" },
  { category: "aktivitaet", label: "Sport schauen" },
  { category: "aktivitaet", label: "Kochabend" },
  { category: "aktivitaet", label: "Lagerfeuer" },
  { category: "aktivitaet", label: "Trinkspiele" },
  { category: "aktivitaet", label: "Casino-Nacht" },
  { category: "sonstiges", label: "WG-Party" },
];

const CUSTOM_OPTION_VALUE = "__custom__";

/** Radius des verschwommenen Umkreises auf der Karte. */
const RADIUS_METERS = 400;

/** Maximale Dateigröße je Foto. */
const MAX_PHOTO_MB = 5;

type SelectedTag = { category: TagCategory; label: string };

export default function CreatePartyPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PartyStatus>("planned");
  const [ageRating, setAgeRating] = useState<AgeRating>("18+");
  const [alcoholStatus, setAlcoholStatus] = useState<AlcoholStatus>("provided");
  const [approvalMode, setApprovalMode] = useState<ApprovalMode>("manual");
  const [startCapacity, setStartCapacity] = useState(5);
  const [limitGuests, setLimitGuests] = useState(false);
  const [maxGuests, setMaxGuests] = useState(20);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [startsAt, setStartsAt] = useState("");
  const [exactAddress, setExactAddress] = useState("");

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [selectedTags, setSelectedTags] = useState<SelectedTag[]>([]);
  const [tagPickerValue, setTagPickerValue] = useState("");
  const [customTagLabel, setCustomTagLabel] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
      setCheckingAuth(false);
    });
  }, [supabase]);

  function addPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => {
      if (!f.type.startsWith("image/")) return false;
      if (f.size > MAX_PHOTO_MB * 1024 * 1024) {
        setErrorMsg(`"${f.name}" ist größer als ${MAX_PHOTO_MB} MB.`);
        return false;
      }
      return true;
    });

    setPhotos((prev) => [...prev, ...files]);
    setPhotoPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function addTag(tag: SelectedTag) {
    setSelectedTags((prev) =>
      prev.some((t) => t.label === tag.label) ? prev : [...prev, tag],
    );
  }

  function removeTag(label: string) {
    setSelectedTags((prev) => prev.filter((t) => t.label !== label));
  }

  function handleTagPickerChange(value: string) {
    setTagPickerValue(value);

    if (value === CUSTOM_OPTION_VALUE || value === "") {
      return;
    }

    const option = TAG_OPTIONS.find((t) => t.label === value);
    if (option) {
      addTag(option);
    }
    setTagPickerValue("");
  }

  function handleAddCustomTag() {
    const label = customTagLabel.trim();
    if (!label) return;
    addTag({ category: "sonstiges", label });
    setCustomTagLabel("");
    setTagPickerValue("");
  }

  async function resolveTagIds(tags: SelectedTag[]): Promise<string[]> {
    if (tags.length === 0) return [];

    const labels = tags.map((t) => t.label);
    const { data: existing } = await supabase
      .from("tags")
      .select("id, label")
      .in("label", labels);

    const existingLabels = new Set((existing ?? []).map((t) => t.label));
    const missing = tags.filter((t) => !existingLabels.has(t.label));

    let inserted: { id: string; label: string }[] = [];
    if (missing.length > 0) {
      const { data } = await supabase
        .from("tags")
        .insert(missing.map((t) => ({ category: t.category, label: t.label })))
        .select("id, label");
      inserted = data ?? [];
    }

    return [...(existing ?? []), ...inserted].map((t) => t.id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErrorMsg("Bitte zuerst einloggen.");
      setSubmitting(false);
      return;
    }

    if (status === "planned" && !startsAt) {
      setErrorMsg("Bitte Datum & Uhrzeit für die geplante Party angeben.");
      setSubmitting(false);
      return;
    }

    if (limitGuests && maxGuests < startCapacity) {
      setErrorMsg(
        "Die Obergrenze darf nicht kleiner sein als deine Startkapazität.",
      );
      setSubmitting(false);
      return;
    }

    // Adresse in Koordinaten übersetzen und anschließend absichtlich
    // verschieben, damit der Kartenkreis nicht auf der Haustür zentriert ist.
    const geo = await geocodeAddress(exactAddress.trim());
    if (!geo) {
      setErrorMsg(
        "Die Adresse konnte nicht gefunden werden. Bitte Straße, Hausnummer, PLZ und Ort prüfen.",
      );
      setSubmitting(false);
      return;
    }
    const fuzzed = fuzzCoordinates(geo.lat, geo.lng, RADIUS_METERS);

    const { data: party, error } = await supabase
      .from("parties")
      .insert({
        host_id: user.id,
        title,
        description,
        visibility,
        status,
        age_rating: ageRating,
        alcohol_status: alcoholStatus,
        approval_mode: approvalMode,
        start_capacity: startCapacity,
        max_guests: limitGuests ? maxGuests : null,
        starts_at:
          status === "live" ? new Date().toISOString() : new Date(startsAt).toISOString(),
        approx_lat: fuzzed.lat,
        approx_lng: fuzzed.lng,
        approx_radius_meters: RADIUS_METERS,
        // Private Partys brauchen einen Token, sonst käme niemand hinein
        private_invite_token:
          visibility === "private" ? crypto.randomUUID() : null,
      })
      .select()
      .single();

    if (error || !party) {
      setErrorMsg(error?.message ?? "Unbekannter Fehler beim Erstellen.");
      setSubmitting(false);
      return;
    }

    // Genaue Adresse getrennt speichern – sichtbar nur für Host + akzeptierte
    // Gäste (siehe supabase/party_addresses.sql).
    if (exactAddress.trim()) {
      await supabase
        .from("party_addresses")
        .insert({ party_id: party.id, exact_address: exactAddress.trim() });
    }

    if (selectedTags.length > 0) {
      const tagIds = await resolveTagIds(selectedTags);
      if (tagIds.length > 0) {
        // Fehler hier nicht verschlucken – sonst verschwinden die gewählten
        // Kategorien stillschweigend und niemand merkt es.
        const { error: tagError } = await supabase.from("party_tags").insert(
          tagIds.map((tagId) => ({ party_id: party.id, tag_id: tagId })),
        );
        if (tagError) {
          setErrorMsg(
            `Die Party wurde angelegt, aber die Kategorien konnten nicht gespeichert werden: ${tagError.message}`,
          );
          setSubmitting(false);
          return;
        }
      }
    }

    // Fotos hochladen – geht erst jetzt, weil die Zugriffsrechte im Speicher
    // am Ordnernamen <party_id>/… hängen.
    for (const file of photos) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${party.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("party-photos")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) continue; // einzelnes Bild überspringen, Party bleibt bestehen

      const {
        data: { publicUrl },
      } = supabase.storage.from("party-photos").getPublicUrl(path);

      await supabase
        .from("party_photos")
        .insert({ party_id: party.id, url: publicUrl, uploaded_by: user.id });
    }

    setSubmitting(false);
    router.push(`/party/${party.id}`);
  }

  if (checkingAuth) {
    return <div className="h-64 animate-pulse rounded-card bg-white/[0.04]" />;
  }

  if (!isLoggedIn) {
    return (
      <div className="glass glass-sheen relative flex flex-col items-center gap-4 p-10 text-center">
        <span className="animate-floaty text-5xl">🎪</span>
        <div>
          <p className="text-lg font-bold">Erst anmelden, dann feiern</p>
          <p className="mt-1 text-sm text-white/50">
            Zum Erstellen einer Lobby brauchst du einen Account.
          </p>
        </div>
        <Link href="/login?next=/host/create" className="btn-primary">
          Einloggen
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="animate-riseIn">
        <h1 className="text-[2rem] font-bold leading-tight tracking-tight">
          Neue{" "}
          <span className="bg-gradient-to-r from-lobby-accent to-lobby-accent2 bg-clip-text text-transparent">
            Lobby
          </span>{" "}
          öffnen
        </h1>
        <p className="mt-1.5 text-sm text-white/50">
          Ein paar Angaben – und deine Party taucht im Feed auf.
        </p>
      </div>

      {/* --- Status --------------------------------------------------- */}
      <section className="glass glass-sheen relative space-y-3 p-5">
        <label className="label mb-0">Wann geht es los?</label>
        <div className="segment">
          <button
            type="button"
            data-active={status === "live"}
            onClick={() => setStatus("live")}
            className="segment-item"
          >
            <span className="mr-1.5">🔴</span> Läuft gerade
          </button>
          <button
            type="button"
            data-active={status === "planned"}
            onClick={() => setStatus("planned")}
            className="segment-item"
          >
            <span className="mr-1.5">📅</span> Geplant
          </button>
        </div>

        {status === "planned" && (
          <div className="animate-riseIn pt-1">
            <label className="label">Start (Datum & Uhrzeit)</label>
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="field [color-scheme:dark]"
            />
          </div>
        )}
      </section>

      {/* --- Basics --------------------------------------------------- */}
      <section className="glass glass-sheen relative space-y-5 p-5">
        <div>
          <label className="label">Titel</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field"
            placeholder="z. B. Dachterrassen-Warmup"
          />
        </div>

        <div>
          <label className="label">Beschreibung</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="field resize-none"
            placeholder="Was erwartet die Gäste? Musik, Motto, Stimmung…"
          />
        </div>

        <div>
          <label className="label">Genaue Adresse</label>
          <input
            required
            value={exactAddress}
            onChange={(e) => setExactAddress(e.target.value)}
            placeholder="Musterstraße 12, 12345 Berlin"
            className="field"
          />
          <p className="hint">
            🔒 Sichtbar nur für dich und Gäste mit angenommener Anfrage. Aus
            der Adresse berechnen wir die Position auf der Karte – der Kreis
            wird dabei bewusst versetzt, damit niemand aus der Kreismitte auf
            deine Haustür schließen kann.
          </p>
        </div>
      </section>

      {/* --- Einstellungen -------------------------------------------- */}
      <section className="glass glass-sheen relative grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
        <div>
          <label className="label">Altersfreigabe</label>
          <select
            value={ageRating}
            onChange={(e) => setAgeRating(e.target.value as AgeRating)}
            className="field"
          >
            <option value="16+">16+</option>
            <option value="18+">18+</option>
          </select>
        </div>

        <div>
          <label className="label">Sichtbarkeit</label>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as "public" | "private")}
            className="field"
          >
            <option value="public">Öffentlich</option>
            <option value="private">Privat (nur per Link)</option>
          </select>
        </div>

        <div>
          <label className="label">Alkohol</label>
          <select
            value={alcoholStatus}
            onChange={(e) => setAlcoholStatus(e.target.value as AlcoholStatus)}
            className="field"
          >
            <option value="provided">Gratis vorhanden</option>
            <option value="byo">Gäste bringen mit</option>
          </select>
        </div>

        <div>
          <label className="label">Freigabe-Modus</label>
          <select
            value={approvalMode}
            onChange={(e) => setApprovalMode(e.target.value as ApprovalMode)}
            className="field"
          >
            <option value="manual">Manuell bestätigen</option>
            <option value="automatic">Automatisch</option>
          </select>
        </div>
      </section>

      {/* --- Gästezahl ------------------------------------------------- */}
      <section className="glass glass-sheen relative p-5">
        <label className="label">Startkapazität</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setStartCapacity((n) => Math.max(1, n - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
            aria-label="Weniger"
          >
            −
          </button>
          <div className="flex-1 text-center">
            <span className="text-3xl font-bold tabular-nums">{startCapacity}</span>
            <span className="ml-2 text-sm text-white/[0.45]">Gäste zum Start</span>
          </div>
          <button
            type="button"
            onClick={() => setStartCapacity((n) => n + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
            aria-label="Mehr"
          >
            +
          </button>
        </div>
        <p className="hint">
          Deine eigene Schätzung. Gäste, die später über die App beitreten,
          werden getrennt gezählt – nicht mit dieser Zahl vermischt.
        </p>

        <div className="mt-5 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => setLimitGuests((v) => !v)}
            className="flex w-full items-center gap-3 text-left"
          >
            <span
              className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition ${
                limitGuests ? "bg-lobby-pink" : "bg-white/[0.12]"
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white transition-transform ${
                  limitGuests ? "translate-x-5" : ""
                }`}
              />
            </span>
            <span>
              <span className="block text-sm font-medium">Obergrenze festlegen</span>
              <span className="block text-xs text-white/40">
                Wie bei einem Spiele-Server: Ist die Lobby voll, sind keine
                Anfragen mehr möglich.
              </span>
            </span>
          </button>

          {limitGuests && (
            <div className="mt-4 flex animate-riseIn items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setMaxGuests((n) => Math.max(startCapacity, n - 5))
                }
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
                aria-label="Weniger"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <span className="text-3xl font-bold tabular-nums">{maxGuests}</span>
                <span className="ml-2 text-sm text-white/[0.45]">Plätze gesamt</span>
              </div>
              <button
                type="button"
                onClick={() => setMaxGuests((n) => n + 5)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.05] text-lg font-bold text-white/80 transition hover:bg-white/[0.1] active:scale-95"
                aria-label="Mehr"
              >
                +
              </button>
            </div>
          )}
        </div>
      </section>

      {/* --- Fotos ------------------------------------------------------ */}
      <section className="glass glass-sheen relative space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <label className="label mb-0">Fotos</label>
            <p className="mt-1 text-xs text-white/40">
              Das erste Bild wird zum Titelbild im Feed. Später jederzeit
              änderbar.
            </p>
          </div>
          <label className="btn-ghost shrink-0 cursor-pointer py-2.5 text-sm">
            + Auswählen
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={addPhotos}
              className="hidden"
            />
          </label>
        </div>

        {photoPreviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] p-6 text-center">
            <span className="text-2xl">🖼️</span>
            <p className="mt-2 text-xs text-white/40">
              Noch keine Fotos ausgewählt (optional, max. {MAX_PHOTO_MB} MB pro Bild)
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photoPreviews.map((src, i) => (
              <div
                key={src}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-black/60 px-2 py-0.5 text-2xs font-semibold backdrop-blur-md">
                    Titelbild
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  aria-label="Foto entfernen"
                  className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white/80 backdrop-blur-md transition hover:bg-black/80 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* --- Tags ------------------------------------------------------ */}
      <section className="glass glass-sheen relative space-y-4 p-5">
        <div>
          <label className="label mb-0">Kategorien</label>
          <p className="mt-1 text-xs text-white/40">
            Gibt deiner Lobby im Feed Farbe und macht sie auffindbar.
          </p>
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => {
              const t = CATEGORY_THEMES[tag.category] ?? CATEGORY_THEMES.sonstiges;
              return (
                <span key={tag.label} className={`chip ${t.chip}`}>
                  <span>{t.emoji}</span>
                  {tag.label}
                  <button
                    type="button"
                    onClick={() => removeTag(tag.label)}
                    className="ml-0.5 opacity-50 transition hover:opacity-100"
                    aria-label={`${tag.label} entfernen`}
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <select
          value={tagPickerValue}
          onChange={(e) => handleTagPickerChange(e.target.value)}
          className="field"
        >
          <option value="">Kategorie hinzufügen…</option>
          {CATEGORY_ORDER.map((category) => {
            const options = TAG_OPTIONS.filter(
              (opt) =>
                opt.category === category &&
                !selectedTags.some((t) => t.label === opt.label),
            );
            if (options.length === 0) return null;
            return (
              <optgroup
                key={category}
                label={`${CATEGORY_THEMES[category].emoji} ${CATEGORY_THEMES[category].label}`}
              >
                {options.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            );
          })}
          <option value={CUSTOM_OPTION_VALUE}>✨ Sonstiges (eigene Kategorie)…</option>
        </select>

        {tagPickerValue === CUSTOM_OPTION_VALUE && (
          <div className="flex animate-riseIn gap-2">
            <input
              value={customTagLabel}
              onChange={(e) => setCustomTagLabel(e.target.value)}
              placeholder="Eigene Kategorie eingeben"
              className="field flex-1"
            />
            <button type="button" onClick={handleAddCustomTag} className="btn-ghost">
              Hinzufügen
            </button>
          </div>
        )}
      </section>

      {errorMsg && (
        <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
          {errorMsg}
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting
          ? photos.length > 0
            ? "Wird angelegt, Fotos werden hochgeladen…"
            : "Adresse wird geprüft…"
          : "Lobby veröffentlichen"}
      </button>
    </form>
  );
}
