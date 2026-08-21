import { createClient } from "@supabase/supabase-js";

/**
 * Mail an Noah bei jeder Neuanmeldung – die einzige der drei Nachrichten-
 * Routen, die kein eingeloggtes Bearer-Token verlangt: Direkt nach dem
 * Signup gibt es (bei aktivierter E-Mail-Bestätigung) noch keine Session,
 * nur die neue Nutzer-ID. Als Schutz vor Missbrauch (jemand errät eine
 * fremde Nutzer-ID und spammt beliebig oft) wird nur verschickt, wenn das
 * zugehörige Profil wirklich frisch ist – siehe MAX_AGE_MS unten.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const MAX_AGE_MS = 5 * 60 * 1000;

function esc(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

type Payload = { userId?: string };

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL ?? "Terrassenlobby <onboarding@resend.dev>";
  // Dieselbe Adresse, die auch Moderations-Mails bekäme – eine
  // Admin-Benachrichtigungsadresse für beides, kein separates Setup nötig.
  const adminEmail = process.env.MODERATION_EMAIL;

  if (!supabaseUrl || !serviceKey || !resendKey || !adminEmail) {
    return Response.json({ skipped: "not_configured" });
  }

  const { userId } = (await request.json()) as Payload;
  if (!userId) {
    return Response.json({ error: "userId nötig" }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: profile } = await admin
    .from("profiles")
    .select("id, display_name, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return Response.json({ skipped: "not_found" });
  }

  const ageMs = Date.now() - new Date(profile.created_at).getTime();
  if (ageMs > MAX_AGE_MS) {
    return Response.json({ skipped: "not_recent" });
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const newUserEmail = authUser?.user?.email ?? "unbekannt";

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const subject = "Neue Anmeldung bei Terrassenlobby";
  const intro =
    `${profile.display_name ?? "Jemand"} (${newUserEmail}) hat sich gerade registriert.\n\n` +
    `Insgesamt jetzt ${count ?? "?"} registrierte Konten.`;

  const text = `${intro}\n\nNutzerliste ansehen: ${APP_URL}/moderation?tab=nutzer`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#07060d;padding:32px;color:#fff">
      <div style="max-width:480px;margin:0 auto;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:28px">
        <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.45)">Terrassenlobby</p>
        <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3">${esc(subject)}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.75);white-space:pre-line">${esc(intro)}</p>
        <a href="${esc(`${APP_URL}/moderation?tab=nutzer`)}" style="display:inline-block;padding:12px 22px;border-radius:999px;background:linear-gradient(135deg,#ff5fa8,#c86bff,#52a8ff);color:#fff;text-decoration:none;font-weight:600;font-size:14px">Nutzerliste ansehen</a>
      </div>
    </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: adminEmail, subject, text, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: "Versand fehlgeschlagen", detail }, { status: 502 });
  }

  return Response.json({ sent: true });
}
