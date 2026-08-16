"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Ob das eingeloggte Konto Moderationsrechte hat.
 *
 * Fragt public.is_admin() (siehe supabase/moderation_ausbau.sql) statt
 * direkt die profiles-Tabelle zu lesen – die Funktion liefert für
 * ausgeloggte oder unbekannte Konten sicher "false" zurück.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) setIsAdmin(false);
        return;
      }

      const { data } = await supabase.rpc("is_admin");
      if (active) setIsAdmin(Boolean(data));
    }

    load();

    const { data: listener } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
}
