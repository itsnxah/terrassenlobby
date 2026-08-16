import { createClient } from "@supabase/supabase-js";

/**
 * Verschickt E-Mails zu Beitrittsanfragen.
 *
 *  type = "new_request" -> an den Host: "Jemand möchte zu deiner Party"
 *  type = "decision"    -> an den Gast: angenommen oder abgelehnt
 *
 * Läuft bewusst serverseitig: Nur hier liegt der Service-Key, mit dem die
 * E-Mail-Adressen aus der Nutzerverwaltung gelesen werden dürfen. Der Client
 * schickt sein Anmelde-Token mit, damit niemand über fremde Anfragen Mails
 * auslösen kann.
 *
 * Ohne konfigurierte Schlüssel passiert nichts – die App funktioniert dann
 * weiter, nur eben ohne E-Mails.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * Nutzertexte (Anzeigename, Party-Titel, Antwort des Hosts) landen in einer
 * HTML-Mail. Ohne Maskierung könnte jemand über seinen Anzeigenamen einen
 * Link in eine echte Mail von unserer Absenderadresse schmuggeln.
 */
function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Payload = { joinRequestId?: string; type?: "new_request" | "decision" };

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL ?? "Terrassenlobby <onboarding@resend.dev>";

  if (!supabaseUrl || !serviceKey || !resendKey) {
    // Nicht eingerichtet – kein Fehler, damit der Beitritts-Ablauf nicht bricht.
    return Response.json({ skipped: "not_configured" });
  }

  const { joinRequestId, type } = (await request.json()) as Payload;
  if (!joinRequestId || !type) {
    return Response.json({ error: "joinRequestId und type nötig" }, { status: 400 });
  }

  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return Response.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user: caller },
  } = await admin.auth.getUser(token);

  if (!caller) {
    return Response.json({ error: "nicht angemeldet" }, { status: 401 });
  }

  const { data: jr } = await admin
    .from("join_requests")
    .select(
      "id, status, party_size, host_response_message, guest_id, party:parties ( id, title, host_id )",
    )
    .eq("id", joinRequestId)
    .maybeSingle();

  const party = (jr as any)?.party;
  if (!jr || !party) {
    return Response.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
  }

  // Wer darf welche Mail auslösen?
  if (type === "new_request" && caller.id !== jr.guest_id) {
    return Response.json({ error: "nicht erlaubt" }, { status: 403 });
  }
  if (type === "decision" && caller.id !== party.host_id) {
    return Response.json({ error: "nicht erlaubt" }, { status: 403 });
  }

  const recipientId = type === "new_request" ? party.host_id : jr.guest_id;
  const { data: recipient } = await admin.auth.admin.getUserById(recipientId);
  const to = recipient?.user?.email;

  if (!to) {
    return Response.json({ skipped: "no_email" });
  }

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("display_name")
    .eq("id", caller.id)
    .maybeSingle();

  const senderName = senderProfile?.display_name ?? "Jemand";

  let subject: string;
  let intro: string;
  let link: string;

  if (type === "new_request") {
    subject = `Neue Anfrage für „${party.title}“`;
    intro =
      `${senderName} möchte zu deiner Party „${party.title}“ kommen ` +
      `(${jr.party_size === 1 ? "allein" : `${jr.party_size} Personen`}).`;
    link = `${APP_URL}/host/${party.id}`;
  } else if (jr.status === "accepted") {
    subject = `Du bist dabei: „${party.title}“`;
    intro =
      `Gute Nachrichten – deine Anfrage für „${party.title}“ wurde angenommen. ` +
      `Die genaue Adresse ist jetzt für dich freigeschaltet.`;
    link = `${APP_URL}/party/${party.id}`;
  } else {
    subject = `Absage für „${party.title}“`;
    intro = `Deine Anfrage für „${party.title}“ wurde leider abgelehnt.`;
    link = `${APP_URL}/`;
  }

  const note = jr.host_response_message
    ? `\n\nNachricht vom Host:\n„${jr.host_response_message}“`
    : "";

  const text = `${intro}${note}\n\nHier ansehen: ${link}\n\n– Terrassenlobby`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#07060d;padding:32px;color:#fff">
      <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:28px">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Terrassenlobby</p>
        <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3">${esc(subject)}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75)">${esc(intro)}</p>
        ${
          jr.host_response_message
            ? `<p style="margin:0 0 16px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,0.06);font-size:14px;line-height:1.6;color:rgba(255,255,255,0.8)">„${esc(jr.host_response_message)}“</p>`
            : ""
        }
        <a href="${esc(link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#ff5fa8,#c86bff,#52a8ff);color:#fff;text-decoration:none;font-weight:600;font-size:14px">In der App ansehen</a>
      </div>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: "Versand fehlgeschlagen", detail }, { status: 502 });
  }

  return Response.json({ sent: true });
}
