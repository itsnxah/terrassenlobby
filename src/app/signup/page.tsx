"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/LogoMark";
import { LEGAL_VERSION } from "@/lib/legal";
import { notifyNewSignup } from "@/lib/notify";

function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfo(null);

    // Terrassenlobby zeigt Partys ab 16+, daher auch Mindestalter für den Account.
    if (calculateAge(birthDate) < 16) {
      setErrorMsg("Du musst mindestens 16 Jahre alt sein, um dich zu registrieren.");
      return;
    }

    if (!accepted) {
      setErrorMsg(
        "Bitte bestätige die Nutzungsbedingungen und die Datenschutzerklärung.",
      );
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          birth_date: birthDate,
          // Nachweis der Einwilligung (Art. 7 DSGVO): Zeitpunkt und Fassung
          accepted_at: new Date().toISOString(),
          accepted_version: LEGAL_VERSION,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    // Der Profil-Datensatz existiert ab hier garantiert (Trigger in
    // auth_trigger.sql) – unabhängig davon, ob schon eine Session besteht.
    if (data.user) {
      void notifyNewSignup(data.user.id);
    }

    // Falls in den Supabase-Auth-Einstellungen "Confirm email" aktiv ist,
    // gibt es hier noch keine Session, sondern erst nach Mail-Bestätigung.
    if (!data.session) {
      setInfo("Fast geschafft! Bitte bestätige deine E-Mail-Adresse über den Link, den wir dir geschickt haben.");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm animate-riseIn py-6">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-gradient-to-br from-lobby-pink via-lobby-violet to-lobby-blue shadow-glow">
          <LogoMark className="h-9 w-9" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Account erstellen</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Kostenlos – und du bist im Feed dabei.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass glass-sheen relative space-y-4 p-6">
        <div>
          <label className="label">Anzeigename</label>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Wie sollen dich Hosts sehen?"
            className="field"
          />
        </div>
        <div>
          <label className="label">E-Mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="deine@email.de"
            className="field"
          />
        </div>
        <div>
          <label className="label">Passwort</label>
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            className="field"
          />
        </div>
        <div>
          <label className="label">Geburtsdatum</label>
          <input
            required
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="field [color-scheme:dark]"
          />
          <p className="hint">
            Damit dir nur Partys angezeigt werden, die zu deinem Alter passen
            (16+ / 18+).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAccepted((v) => !v)}
          className="flex w-full items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/20"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-2xs transition ${
              accepted
                ? "border-transparent bg-gradient-to-br from-lobby-pink to-lobby-violet text-white"
                : "border-white/25"
            }`}
          >
            {accepted ? "✓" : ""}
          </span>
          <span className="text-xs leading-relaxed text-white/60">
            Ich akzeptiere die{" "}
            <Link
              href="/agb"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-lobby-accent2 underline underline-offset-2"
            >
              Nutzungsbedingungen
            </Link>{" "}
            und habe die{" "}
            <Link
              href="/datenschutz"
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-lobby-accent2 underline underline-offset-2"
            >
              Datenschutzerklärung
            </Link>{" "}
            gelesen.
          </span>
        </button>

        {errorMsg && (
          <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
            {errorMsg}
          </p>
        )}
        {info && (
          <p className="rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !accepted}
          className="btn-primary w-full"
        >
          {submitting ? "Wird erstellt…" : "Account erstellen"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/50">
        Schon registriert?{" "}
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="font-semibold text-lobby-accent2 transition hover:text-white"
        >
          Einloggen
        </Link>
      </p>
    </div>
  );
}
