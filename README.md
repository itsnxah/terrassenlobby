# Terrassenlobby

MVP der Terrassenlobby-App (Party-Finder, PWA). Gebaut mit Next.js (App
Router, TypeScript, Tailwind) und Supabase (Auth, Datenbank).

Dieses Projekt wurde als Code-Gerüst von Hand angelegt (kein `create-next-app`
gelaufen), weil die Cloud-Umgebung, in der es entstanden ist, keinen Zugriff
auf die npm-Registry hatte. Die Struktur folgt aber exakt einem normalen
Next.js-14-App-Router-Projekt – `npm install` funktioniert bei dir lokal ganz
normal.

## Was ist schon da?

- **Feed-Seite (`/`)** – zeigt echte, öffentliche Partys aus Supabase (fällt
  nur auf Beispieldaten zurück, wenn die Verbindung fehlschlägt)
- **Kartenansicht (`/karte`)** – zeigt alle öffentlichen Partys als
  verschwommene Umkreise auf einer OpenStreetMap-Karte (kostenlos, kein
  API-Key nötig)
- **Detailseite (`/party/[id]`)** – volle Party-Infos + Beitrittsformular
  (schreibt echte Anfragen in `join_requests`); zeigt die genaue Adresse nur
  dem Host und Gästen mit angenommener Anfrage
- **Party erstellen (`/host/create`)** – Host-Formular: Live/Geplant-Auswahl
  (Datumsfeld erscheint nur bei "Geplant"), genaue Adresse, Tag-Dropdown inkl.
  freier "Sonstiges"-Eingabe – legt echte Partys + Tags + Adresse in Supabase
  an, nur für eingeloggte Nutzer
- **Meine Lobbys (`/host`)** – zwei Ansichten: „Ich hoste" (eigene Partys mit
  Anzahl offener Anfragen) und „Ich bin Gast" (Partys, bei denen man angefragt
  hat, mit Status); unter `/host/[id]` können Anfragen einzeln oder mehrere auf
  einmal angenommen/abgelehnt werden, jeweils mit optionaler Antwortnachricht
- **Ankunft & Check-in** – angenommene Gäste tragen auf der Party-Seite ihre
  Ankunftszeit ein und bestätigen per „Ich bin da"; der Host sieht beides in
  der Anfragenliste
- **Bewertungen (1–5 Sterne)** – bewerten darf nur, wer eingecheckt hat.
  Bewertet wird die einzelne Party; der Host-Durchschnitt entsteht aus allen
  seinen Partys. Der Host kann umgekehrt seine eingecheckten Gäste bewerten.
  Sichtbar sind ausschließlich Durchschnitt und Anzahl – keine Freitexte,
  keine Rückschlüsse darauf, wer wie bewertet hat
- **Lobby verwalten** – unter `/host/[id]`: Plätze begrenzen (wie die
  Spielerzahl auf einem Server), Lobby schließen und wieder öffnen, oder
  endgültig löschen. Die Obergrenze wird per Datenbank-Trigger durchgesetzt,
  nicht nur im Browser
- **Fotos** – direkt beim Erstellen auswählbar und später unter `/host/[id]`
  ergänzbar (Supabase Storage);
  das erste Bild wird zum Titelbild im Feed, weitere erscheinen als Galerie auf
  der Detailseite
- **Profil (`/profil`)** – eigene Kennzahlen und Bewertungen, dabei bewusst
  getrennt nach Rolle: „Als Host" (Durchschnitt über alle eigenen Partys) und
  „Als Gast" (von Gastgebern vergeben). Darunter die eigenen Partys mit ihrer
  jeweiligen Bewertung und die Partys, auf denen man Gast war
- **Nachrichten (`/nachrichten`)** – ein Ort für beide Rollen: eingehende
  Anfragen an die eigenen Partys und die Antworten auf eigene Anfragen; die
  Navigation zeigt einen Zähler für offene Anfragen
- **Moderation (`/moderation`)** – nur für Konten mit `is_admin`: offene
  Meldungen prüfen, Party mit Begründung verbergen oder Meldung verwerfen.
  Beide Seiten werden automatisch per E-Mail informiert. Ab drei unabhängigen
  Meldungen verbirgt die Datenbank eine Party selbstständig, bis sie geprüft ist
- **Melden & Blockieren** – deutlich sichtbarer Melde-Bereich an jeder Party
  (Pflicht nach Art. 16 DSA), u. a. für „Party gibt es gar nicht" und
  „anderer Anlass als angegeben"; dazu Blockieren von Hosts – blockierte Hosts
  verschwinden aus dem Feed
