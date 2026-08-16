"use client";

import { useEffect, useId, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Meldet sich, sobald sich an den Beitrittsanfragen etwas ändert.
 *
 * Drei Wege, absichtlich kombiniert:
 *  1. Supabase Realtime – reagiert sofort, sobald jemand anfragt oder
 *     der Host antwortet (setzt supabase/realtime.sql voraus).
 *  2. Zurückkehren zum Tab – deckt den Fall ab, dass die Verbindung
 *     zwischendurch geschlafen hat.
 *  3. Langsames Nachfragen im Hintergrund – funktioniert auch dann noch,
 *     wenn Realtime im Projekt nicht aktiviert ist.
 */
export function useJoinRequestSignal(onSignal: () => void, pollMs = 20000) {
  const id = useId();
  const callback = useRef(onSignal);
  callback.current = onSignal;

  useEffect(() => {
    const supabase = createClient();
    const fire = () => callback.current();

    const channel = supabase
      .channel(`join-requests-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests" },
        fire,
      )
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
