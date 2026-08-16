"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Circle, Popup, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import type { AgeRating, PartyStatus } from "@/types/party";

export type MapParty = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  ageRating: AgeRating;
  status: PartyStatus;
  /** Farbe der Kategorie – färbt den Umkreis auf der Karte */
  accent: string;
  emoji: string;
};

/** Fliegt zum Nutzerstandort, sobald dieser freigegeben wurde. */
function FlyToUser({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

// Wichtig: Diese Komponente wird nur per next/dynamic mit { ssr: false }
// geladen (siehe src/app/karte/MapClient.tsx) – Leaflet greift beim Import
// auf "window" zu und funktioniert nicht auf dem Server.
export default function PartyMap({
  parties,
  userPosition = null,
}: {
  parties: MapParty[];
  userPosition?: [number, number] | null;
}) {
  const center: [number, number] =
    parties.length > 0 ? [parties[0].lat, parties[0].lng] : [51.1657, 10.4515]; // Fallback: Mitte Deutschland

  return (
    <MapContainer
      center={center}
      zoom={parties.length > 0 ? 12 : 6}
      scrollWheelZoom
      style={{
        height: "68vh",
        width: "100%",
        borderRadius: "1.75rem",
      }}
    >
      {/* Dunkle Kartenkacheln von CARTO – kostenlos, kein API-Key nötig */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      <FlyToUser position={userPosition} />

      {userPosition && (
        <CircleMarker
          center={userPosition}
          radius={7}
          pathOptions={{
            color: "#ffffff",
            weight: 2.5,
            fillColor: "#5b9dff",
            fillOpacity: 1,
          }}
        />
      )}

      {parties.map((party) => (
        <Circle
          key={party.id}
          center={[party.lat, party.lng]}
          radius={party.radiusMeters}
          pathOptions={{
            color: party.accent,
            weight: 2,
            opacity: 0.9,
            fillColor: party.accent,
            fillOpacity: party.status === "live" ? 0.32 : 0.16,
          }}
        >
          <Popup>
            <div style={{ minWidth: 170 }}>
              <div style={{ fontSize: 20, lineHeight: 1 }}>{party.emoji}</div>
              <strong style={{ display: "block", marginTop: 6, fontSize: 14 }}>
                {party.title}
              </strong>
              <div
                style={{
                  fontSize: 12,
                  margin: "6px 0 10px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {party.status === "live" ? "🔴 Läuft gerade" : "📅 Geplant"} ·{" "}
                {party.ageRating}
              </div>
              <Link href={`/party/${party.id}`}>Zur Party →</Link>
            </div>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}
