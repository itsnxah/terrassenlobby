"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "./AuthNav";
import { LogoMark } from "./LogoMark";
import { NotificationsBadge } from "./NotificationsBadge";

const LINKS = [
  { href: "/", label: "Start", exact: true },
  { href: "/karte", label: "Karte", exact: false },
  { href: "/host", label: "Meine Lobbys", exact: false },
];

export function TopBar() {
  const pathname = usePathname();
  const messagesActive = pathname.startsWith("/nachrichten");

  return (
    <header className="sticky top-0 z-40 glass-bar border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-[0.72rem] bg-gradient-to-br from-lobby-pink via-lobby-violet to-lobby-blue shadow-glow transition group-hover:scale-105">
            <LogoMark className="h-[1.35rem] w-[1.35rem]" />
          </span>
          <span className="bg-gradient-to-r from-lobby-pink via-lobby-violet to-lobby-accent2 bg-clip-text text-[1.05rem] font-bold tracking-tight text-transparent">
            Terrassenlobby
          </span>
        </Link>

        {/* Desktop-Navigation – auf dem Handy übernimmt die Tab-Leiste unten */}
        <nav className="hidden items-center gap-1 sm:flex">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : link.href === "/host"
                ? pathname.startsWith("/host") && pathname !== "/host/create"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-white/[0.12] text-white"
                    : "text-white/[0.55] hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* Hervorgehoben: die wichtigste Aktion der App */}
          <Link
            href="/host/create"
            className={`create-surface ml-1 flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              pathname === "/host/create" ? "ring-2 ring-white/60" : ""
            }`}
          >
            <span className="text-base leading-none">+</span>
            Lobby erstellen
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Nachrichten als Brief-Symbol direkt neben dem Profilbild */}
          <Link
            href="/nachrichten"
            aria-label="Nachrichten"
            className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition ${
              messagesActive
                ? "border-white/25 bg-white/[0.12] text-white"
                : "border-white/[0.12] bg-white/[0.06] text-white/70 hover:border-white/25 hover:text-white"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[1.15rem] w-[1.15rem]"
            >
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="m3.8 7 8.2 5.6L20.2 7" />
            </svg>
            <NotificationsBadge className="absolute -right-1 -top-1" />
          </Link>

          <AuthNav />
        </div>
      </div>
    </header>
  );
}
