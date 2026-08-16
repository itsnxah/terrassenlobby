# Terrassenlobby online stellen

Zwei Wege – der erste dauert zwei Minuten und reicht für einen schnellen
Blick vom Handy, der zweite ist der richtige, wenn andere Leute mittesten
sollen.

---

## Weg 1: Im eigenen WLAN testen (2 Minuten)

Dein Rechner liefert die App aus, dein Handy ruft sie über die lokale
IP-Adresse ab. Beide Geräte müssen im selben WLAN sein.

**1. IP-Adresse herausfinden.** In der PowerShell:

```powershell
ipconfig
```

Suche die Zeile **IPv4-Adresse** beim WLAN-Adapter, z. B. `192.168.1.42`.

**2. Dev-Server für das Netzwerk öffnen:**

```powershell
npm run dev -- -H 0.0.0.0
```

**3. Am Handy aufrufen:** `http://192.168.1.42:3000` (deine IP einsetzen).

Beim ersten Start fragt die Windows-Firewall, ob Node.js im Netzwerk
erreichbar sein darf – das musst du erlauben (private Netzwerke reichen).

### Was dabei nicht funktioniert
Die Verbindung läuft über `http://`, nicht `https://`. Browser stufen das als
unsicher ein und sperren deshalb:

- **Standortfreigabe** auf der Karte („Standort verwenden“ bleibt wirkungslos)
- **Installieren als App** auf dem Homescreen

Für Layout, Anlegen von Partys, Anfragen, Fotos und Bewertungen reicht es
trotzdem völlig.

---

## Weg 2: Bei Vercel veröffentlichen (empfohlen, ~10 Minuten)

Vercel ist von denselben Leuten wie Next.js und für Projekte dieser Größe
kostenlos. Du bekommst eine echte HTTPS-Adresse wie
`terrassenlobby.vercel.app`, die du jedem schicken kannst.

### Vorher: Prüfen, ob das Projekt fehlerfrei baut

```powershell
npm run build
```

Das ist strenger als `npm run dev` – Tippfehler in Typen fallen erst hier auf.
Wenn Fehler erscheinen: Meldung kopieren und mir schicken, bevor du weiter
machst.

### Schritt 1: Vercel-Konto und Veröffentlichung

Im Projektordner:

```powershell
npx vercel
```

Beim ersten Mal:

1. `Continue with GitHub` (oder E-Mail) wählen – der Browser öffnet sich zum Anmelden
2. „Set up and deploy?“ → **Y**
3. „Which scope?“ → dein eigener Account
4. „Link to existing project?“ → **N**
5. Projektname → `terrassenlobby` (oder Enter für den Vorschlag)
6. „In which directory is your code located?“ → Enter (aktueller Ordner)
7. Einstellungen überschreiben? → **N**

Am Ende steht eine Adresse in der Konsole. Die App ist erreichbar, wird aber
noch nicht funktionieren – es fehlen die Zugangsdaten.

### Schritt 2: Umgebungsvariablen bei Vercel eintragen

Auf [vercel.com](https://vercel.com) → dein Projekt → **Settings** →
**Environment Variables**. Dort dieselben Werte anlegen wie in deiner
`.env.local`:

| Name | Wert |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | deine Supabase-URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | dein anon-Key |
| `NEXT_PUBLIC_APP_URL` | die Vercel-Adresse, z. B. `https://terrassenlobby.vercel.app` |
| `SUPABASE_SERVICE_ROLE_KEY` | nur wenn du E-Mails nutzt |
| `RESEND_API_KEY` | nur wenn du E-Mails nutzt |
| `NOTIFY_FROM_EMAIL` | nur wenn du E-Mails nutzt |
| `MODERATION_EMAIL` | nur wenn du E-Mails nutzt |

Die drei ohne `NEXT_PUBLIC_` sind Geheimnisse und bleiben serverseitig –
genau deshalb dürfen sie dort stehen, aber niemals im Code.

### Schritt 3: Supabase über die neue Adresse informieren

Sonst führen die Bestätigungslinks aus den Registrierungs-Mails weiterhin auf
`localhost` und funktionieren auf fremden Geräten nicht.

Supabase → **Authentication** → **URL Configuration**:

- **Site URL:** `https://terrassenlobby.vercel.app`
- **Redirect URLs:** dieselbe Adresse ergänzen (localhost darf bleiben)

### Schritt 4: Erneut veröffentlichen

Damit die Variablen greifen:

```powershell
npx vercel --prod
```

Diesen Befehl brauchst du künftig nach jeder Änderung, die online sichtbar
sein soll.

---

## Nach dem Veröffentlichen testen

- [ ] Registrieren mit einer echten E-Mail-Adresse
- [ ] Party anlegen mit Foto und echter Adresse
- [ ] Auf der Karte prüfen, ob der Umkreis am richtigen Ort liegt
- [ ] Mit einem zweiten Gerät anfragen, als Host annehmen
- [ ] „Ich bin da“ und danach die Bewertung
- [ ] Auf dem Handy: Browser-Menü → „Zum Startbildschirm hinzufügen“

---

## Zwei Hinweise, bevor du das breit teilst

**Es gibt noch keine Sicherung deines Codes.** Alles liegt nur in diesem
einen Ordner. Ein GitHub-Repository wäre sinnvoll – dann hast du Versionsstand
und Backup, und Vercel veröffentlicht bei jeder Änderung automatisch.

**Die Rechtstexte sind Entwürfe mit Platzhaltern.** Solange nur Freunde
testen, ist das vertretbar. Sobald die App öffentlich beworben wird, müssen
Impressum, Datenschutzerklärung und Nutzungsbedingungen ausgefüllt und
geprüft sein – und bei Supabase sollten EU-Region und Auftragsverarbeitungs-
vertrag stehen.
