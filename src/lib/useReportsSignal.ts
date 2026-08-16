"use client";

import { useEffect, useId, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Meldet sich, sobald sich an den Meldungen (reports) etwas ändert –
 * gleicher Aufbau wie useJoinRequestSignal, nur für die Moderation.
 */
export function useReportsSignal(onSignal: () => void, pollMs = 20000) {
  const id = useId();
  const callback = useRef(onSignal);
  callback.current = onSignal;

  useEffect(() => {
    const supabase = createClient();
    const fire = () => callback.current();

    const channel = supabase
      .channel(`reports-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "reports" }, fire)
      .subscribe();

    const onVisible = () => {
      if (!document.hidden) fire();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    const interval = window.setInterval(() => {
      if (!document.hidden) fire();
    }, pollMs);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.clearInterval(interval);
    };
  }, [id, pollMs]);
}