- **"Freund*in informieren"** – erscheint auf der Detailseite, sobald die
  Adresse freigeschaltet ist: verschickt Adresse + Rückkehrzeit per
  WhatsApp/SMS/E-Mail an eine Vertrauensperson, ohne dass Daten gespeichert
  werden
- **Rechtstexte** – `/impressum`, `/datenschutz`, `/agb` als ausformulierte
  Entwürfe mit Platzhaltern
- **Registrieren (`/signup`)** – E-Mail + Passwort + Anzeigename +
  Geburtsdatum (Mindestalter 16) sowie Zustimmung zu Nutzungsbedingungen und
  Datenschutzerklärung; Zeitpunkt und Fassung werden im Profil festgehalten
- **Login (`/login`)** – E-Mail + Passwort
- **Datenbankschema** (`supabase/schema.sql`, `auth_trigger.sql`,
  `grants.sql`, `party_addresses.sql`) – Tabellen für Profile, Partys, Tags,
  Fotos, Kommentare, Beitrittsanfragen und eine eigens geschützte
  Adress-Tabelle, inkl. Row-Level-Security und automatischer Profilanlage bei
  Registrierung
- **PWA-Manifest (`public/manifest.json`)** – Grundlage für "Zum Homescreen
  hinzufügen"

Feed und Karte sind bewusst öffentlich einsehbar – ein Account ist erst
nötig, um eine Party zu erstellen oder einer beizutreten. Startkapazität und
die über die App beigetretenen Gäste werden auf den Party-Karten und in der
Detailansicht getrennt ausgewiesen (nur die Kennzahl „Plätze gesamt" im Hero
summiert beides).

Nutzer unter 18 bekommen 18+-Partys weder im Feed noch auf der Karte
angezeigt; Grundlage ist das bei der Registrierung angegebene Geburtsdatum.

## Was fehlt noch (nächste Schritte)

- Push-Benachrichtigungen aufs Handy (E-Mail gibt es bereits, Web-Push nicht)
- Selbstbedienung zum Löschen des eigenen Kontos (steht in den Rechtstexten
  als E-Mail-Weg)
- Fotos alter Partys werden vom Aufräum-Job noch nicht mit gelöscht
- Partys, die vor dem Geocoding-Update erstellt wurden, liegen noch auf dem
  alten Platzhalter-Punkt in Berlin-Mitte – am einfachsten löschen und neu
  anlegen
- Kommentare zu Fotos, Nach-Party-Fotoalbum (Gäste laden hoch), Musikwunschliste
- Rechtstexte mit echten Daten füllen und anwaltlich prüfen lassen; bei
  Supabase EU-Region wählen und Auftragsverarbeitungsvertrag abschließen
- Service Worker für echtes Offline-/Installierbar-Verhalten (z. B. über
  `next-pwa` oder Workbox nachrüsten)

## Setup

### 1. Node.js installieren
Falls noch nicht vorhanden: [nodejs.org](https://nodejs.org) (Version 18 oder
neuer).

### 2. Abhängigkeiten installieren
Im Projektordner:

```bash
npm install
```

Falls du dieses Projekt schon länger laufen hast: Es sind neue Pakete
(`leaflet`, `react-leaflet`) für die Kartenansicht dazugekommen – führe
`npm install` erneut aus, um sie nachzuladen.

