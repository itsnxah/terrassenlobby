/**
 * Zentrale Domänen-Typen für Terrassenlobby.
 * Spiegeln das Datenmodell aus supabase/schema.sql.
 */

export type PartyVisibility = "public" | "private";
export type PartyStatus = "planned" | "live";
export type AgeRating = "16+" | "18+";
export type ApprovalMode = "manual" | "automatic";
export type AlcoholStatus = "provided" | "byo"; // provided = gratis vorhanden, byo = bring your own

export type TagCategory =
  | "mottoparty"
  | "musik"
  | "aktivitaet"
  | "sonstiges";

export interface Tag {
  id: string;
  category: TagCategory;
  label: string;
}

export interface HostProfile {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface Party {
  id: string;
  hostId: string;
  host?: HostProfile;
  title: string;
  description: string;
  visibility: PartyVisibility;
  status: PartyStatus;
  ageRating: AgeRating;
  alcoholStatus: AlcoholStatus;
  approvalMode: ApprovalMode;
  startCapacity: number;
  joinedGuestsCount: number;
  /** Obergrenze für Startkapazität + beigetretene Gäste (null = unbegrenzt) */
  maxGuests: number | null;
  /** Gesetzt, wenn der Host die Lobby geschlossen hat */
  closedAt: string | null;
  /** Gesetzt, wenn die Moderation die Party verborgen hat */
  hiddenAt: string | null;
  hiddenReason: string | null;
  /** Durchschnittsbewertung der Party (null = noch keine) */
  avgRating: number | null;
  ratingCount: number;
  startsAt: string; // ISO-Datum, bei "planned" Pflicht, bei "live" optional/Startzeitpunkt
  /** Ungefährer, verschwommener Standort für die Kartenansicht (vor Beitritt) */
  approxLocation: {
    lat: number;
    lng: number;
    radiusMeters: number;
  };
  /**
   * Die exakte Adresse liegt bewusst NICHT hier, sondern in der separaten
   * Tabelle party_addresses – nur so lässt sich der Zugriff in der Datenbank
   * auf Host und angenommene Gäste beschränken.
   */
  coverPhotoUrl: string;
  photoUrls: string[];
  tags: Tag[];
  createdAt: string;
}

export type JoinRequestStatus = "pending" | "accepted" | "declined";

export interface JoinRequest {
  id: string;
  partyId: string;
  guestId: string;
  guest?: HostProfile;
  partySize: number; // Gruppen-Beitritt: Anzahl Personen, die die anfragende Person vertritt
  message: string;
  status: JoinRequestStatus;
  hostResponseMessage?: string | null;
  estimatedArrival?: string | null; // vom Gast nach Annahme angegeben
  checkedIn: boolean; // "Ich bin da"-Button
  createdAt: string;
}
