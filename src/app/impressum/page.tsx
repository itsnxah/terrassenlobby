import type { Metadata } from "next";
import { LegalPage, H2, P } from "@/components/LegalPage";
import { BETREIBER } from "@/lib/legal";

export const metadata: Metadata = { title: "Impressum – Terrassenlobby" };

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      intro="Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)."
    >
      <H2>Diensteanbieter</H2>
      <P>
        {BETREIBER.name}
        <br />
        {BETREIBER.strasse}
        <br />
        {BETREIBER.ort}
        <br />
        {BETREIBER.land}
      </P>
      <P>
        Terrassenlobby wird privat und nicht gewerblich betrieben. Es werden
        keine Entgelte erhoben und keine Einnahmen erzielt.
      </P>

      <H2>Kontakt</H2>
      <P>
        E-Mail: {BETREIBER.email}
        {BETREIBER.telefon && (
          <>
            <br />
            Telefon: {BETREIBER.telefon}
          </>
        )}
      </P>

      <H2>Verantwortlich für den Inhalt</H2>
      <P>{BETREIBER.name}, Anschrift wie oben.</P>

      <H2>Zentrale Kontaktstelle nach dem Digital Services Act</H2>
      <P>
        Für Behörden, für Meldungen zu Inhalten und für alle Anliegen rund um
        die Moderation erreichst du uns unter {BETREIBER.email}. Die
        Kommunikation ist in deutscher und englischer Sprache möglich.
      </P>

      <H2>Meldungen zu Inhalten</H2>
      <P>
        Rechtswidrige oder unangemessene Inhalte kannst du direkt in der App
        melden – die Schaltfläche findest du unter jeder Party. Alternativ
        erreichst du uns per E-Mail. Wir prüfen jede Meldung, entscheiden
        begründet und informieren sowohl die meldende Person als auch die
        betroffene Person über das Ergebnis.
      </P>

      <H2>Haftung für Inhalte und Links</H2>
      <P>
        Für eigene Inhalte sind wir nach den allgemeinen Gesetzen
        verantwortlich. Für von Nutzerinnen und Nutzern eingestellte Inhalte
        sind wir nicht verantwortlich, solange wir von einer konkreten
        Rechtsverletzung keine Kenntnis haben. Sobald uns eine solche bekannt
        wird, entfernen wir den Inhalt unverzüglich.
      </P>

      <H2>Streitbeilegung</H2>
      <P>
        Wir sind nicht bereit und nicht verpflichtet, an
        Streitbeilegungs&shy;verfahren vor einer Verbraucherschlichtungsstelle
        teilzunehmen.
      </P>
    </LegalPage>
  );
}
