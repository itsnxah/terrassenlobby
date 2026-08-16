import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Form, in der Supabase die zu setzenden Cookies übergibt. */
type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Supabase-Client für Server-Komponenten / Server Actions.
 * Nutzung: const supabase = createClient();
 *
 * Hinweis: Bewusst ohne <Database>-Generic. Solange die Datenbanktypen nur
 * ein Platzhalter sind, verschlechtert das Generic die Typableitung, statt
 * sie zu verbessern – die Cookie-Funktionen verlieren dadurch ihre Typen.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Aufruf aus einer Server Component ohne Schreibrechte auf Cookies –
            // kann ignoriert werden, wenn Middleware die Session-Erneuerung übernimmt.
          }
        },
      },
    },
  );
}
