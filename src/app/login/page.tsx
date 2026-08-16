"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/LogoMark";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
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
        <h1 className="text-2xl font-bold tracking-tight">Willkommen zurück</h1>
        <p className="mt-1.5 text-sm text-white/50">
          Melde dich an, um Lobbys beizutreten.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass glass-sheen relative space-y-4 p-6">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field"
          />
        </div>

        {errorMsg && (
          <p className="rounded-2xl border border-pink-400/40 bg-pink-500/15 px-4 py-3 text-sm text-pink-100">
            {errorMsg}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Wird geprüft…" : "Einloggen"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/50">
        Noch keinen Account?{" "}
        <Link
          href={`/signup?next=${encodeURIComponent(next)}`}
          className="font-semibold text-lobby-accent2 transition hover:text-white"
        >
          Registrieren
        </Link>
      </p>
    </div>
  );
}
