"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Start",
    exact: true,
    icon: (
      <path d="M3 10.5 12 3l9 7.5M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" />
    ),
  },
  {
    href: "/karte",
    label: "Karte",
    exact: false,
    icon: (
      <>
        <path d="M9 3.5 3.5 6v14.5L9 18l6 2.5 5.5-2.5V3.5L15 6z" />
        <path d="M9 3.5V18M15 6v14.5" />
      </>
    ),
  },
  {
    href: "/host",
    label: "Lobbys",
    exact: false,
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const createActive = pathname === "/host/create";

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 sm:hidden">
      <div className="glass-bar mx-3 mb-3 flex items-center gap-1 rounded-[1.6rem] border px-2 py-2 shadow-glass">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : item.href === "/host"
              ? pathname.startsWith("/host") && pathname !== "/host/create"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition ${
                active ? "text-white" : "text-white/45"
              }`}
            >
              {active && (
                <span className="absolute inset-0 rounded-2xl bg-white/[0.09]" />
              )}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="relative h-[1.35rem] w-[1.35rem]"
              >
                {item.icon}
              </svg>
              <span className="relative text-2xs font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Hervorgehobene Kachel: die zentrale Aktion der App */}
        <Link
          href="/host/create"
          className={`create-surface relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition active:scale-95 ${
            createActive ? "ring-2 ring-white/60" : ""
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            className="h-[1.35rem] w-[1.35rem]"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="text-2xs font-semibold">Erstellen</span>
        </Link>
      </div>
    </nav>
  );
}
