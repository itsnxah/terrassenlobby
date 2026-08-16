"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useJoinRequestSignal } from "@/lib/useJoinRequestSignal";

/**
 * Zähler für offene Anfragen an die eigenen Partys.
 * Aktualisiert sich selbst, sobald sich etwas an den Anfragen ändert.
 */
export function NotificationsBadge({ className = "" }: { className?: string }) {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCount(0);
      return;
    }

    const { count: c } = await supabase
      .from("join_requests")
      .select("id, party:parties!inner(host_id)", { count: "exact", head: true })
      .eq("party.host_id", user.id)
      .eq("status", "pending");

    setCount(c ?? 0);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useJoinRequestSignal(load);

  if (count === 0) return null;

  return (
    <span
      className={`inline-flex h-[1.15rem] min-w-[1.15rem] items-center justify-center rounded-full bg-lobby-pink px-1 text-2xs font-bold leading-none text-white ring-2 ring-ink-950 ${className}`}
      aria-label={`${count} offene Anfragen`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
