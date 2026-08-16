"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ModerationBadge } from "./ModerationBadge";

export function AuthNav() {
  const supabase = createClient();
  const router = useRouter();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setDisplayName(
        (data.user?.user_metadata?.display_name as string | undefined) ??
          data.user?.email ??
          null,
      );

      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle();
        setIsAdmin(Boolean(profile?.is_admin));
      }

      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setDisplayName(
        (session?.user?.user_metadata?.display_name as string | undefined) ??
          session?.user?.email ??
          null,
      );
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.07]" />;
  }

  if (!displayName) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur-xl transition hover:border-white/25 hover:bg-white/[0.1]"
      >
        Login
      </Link>
    );
  }

  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-lobby-pink to-lobby-blue text-sm font-bold text-ink-950 ring-1 ring-white/20 transition hover:scale-105"
        aria-label="Konto"
      >
        {initial}
        {/* Zeigt am Profilbild schon von außen, dass es offene Meldungen gibt –
            ohne dafür einen eigenen Reiter in der Navigation zu brauchen. */}
        {isAdmin && (
          <ModerationBadge isAdmin={isAdmin} className="absolute -right-1 -top-1" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="glass glass-sheen absolute right-0 z-50 mt-2 w-56 overflow-hidden p-1.5">
            <div className="px-3 py-2.5">
              <p className="text-2xs uppercase tracking-wider text-white/40">
                Angemeldet als
              </p>
              <p className="truncate text-sm font-semibold">{displayName}</p>
            </div>
            <div className="divider my-1" />
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              👤 Mein Profil
            </Link>
            <Link
              href="/host"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              🎪 Meine Lobbys
            </Link>
            {isAdmin && (
              <Link
                href="/moderation"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
              >
                🛡️ Moderation
                <ModerationBadge isAdmin={isAdmin} />
              </Link>
            )}
            <div className="divider my-1" />
            <button
              onClick={handleLogout}
              className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/75 transition hover:bg-white/[0.08] hover:text-white"
            >
              Ausloggen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
