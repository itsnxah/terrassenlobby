"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useJoinRequestSignal } from "@/lib/useJoinRequestSignal";

/**
 * Lädt die Server-Daten der aktuellen Seite neu, sobald sich an den
 * Beitrittsanfragen etwas ändert – ohne dass der Nutzer F5 drücken muss.
 * Rendert nichts.
 */
export function AutoRefresh() {
  const router = useRouter();
  const refresh = useCallback(() => router.refresh(), [router]);

  useJoinRequestSignal(refresh);

  return null;
}
