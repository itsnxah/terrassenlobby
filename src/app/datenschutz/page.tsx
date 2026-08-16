import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";
import { BETREIBER } from "@/lib/legal";

export const metadata: Metadata = { title: "Datenschutz – Terrassenlobby" };

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro="Wie Terrassenlobby mit deinen Daten umgeht – insbesondere mit Adressen und Standorten."
    >
      <H2>1. Verantwortlicher</H2>
      <P>
        {BETREIBER.name}, {BETREIBER.strasse}, {BETREIBER.ort},{" "}
        {BETREIBER.land}. E-Mail: {BETREIBER.email}. Eine Datenschutzbeauftragte
        oder einen Datenschutzbeauftragten müssen wir nicht benennen.
      </P>

      <H2>2. Kurzfassung</H2>
      <UL
        items={[
          "Deine genaue Adresse als Host sehen nur Gäste, deren Anfrage du angenommen hast – alle anderen sehen ausschließlich einen bewusst ungenauen Umkreis.",
          "Wer wen wie bewertet hat, ist für niemanden einsehbar, auch nicht für dich selbst. Sichtbar sind nur Durchschnitt und Anzahl.",
          "Wir setzen keine Tracking- oder Werbe-Cookies ein und verkaufen keine Daten.",
          "Deinen Gerätestandort fragen wir erst ab, wenn du aktiv darauf tippst – er verlässt deinen Browser nicht.",
        ]}
      />

      <H2>3. Welche Daten wir verarbeiten</H2>
      <UL
        items={[
          "Kontodaten: Anzeigename, E-Mail-Adresse, Geburtsdatum und Passwort. Das Passwort wird ausschließlich als Hashwert gespeichert, wir können es nicht einsehen. Das Geburtsdatum ist für andere Nutzerinnen und Nutzer technisch nicht abrufbar; aus ihm wird nur abgeleitet, ob du eine Party ab 16 oder ab 18 sehen darfst.",
          "Nachweis deiner Zustimmung zu Nutzungsbedingungen und Datenschutzerklärung: Zeitpunkt und die jeweils akzeptierte Fassung.",
          "Party-Daten: Titel, Beschreibung, Zeitpunkt, Kategorien, Altersfreigabe, Angabe zu Alkohol, Platzangaben sowie der ungefähre Standort.",
          "Die genaue Adresse einer Party – getrennt von den übrigen Party-Daten gespeichert und gesondert geschützt.",
          "Fotos, die Gastgeber zu ihrer Party hochladen, samt Kommentaren dazu.",
          "Beitrittsanfragen: Nachricht an den Host, Personenanzahl, voraussichtliche Ankunftszeit, Status der Anfrage, Antwort des Hosts und ob du vor Ort eingecheckt hast.",
          "Bewertungen: Sternebewertung und optionaler Text, jeweils für eine Party oder einen Gast.",
          "Meldungen und Blockierungen, damit wir gegen Missbrauch vorgehen können.",
          "Technische Daten: IP-Adresse, Zeitpunkt und aufgerufene Seite in den Server-Logs unserer Dienstleister.",
        ]}
      />

      <H2>4. Adressen und Standortdaten</H2>
      <P>
        Standortdaten sind besonders sensibel, deshalb behandeln wir sie
        gesondert. Öffentlich sichtbar ist nie die Adresse einer Party, sondern
        nur ein Kreis, dessen Mittelpunkt absichtlich gegenüber der echten
        Adresse verschoben ist – aus dem Kreis lässt sich das Haus also nicht
        zurückrechnen.
      </P>
      <P>
        Die genaue Adresse sehen ausschließlich der Host selbst und Gäste, deren
        Beitrittsanfrage angenommen wurde. Diese Beschränkung ist nicht nur in
        der Oberfläche umgesetzt, sondern direkt in der Datenbank über
        Zugriffsregeln abgesichert: Auch bei einem Fehler in der App könnte die
        Adresse nicht ungewollt ausgeliefert werden.
      </P>
      <P>
        Auf deinen eigenen Gerätestandort greifen wir nicht automatisch zu. Erst
        wenn du aktiv auf die entsprechende Schaltfläche tippst, fragt dein
        Browser dich um Erlaubnis. Dein Standort wird dabei nur lokal verwendet,
        um die Karte zu zentrieren – er wird nicht an uns übertragen und nicht
        gespeichert. Du kannst die Erlaubnis jederzeit in deinen
        Browsereinstellungen widerrufen, ohne dass dir Nachteile entstehen.
      </P>

      <H2>5. Bewertungen</H2>
      <P>
        Bewerten kann nur, wer nachweislich auf der Party war: Der Host bestätigt
        dazu, dass ein Gast eingecheckt hat. Wer eine Bewertung abgegeben hat und
        wie sie ausgefallen ist, kann niemand einsehen – weder die bewertete
        Person noch wir im laufenden Betrieb. Nach außen sichtbar sind
        ausschließlich Durchschnittswert und Anzahl.
      </P>

      <H2>6. Meldungen und Moderation</H2>
      <P>
        Wird eine Party gemeldet, verarbeiten wir die Meldung samt Begründung,
        um sie zu prüfen. Die meldende Person erfährt das Ergebnis, die
        betroffene Person erfährt die Maßnahme und deren Begründung. Erreicht
        eine Party mehrere unabhängige Meldungen, wird sie vorsorglich
        ausgeblendet, bis wir sie geprüft haben. Automatisierte Entscheidungen
        mit rechtlicher Wirkung im Sinne von Art. 22 DSGVO treffen wir nicht –
        über Maßnahmen entscheidet ein Mensch.
      </P>

      <H2>7. Rechtsgrundlagen</H2>
      <UL
        items={[
          "Erfüllung des Nutzungsvertrags (Art. 6 Abs. 1 lit. b DSGVO) für Konto, Partys, Beitrittsanfragen und Bewertungen",
          "Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) für den Zugriff auf deinen Gerätestandort",
          "Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO) an Sicherheit, Missbrauchsbekämpfung und Betriebsfähigkeit der Plattform",
          "Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO) bei der Bearbeitung von Meldungen nach dem Digital Services Act und bei der Dokumentation von Einwilligungen",
        ]}
      />

      <H2>8. Empfänger und Hosting</H2>
      <UL
        items={[
          "Vercel: Betrieb der Website. Dabei fallen Server-Logs mit IP-Adresse an. Die Auslieferung erfolgt über Server in der EU; eine Übermittlung in die USA ist nicht ausgeschlossen und stützt sich auf Standardvertragsklauseln.",
          "Supabase: Datenbank, Anmeldung und Speicherung der Fotos. Es besteht ein Auftragsverarbeitungsvertrag, der gewählte Serverstandort liegt in der EU.",
          "OpenStreetMap und CARTO: Kartenkacheln. Beim Anzeigen der Karte wird deine IP-Adresse an diese Dienste übermittelt.",
          "OpenStreetMap (Nominatim): Beim Anlegen einer Party wird die eingegebene Adresse in Koordinaten umgerechnet. Diese Anfrage stellt unser Server, nicht dein Browser – deine IP-Adresse wird dabei nicht weitergegeben.",
          "Resend: Versand der Benachrichtigungs-E-Mails. Übermittelt werden Empfängeradresse und Anlass der Nachricht.",
        ]}
      />
      <P>
        Darüber hinaus geben wir deine Daten nicht weiter, außer wir sind
        gesetzlich dazu verpflichtet. Ein Verkauf von Daten findet nicht statt.
      </P>

      <H2>9. Speicherdauer</H2>
      <UL
        items={[
          "Genaue Party-Adressen werden spätestens 30 Tage nach dem Ende der Party automatisch gelöscht",
          "Beitrittsanfragen werden spätestens 90 Tage nach dem Ende der Party automatisch gelöscht",
          "Löscht ein Host seine Party, verschwinden Adresse, Fotos, Anfragen und Bewertungen dieser Party sofort mit",
          "Kontodaten werden sofort und unwiderruflich gelöscht, sobald du dein Konto in deinem Profil unter „Konto endgültig löschen“ selbst entfernst – alternativ per E-Mail an uns",
          "Meldungen und die dazugehörigen Entscheidungen bewahren wir auf, solange das zur Bearbeitung, zur Dokumentation und zur Abwehr wiederholten Missbrauchs erforderlich ist",
        ]}
      />

      <H2>10. Deine Rechte</H2>
      <P>
        Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16),
        Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18),
        Datenübertragbarkeit (Art. 20) sowie Widerspruch gegen die Verarbeitung
        (Art. 21 DSGVO). Eine erteilte Einwilligung kannst du jederzeit mit
        Wirkung für die Zukunft widerrufen. Wende dich dafür an{" "}
        {BETREIBER.email} – wir antworten innerhalb eines Monats.
      </P>
      <P>
        Außerdem steht dir ein Beschwerderecht bei einer
        Datenschutz-Aufsichts&shy;behörde zu, in der Regel bei der Behörde deines
        Wohnsitzlandes.
      </P>

      <H2>11. Cookies</H2>
      <P>
        Wir setzen ausschließlich technisch notwendige Cookies ein, die deine
        Anmeldung aufrechterhalten. Tracking-, Analyse- oder Werbe-Cookies
        verwenden wir nicht, daher gibt es auch kein Einwilligungsbanner. Meldest
        du dich ab, werden diese Cookies gelöscht.
      </P>

      <H2>12. Änderungen dieser Erklärung</H2>
      <P>
        Entwickelt sich die App weiter, passen wir diese Erklärung an. Bei
        wesentlichen Änderungen informieren wir dich beim nächsten Login.
      </P>
    </LegalPage>
  );
}