### 3. Supabase-Projekt anlegen
1. Auf [supabase.com](https://supabase.com) kostenloses Projekt erstellen
2. Unter **Project Settings → API** die `Project URL` und den `anon public
   key` kopieren
3. Im Projektordner eine neue Datei `.env.local` anlegen (Vorlage siehe
   `env-example.txt`) und die beiden Werte eintragen:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
   ```

   (`.env.local`-Dateien werden aus Sicherheitsgründen nicht automatisch
   übertragen – die legst du einmalig manuell an.)

### 4. Datenbankschema einspielen
Im Supabase-Dashboard unter **SQL Editor**, der Reihe nach ausführen (jeweils
Inhalt einfügen, **Run** klicken):
1. `supabase/schema.sql` – legt alle Tabellen, Typen und Basis-Regeln an
2. `supabase/auth_trigger.sql` – automatisches Profil bei Registrierung
3. `supabase/grants.sql` – Grundzugriffsrechte für die App-Verbindung
4. `supabase/party_addresses.sql` – eigene, streng geschützte Tabelle für
   genaue Party-Adressen (nur Host + akzeptierte Gäste dürfen sie lesen)
5. `supabase/moderation.sql` – Meldungen, Blockierungen und ergänzende Rechte
   für Gäste an ihren eigenen Anfragen
6. `supabase/fotos.sql` – Speicher-Bucket `party-photos` und Zugriffsregeln für
   die Fotouploads
7. `supabase/realtime.sql` – meldet Änderungen an Anfragen sofort an die App
   (optional; ohne das Skript wird alle 20 Sekunden nachgefragt)
8. `supabase/aufraeumen.sql` – löscht alte Adressen (30 Tage) und
   Beitrittsanfragen (90 Tage) automatisch, täglich um 03:30 UTC
9. `supabase/korrekturen.sql` – **wichtig**: schließt mehrere Sicherheitslücken
   und repariert die Kategorien (Details im Kopf der Datei)
10. `supabase/lobby_verwaltung.sql` – maximale Gästezahl und das Schließen von
    Lobbys
11. `supabase/fix_rekursion.sql` – **wichtig**: behebt den Fehler
    „infinite recursion detected in policy for relation parties"
12. `supabase/bewertungen.sql` – Sternebewertungen für Partys und Gäste
13. `supabase/zustimmung.sql` – speichert die Zustimmung zu Nutzungs­bedingungen
    und Datenschutzerklärung bei der Registrierung
14. `supabase/moderation_ausbau.sql` – Admin-Rolle, Verbergen von Partys,
    Rückmeldung an Meldende und die automatische Notbremse

**Moderator werden:** In Supabase unter Table Editor → `profiles` beim eigenen
Eintrag `is_admin` auf `true` setzen. Danach erscheint im Konto-Menü der
Punkt „Moderation".

Zum Aufräumen während der Entwicklung: `supabase/alles_zuruecksetzen.sql`
löscht **alle** Partys der Datenbank (Accounts bleiben). Für die eigenen
Lobbys gibt es denselben Knopf auch in der App unter „Meine Lobbys".

Falls beim Aufräum-Skript die Meldung „pg_cron nicht verfügbar" erscheint:
Die Erweiterung unter **Database → Extensions → pg_cron** aktivieren und das
Skript erneut ausführen. Alternativ lässt sich die Funktion jederzeit von Hand
mit `select * from public.cleanup_old_data();` ausführen.

### E-Mail-Benachrichtigungen (optional)
Trage `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` und `NOTIFY_FROM_EMAIL` in
`.env.local` ein (Vorlage in `env-example.txt`). Dann bekommt der Host eine
Mail bei neuen Anfragen und der Gast eine Mail bei Zu- oder Absage. Ohne diese
Werte läuft alles wie bisher, nur ohne Mails. Der Service-Role-Key gehört
ausschließlich in `.env.local` – er hat volle Rechte auf die Datenbank.

Gemeldete Inhalte prüfst du vorerst direkt im Supabase-Dashboard unter
**Table Editor → reports** (Status auf `reviewed` oder `dismissed` setzen).

### Testdaten (optional)
`supabase/testdaten.sql` legt 10 Beispielpartys mit unterschiedlichen
Konfigurationen an – erst ausführen, nachdem du dich einmal in der App
registriert hast. `supabase/testdaten_entfernen.sql` löscht sie wieder.

### 5. E-Mail-Bestätigung bei der Registrierung (optional prüfen)
Standardmäßig verlangt Supabase, dass neue Nutzer ihre E-Mail bestätigen,
bevor sie eingeloggt sind. Für schnelles lokales Testen kannst du das unter
**Authentication → Providers → Email → "Confirm email"** in Supabase
deaktivieren. Für den späteren Live-Betrieb sollte es wieder aktiviert sein.

### 6. Lokal starten

```bash
npm run dev
```

Danach ist die App unter `http://localhost:3000` erreichbar.

## Projektstruktur

```
src/
  app/                 Next.js App-Router-Seiten
    page.tsx           Feed (öffentlich)
    karte/               Kartenansicht mit Leaflet/OpenStreetMap (öffentlich)
    party/[id]/         Detailansicht + Beitrittsformular (Login nötig)
    host/create/         Party erstellen (Login nötig)
    login/               Login (E-Mail + Passwort)
    signup/              Registrierung (E-Mail + Passwort + Geburtsdatum)
  components/          Wiederverwendbare UI-Bausteine (AuthNav, PartyMap, ...)
  lib/supabase/        Supabase-Client (Browser & Server)
  lib/parties.ts       Mapping: Supabase-Zeile -> App-Datenmodell
  types/               Domänen-Typen (Party, JoinRequest, ...)
  data/                Beispieldaten (Fallback bei Verbindungsproblemen)
  middleware.ts        Hält die Login-Session aktuell
supabase/
  schema.sql            Datenbankschema + RLS-Policies
  auth_trigger.sql       Automatische Profilanlage bei Registrierung
  grants.sql             Grundzugriffsrechte für anon/authenticated
  party_addresses.sql    Geschützte Tabelle für genaue Adressen
public/
  manifest.json        PWA-Manifest
```
