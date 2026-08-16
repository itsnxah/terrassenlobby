import Link from "next/link";
import type { Party } from "@/types/party";
import { AgeBadge, LiveBadge } from "./AgeBadge";
import { CATEGORY_THEMES, partyTheme } from "@/lib/categories";
import { RatingDisplay } from "./StarRating";

function formatWhen(party: Party) {
  if (party.status === "live") return "Läuft gerade";

  const date = new Date(party.startsAt);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) return `Heute · ${time}`;
  if (isTomorrow) return `Morgen · ${time}`;

  return date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  }) + ` · ${time}`;
}

export function PartyCard({ party, index = 0 }: { party: Party; index?: number }) {
  const theme = partyTheme(party);
  const cover = party.coverPhotoUrl || party.photoUrls[0] || null;
  const total = party.startCapacity + party.joinedGuestsCount;
  const joinedShare = total > 0 ? (party.joinedGuestsCount / total) * 100 : 0;
  const isFull = party.maxGuests !== null && total >= party.maxGuests;

  return (
    <Link
      href={`/party/${party.id}`}
      style={{ animationDelay: `${index * 70}ms` }}
      className="group relative block animate-riseIn overflow-hidden rounded-card border border-white/10 bg-white/[0.04] shadow-glass backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      {/* Cover: Foto des Hosts, sonst die Farbwelt der Kategorie */}
      <div
        className={`relative h-36 overflow-hidden bg-gradient-to-br ${theme.gradient}`}
      >
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-ink-950/25" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_120%,rgba(255,255,255,0.35),transparent_55%)]" />
            <span className="absolute -bottom-6 right-3 select-none text-[6rem] leading-none opacity-25 transition-transform duration-500 group-hover:scale-110 group-hover:opacity-35">
              {theme.emoji}
            </span>
          </>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink-900/95 to-transparent" />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {party.status === "live" ? <LiveBadge /> : null}
          <AgeBadge rating={party.ageRating} />
          {isFull && (
            <span className="chip border-white/25 bg-black/50 text-white">Voll</span>
          )}
        </div>

        <div className="absolute right-4 top-4 rounded-full border border-white/[0.15] bg-black/[0.35] px-2.5 py-1 text-2xs font-medium text-white/[0.85] backdrop-blur-md">
          ~{party.approxLocation.radiusMeters} m Umkreis
        </div>

        {/* Glanzkante am unteren Cover-Rand */}
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      </div>

      <div className="space-y-3.5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[1.15rem] font-bold leading-snug tracking-tight text-balance">
              {party.title}
            </h3>
            {party.ratingCount > 0 && (
              <div className="mt-1">
                <RatingDisplay average={party.avgRating} count={party.ratingCount} />
              </div>
            )}
          </div>
          <span className="whitespace-nowrap rounded-full bg-white/[0.07] px-2.5 py-1 text-2xs font-semibold text-white/70">
            {formatWhen(party)}
          </span>
        </div>

        {party.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {party.tags.slice(0, 4).map((tag) => {
              const t = CATEGORY_THEMES[tag.category] ?? CATEGORY_THEMES.sonstiges;
              return (
                <span key={tag.id} className={`chip ${t.chip}`}>
                  <span className="text-[0.7rem]">{t.emoji}</span>
                  {tag.label}
                </span>
              );
            })}
            {party.tags.length > 4 && (
              <span className="chip border-white/[0.12] bg-white/[0.05] text-white/50">
                +{party.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Gästeanzeige: Startgruppe und Beigetretene bewusst getrennt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-2xs font-medium">
            <span className="text-white/50">
              <span className="text-sm font-bold text-white">{party.startCapacity}</span>{" "}
              zum Start
            </span>
            <span className="text-white/50">
              <span className="text-sm font-bold" style={{ color: theme.accent }}>
                +{party.joinedGuestsCount}
              </span>{" "}
              über die App
            </span>
          </div>

          {party.maxGuests ? (
            // Mit Obergrenze: Belegung wie bei einem Spiele-Server
            <>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((total / party.maxGuests) * 100, 100)}%`,
                    backgroundColor: isFull ? "#ff4d97" : theme.accent,
                  }}
                />
              </div>
              <p className="text-2xs text-white/40">
                {total} / {party.maxGuests} Plätze belegt
              </p>
            </>
          ) : (
            <div className="flex h-1.5 gap-1 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full flex-1 rounded-full bg-white/25" />
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(joinedShare, 70)}%`,
                  backgroundColor: theme.accent,
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-0.5 text-2xs text-white/50">
          <span className="chip border-white/10 bg-white/[0.05]">
            {party.alcoholStatus === "provided" ? "🍹 Drinks da" : "🎒 BYO"}
          </span>
          <span className="chip border-white/10 bg-white/[0.05]">
            {party.approvalMode === "manual" ? "🔒 Freigabe" : "⚡ Offen"}
          </span>
          <span className="ml-auto flex items-center gap-1 font-semibold text-white/70 transition group-hover:text-white">
            Ansehen
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
