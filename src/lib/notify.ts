"use client";

import { createClient } from "@/lib/supabase/client";

/**
 * Stößt den E-Mail-Versand an (siehe src/app/api/notify/route.ts).
 * Bewusst "leise": Schlägt der Versand fehl oder ist er nicht eingerichtet,
 * darf das den Beitritts- bzw. Freigabe-Ablauf nicht stören.
 */
export async function notifyByEmail(
  joinRequestId: string,
  type: "new_request" | "decision",
) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    await fetch("/api/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ joinRequestId, type }),
    });
  } catch {
    // Absichtlich ignoriert – die App funktioniert auch ohne E-Mail.
  }
}

/**
 * Mail an Noah bei einer Neuanmeldung (siehe src/app/api/new-user-notify/route.ts).
 * Braucht bewusst kein Bearer-Token – direkt nach dem Signup gibt es bei
 * aktivierter E-Mail-Bestätigung noch keine Session, nur die neue Nutzer-ID.
 */
export async function notifyNewSignup(userId: string) {
  try {
    await fetch("/api/new-user-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
  } catch {
    // Absichtlich ignoriert.
  }
}

/** Dasselbe für Meldungen (siehe src/app/api/moderation-notify/route.ts). */
export async function notifyModeration(
  reportId: string,
  type: "new_report" | "report_resolved" | "party_hidden",
) {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    await fetch("/api/moderation-notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ reportId, type }),
    });
  } catch {
    // Auch hier: kein harter Fehler für den Nutzer.
  }
}
