/**
 * Adresssuche über Nominatim (OpenStreetMap).
 *
 * Läuft bewusst auf dem Server: Sonst ginge die eingegebene Wohnadresse
 * zusammen mit der IP-Adresse des Hosts direkt von seinem Browser an einen
 * Dritten. So sieht Nominatim nur unseren Server.
 */
export async function POST(request: Request) {
  const { address } = (await request.json()) as { address?: string };

  if (!address || address.trim().length < 5) {
    return Response.json({ error: "Adresse zu kurz" }, { status: 400 });
  }

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
    encodeURIComponent(address.trim());

  try {
    const res = await fetch(url, {
      headers: {
        // Nominatim verlangt eine identifizierbare Anwendung.
        "User-Agent": "Terrassenlobby/1.0 (Party-App)",
        "Accept-Language": "de",
      },
      // Ergebnisse ändern sich kaum – schont das Kontingent.
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return Response.json({ result: null });
    }

    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) {
      return Response.json({ result: null });
    }

    return Response.json({
      result: {
        lat: parseFloat(json[0].lat),
        lng: parseFloat(json[0].lon),
        displayName: json[0].display_name as string,
      },
    });
  } catch {
    return Response.json({ result: null });
  }
}
