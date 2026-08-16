"use client";

import { useState } from "react";
import dynamicImport from "next/dynamic";
import type { MapParty } from "@/components/PartyMap";

// ssr: false ist nötig, weil Leaflet auf "window" zugreift – das geht nur im
// Browser, nicht beim Server-Rendering. Deshalb dieser kleine Client-Wrapper:
// next/dynamic mit ssr:false darf nur innerhalb einer Client Component
// aufgerufen werden, nicht direkt in einer Server Component (karte/page.tsx).
const PartyMap = dynamicImport(() => import("@/components/PartyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[68vh] w-full items-center justify-center rounded-card bg-white/[0.03]">
      <div className="flex flex-col items-center gap-3">
        <span className="animate-floaty text-3xl">🗺️</span>
        <span className="text-sm text-white/40">Karte lädt…</span>
      </div>
    </div>
  ),
});

export function MapClient({ parties }: { parties: MapParty[] }) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [state, setState] = useState<"idle" | "asking" | "denied" | "unavailable">(
    "idle",
  );

  /**
   * Standortzugriff nur auf ausdrückliche Aktion – kein automatischer Zugriff
   * beim Laden der Seite. Die Koordinaten bleiben im Browser und werden weder
   * an den Server geschickt noch gespeichert.
   */
  function locateMe() {
    if (!("geolocation" in navigator)) {
      setState("unavailable");
      return;
    }
    setState("asking");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setState("idle");
      },
      () => setState("denied"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <div className="space-y-3">
      {position ? (
        <p className="chip border-blue-300/30 bg-blue-400/12 text-blue-100">
          📍 Karte auf deinen Standort zentriert
        </p>
      ) : (
        <div className="glass-soft flex flex-wrap items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Karte auf dich zentrieren?</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/45">
              Dein Standort bleibt auf deinem Gerät – wir speichern und
              übertragen ihn nicht.
            </p>
          </div>
          <button
            onClick={locateMe}
            disabled={state === "asking"}
            className="btn-ghost shrink-0 py-2.5 text-sm"
          >
            {state === "asking" ? "Suche…" : "Standort verwenden"}
          </button>
        </div>
      )}

      {state === "denied" && (
        <p className="text-xs text-white/40">
          Kein Zugriff auf den Standort – kein Problem, die Karte funktioniert
          auch so.
        </p>
      )}
      {state === "unavailable" && (
        <p className="text-xs text-white/40">
          Dein Browser unterstützt keine Standortbestimmung.
        </p>
      )}

      <PartyMap parties={parties} userPosition={position} />
    </div>
  );
}
