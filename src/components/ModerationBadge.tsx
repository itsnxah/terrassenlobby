"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReportsSignal } from "@/lib/useReportsSignal";

/**
 * Zähler für offene Meldungen – ausschließlich für Moderation gedacht.
 *
 * Läuft bewusst nur, wenn "isAdmin" von außen als true übergeben wird:
 * Nicht-Admins dürften über die RLS-Regel "Eigene Meldungen einsehen" zwar
 * ihre eigenen Meldungen zählen, aber dieser Zähler soll ausschließlich die
 * Moderationslast zeigen – für alle anderen bleibt er unsichtbar.
 */
export function ModerationBadge({
  isAdmin,
  className = "",
}: {
  isAdmin: boolean;
  className?: string;
}) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setCount(0);
      return;
    }

    const supabase = createClient();
    const { count: c } = await supabase
      .from("reports")
      .select("id", { count: "exact", head: true })
      .eq("status", "open");

    setCount(c ?? 0);
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  useReportsSignal(load);

  if (!isAdmin || count === 0) return null;

  return (
    <span
      className={`inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-lobby-pink px-1 text-2xs font-bold leading-none text-white ring-2 ring-ink-950 ${className}`}
      aria-label={`${count} offene Meldungen`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
