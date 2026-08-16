export type GeoResult = { lat: number; lng: number; displayName: string };

/**
 * Adresse in Koordinaten übersetzen.
 *
 * Geht über unsere eigene Server-Route, damit die eingegebene Adresse nicht
 * direkt aus dem Browser des Hosts an einen Dritten geschickt wird
 * (siehe src/app/api/geocode/route.ts).
 */
export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  try {
    const res = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });

    if (!res.ok) return null;

    const json = await res.json();
    return (json.result as GeoResult | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Verschiebt den Kartenmittelpunkt zufällig gegenüber der echten Adresse.
 *
 * Wichtig fürs Datenschutzversprechen: Würden wir die exakten Koordinaten als
 * Kreismittelpunkt speichern, könnte man die Adresse einfach aus der Mitte des
 * Umkreises ablesen – der "verschwommene" Kreis wäre wirkungslos. Deshalb
 * liegt die echte Adresse irgendwo im Kreis, aber bewusst nicht in der Mitte.
 */
export function fuzzCoordinates(
  lat: number,
  lng: number,
  radiusMeters: number,
): { lat: number; lng: number } {
  // Versatz zwischen 35 % und 75 % des Radius in zufälliger Richtung
  const distance = radiusMeters * (0.35 + Math.random() * 0.4);
  const angle = Math.random() * 2 * Math.PI;

  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = 111_320 * Math.cos((lat * Math.PI) / 180);

  return {
    lat: lat + (distance * Math.cos(angle)) / metersPerDegreeLat,
    lng: lng + (distance * Math.sin(angle)) / metersPerDegreeLng,
  };
}
