/**
 * Zentrale Stelle für alle Angaben, die in Impressum, Datenschutzerklärung
 * und Nutzungsbedingungen auftauchen.
 *
 * Nur hier ändern – die drei Rechtsseiten ziehen sich alles von hier.
 */

export const BETREIBER = {
  /** Voller bürgerlicher Name – muss im Impressum stehen. */
  name: "Noah Hindemith",

  /**
   * Ladungsfähige Anschrift. Solange hier ein Platzhalter steht, ist das
   * Impressum unvollständig; die Seiten weisen sichtbar darauf hin.
   */
  strasse: "Franz-Adam-Landvogt-Straße 8",
  ort: "35519 Rockenberg",
  land: "Deutschland",

  email: "buisness.nxah@gmail.com",

  /** Optional – leer lassen, wenn keine Telefonnummer angegeben werden soll. */
  telefon: "",
} as const;

/** True, solange noch Platzhalter in den Angaben stecken. */
export const ANGABEN_UNVOLLSTAENDIG =
  BETREIBER.name.includes("[") ||
  BETREIBER.strasse.includes("[") ||
  BETREIBER.ort.includes("[");

/** Stand der Rechtstexte – bei inhaltlichen Änderungen mit anpassen. */
export const STAND = "August 2026";

/**
 * Fassung, der Nutzerinnen und Nutzer bei der Registrierung zustimmen.
 * Wird beim Konto gespeichert, damit später nachvollziehbar ist, welchem
 * Text jemand zugestimmt hat. Bei inhaltlichen Änderungen hochzählen.
 */
export const LEGAL_VERSION = "2026-08-17";
