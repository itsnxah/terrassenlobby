import type { Party } from "@/types/party";

/**
 * Beispiel-Partys, damit Feed und Detailansicht sofort etwas anzeigen,
 * bevor die Supabase-Anbindung live ist. Später ersetzen durch echten
 * Datenabruf (z. B. supabase.from("parties").select(...)).
 */
export const mockParties: Party[] = [
  {
    id: "1",
    hostId: "host-1",
    host: { id: "host-1", displayName: "Jana" },
    title: "Dachterrassen-Warmup",
    description:
      "Kleines Vorglühen auf der Dachterrasse, bevor es später in die Stadt geht. Bringt gute Laune mit!",
    visibility: "public",
    status: "live",
    ageRating: "18+",
    alcoholStatus: "provided",
    approvalMode: "manual",
    startCapacity: 8,
    joinedGuestsCount: 5,
    maxGuests: 20,
    closedAt: null,
    hiddenAt: null,
    hiddenReason: null,
    avgRating: 4.6,
    ratingCount: 7,
    startsAt: new Date().toISOString(),
    approxLocation: { lat: 52.520008, lng: 13.404954, radiusMeters: 400 },
    coverPhotoUrl: "",
    photoUrls: [],
    tags: [
      { id: "t1", category: "musik", label: "House" },
      { id: "t2", category: "aktivitaet", label: "Chillen" },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    hostId: "host-2",
    host: { id: "host-2", displayName: "Tom & Lea" },
    title: "Krimi-Kostümparty",
    description:
      "Kostümparty mit Krimi-Ratespiel – wer ist der Mörder? Verkleidung ist Pflicht, Kreativität erwünscht.",
    visibility: "public",
    status: "planned",
    ageRating: "16+",
    alcoholStatus: "byo",
    approvalMode: "automatic",
    startCapacity: 12,
    joinedGuestsCount: 9,
    maxGuests: null,
    closedAt: null,
    hiddenAt: null,
    hiddenReason: null,
    avgRating: null,
    ratingCount: 0,
    startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    approxLocation: { lat: 48.135125, lng: 11.581981, radiusMeters: 600 },
    coverPhotoUrl: "",
    photoUrls: [],
    tags: [
      { id: "t3", category: "mottoparty", label: "Kostümparty" },
      { id: "t4", category: "aktivitaet", label: "Krimi-Ratespiel" },
    ],
    createdAt: new Date().toISOString(),
  },
];
