import { createClient } from "@supabase/supabase-js";

/**
 * E-Mails rund um Meldungen:
 *
 *   new_report      -> an die Moderation: "Neue Meldung eingegangen"
 *   report_resolved -> an die meldende Person: Ergebnis der Prüfung
 *   party_hidden    -> an den Host: Party wurde verborgen, mit Begründung
 *
 * Die letzten beiden sind keine Höflichkeit, sondern Pflicht: Der DSA
 * verlangt eine Rückmeldung an den Meldenden und eine Begründung gegenüber
 * der betroffenen Person.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function template(subject: string, body: string, link: string, linkText: string) {
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#07060d;padding:32px;color:#fff">
      <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:28px">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Terrassenlobby</p>
        <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3">${esc(subject)}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);white-space:pre-line">${esc(body)}</p>
        <a href="${esc(link)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#ff5fa8,#c86bff,#52a8ff);color:#fff;text-decoration:none;font-weight:600;font-size:14px">${esc(linkText)}</a>
      </div>
    </div>`;
}

type Payload = {
  reportId?: string;
  type?: "new_report" | "report_resolved" | "party_hidden";
};

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL ?? "Terrassenlobby <onboarding@resend.dev>";
  const moderationEmail = process.env.MODERATION_EMAIL;

  if (!supabaseUrl || !serviceKey || !resendKey) {
    return Response.json({ skipped: "not_configured" });
  }

  const { reportId, type } = (await request.json()) as Payload;
  if (!reportId || !type) {
    return Response.json({ error: "reportId und type nötig" }, { status: 400 });
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

  const { data: report } = await admin
    .from("reports")
    .select("id, reporter_id, target_id, target_type, reason, note, status, resolution")
    .eq("id", reportId)
    .maybeSingle();

  if (!report) {
    return Response.json({ error: "Meldung nicht gefunden" }, { status: 404 });
  }

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", caller.id)
    .maybeSingle();

  const callerIsAdmin = Boolean(callerProfile?.is_admin);

  // Wer darf welche Mail auslösen?
  if (type === "new_report" && caller.id !== report.reporter_id) {
    return Response.json({ error: "nicht erlaubt" }, { status: 403 });
  }
  if (type !== "new_report" && !callerIsAdmin) {
    return Response.json({ error: "nicht erlaubt" }, { status: 403 });
  }

  const { data: party } = await admin
    .from("parties")
    .select("id, title, host_id, hidden_reason")
    .eq("id", report.target_id)
    .maybeSingle();

  let to: string | undefined;
  let subject = "";
  let body = "";
  let link = APP_URL;
  let linkText = "In der App ansehen";

  if (type === "new_report") {
    if (!moderationEmail) return Response.json({ skipped: "no_moderation_email" });
    to = moderationEmail;
    subject = `Neue Meldung: „${party?.title ?? "unbekannte Party"}“`;
    body =
      `Grund: ${report.reason}\n` +
      (report.note ? `Hinweis: ${report.note}\n` : "") +
      `\nBitte in der Moderation prüfen.`;
    link = `${APP_URL}/moderation`;
    linkText = "Zur Moderation";
  } else if (type === "report_resolved") {
    const { data: reporter } = await admin.auth.admin.getUserById(report.reporter_id);
    to = reporter?.user?.email;
    subject = "Ergebnis deiner Meldung";
    body =
      `Danke, dass du uns auf „${party?.title ?? "eine Party"}“ aufmerksam gemacht hast.\n\n` +
      `Ergebnis der Prüfung:\n${report.resolution ?? "Die Meldung wurde geprüft."}`;
    link = APP_URL;
    linkText = "Zur App";
  } else {
    if (!party) return Response.json({ error: "Party nicht gefunden" }, { status: 404 });
    const { data: host } = await admin.auth.admin.getUserById(party.host_id);
    to = host?.user?.email;
    subject = `Deine Party „${party.title}“ wurde verborgen`;
    body =
      `Deine Party ist vorerst nicht mehr öffentlich sichtbar.\n\n` +
      `Begründung:\n${party.hidden_reason ?? "Verstoß gegen die Nutzungsbedingungen."}\n\n` +
      `Wenn du das für einen Fehler hältst, antworte einfach auf diese E-Mail – ` +
      `wir schauen es uns noch einmal an.`;
    link = `${APP_URL}/host/${party.id}`;
    linkText = "Zur Lobby";
  }

  if (!to) {
    return Response.json({ skipped: "no_email" });
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: `${body}\n\n${link}\n\n– Terrassenlobby`,
      html: template(subject, body, link, linkText),
    }),
  });

  if (!res.ok) {
    return Response.json(
      { error: "Versand fehlgeschlagen", detail: await res.text() },
      { status: 502 },
    );
  }

  return Response.json({ sent: true });
}
