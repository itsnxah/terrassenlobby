import type { Metadata } from "next";
import { LegalPage, H2, P, UL } from "@/components/LegalPage";
import { BETREIBER } from "@/lib/legal";

export const metadata: Metadata = { title: "Nutzungsbedingungen – Terrassenlobby" };

export default function AgbPage() {
  return (
    <LegalPage
      title="Nutzungsbedingungen"
      intro="Die Spielregeln für Hosts und Gäste auf Terrassenlobby."
    >
      <H2>1. Was Terrassenlobby ist – und was nicht</H2>
      <P>
        Terrassenlobby ist eine Plattform, über die private Gastgeber ihre Partys
        sichtbar machen und Gäste eine Beitrittsanfrage stellen können. Wir sind
        weder Veranstalter noch Vertragspartner der Partys und übernehmen keine
        Vermittlung im rechtlichen Sinn – wir stellen ausschließlich die
        technische Plattform bereit. Ob eine Party stattfindet, wer eingeladen
        wird und was dort passiert, entscheiden allein Host und Gäste.
      </P>
      <P>
        Die Nutzung ist kostenlos. Ein Anspruch auf ständige Verfügbarkeit
        besteht nicht; wir dürfen den Dienst warten, ändern oder – mit
        angemessener Vorankündigung – einstellen.
      </P>

      <H2>2. Konto und Mindestalter</H2>
      <P>
        Für ein Konto musst du mindestens 16 Jahre alt sein und wahrheitsgemäße
        Angaben machen, insbesondere zum Geburtsdatum. Hosts legen für jede Party
        fest, ob sie ab 16 oder ab 18 Jahren offen ist; Partys ab 18 werden
        jüngeren Nutzerinnen und Nutzern gar nicht erst angezeigt. Dein Zugang
        ist persönlich – gib deine Zugangsdaten nicht weiter.
      </P>
      <P>
        Mit der Registrierung bestätigst du, diese Nutzungsbedingungen und die
        Datenschutzerklärung gelesen zu haben und ihnen zuzustimmen.
      </P>

      <H2>3. Pflichten der Hosts</H2>
      <UL
        items={[
          "Angaben zur Party müssen wahrheitsgemäß sein, insbesondere Adresse, Zeitpunkt, Altersfreigabe und Platzangaben",
          "Du darfst nur Räumlichkeiten anbieten, über die du tatsächlich verfügen darfst",
          "Du bist für die Einhaltung von Jugendschutz, Lärmschutz, Hausrecht und aller weiteren Vorschriften vor Ort allein verantwortlich",
          "Der Ausschank von Alkohol an Minderjährige unterliegt dem Jugendschutzgesetz und ist ausschließlich deine Verantwortung",
          "Du entscheidest frei über Beitrittsanfragen – eine Ablehnung darf aber nicht aus diskriminierenden Gründen erfolgen",
          "Fotos darfst du nur hochladen, wenn du die Rechte daran hast und abgebildete Personen einverstanden sind",
        ]}
      />

      <H2>4. Pflichten der Gäste</H2>
      <UL
        items={[
          "Erscheine nur, wenn deine Anfrage angenommen wurde, und halte dich an die Regeln des Hosts",
          "Gib die genaue Adresse nicht weiter – sie ist ausschließlich für dich bestimmt. Auch private Einladungslinks gehören nicht in offene Gruppen oder soziale Netzwerke",
          "Sag ab, wenn du doch nicht kommst, damit der Platz frei wird",
          "Verhalte dich respektvoll gegenüber Host, anderen Gästen und der Nachbarschaft",
        ]}
      />

      <H2>5. Verbotene Inhalte und Verhalten</H2>
      <UL
        items={[
          "Belästigung, Bedrohung, Hassrede und Diskriminierung",
          "Sexualisierte Inhalte sowie jede Form der Gefährdung von Minderjährigen",
          "Werbung für illegale Substanzen oder Straftaten",
          "Fake-Partys, Partys, die in Wahrheit einem anderen Zweck dienen, Spam und das Erschleichen fremder Adressen",
          "Automatisiertes Auslesen der Plattform sowie Versuche, die Zugriffsbeschränkungen zu umgehen",
        ]}
      />

      <H2>6. Bewertungen</H2>
      <P>
        Bewerten darf nur, wer tatsächlich vor Ort war und vom Host eingecheckt
        wurde. Bewertungen müssen sich auf die eigene Erfahrung beziehen und
        dürfen weder beleidigend noch unwahr sein. Gekaufte, getauschte oder aus
        sachfremden Gründen abgegebene Bewertungen sind unzulässig und werden
        entfernt. Sichtbar sind ausschließlich Durchschnitt und Anzahl.
      </P>

      <H2>7. Melden, Maßnahmen und Widerspruch</H2>
      <P>
        Jede Party lässt sich über die Melden-Schaltfläche beanstanden. Wir
        prüfen jede Meldung und können Inhalte entfernen, Partys ausblenden oder
        Konten sperren. Erreicht eine Party mehrere unabhängige Meldungen, blenden
        wir sie vorsorglich aus, bis die Prüfung abgeschlossen ist.
      </P>
      <P>
        Über eine Maßnahme informieren wir die betroffene Person unter Angabe des
        Grundes. Wer mit einer Entscheidung nicht einverstanden ist, kann ihr
        innerhalb von sechs Monaten formlos an {BETREIBER.email} widersprechen –
        wir prüfen den Fall dann erneut. Auch die meldende Person erfährt, wie
        entschieden wurde. Wer wiederholt offensichtlich unbegründete Meldungen
        abgibt, kann von der Meldefunktion ausgeschlossen werden.
      </P>

      <H2>8. Sicherheit auf Partys</H2>
      <P>
        Du triffst dich mit Menschen, die du über das Internet gefunden hast.
        Nutze die Funktion „Freund informieren“, sag jemandem Bescheid, wo du
        hingehst, und brich ab, wenn dir etwas seltsam vorkommt. Wir können weder
        Identitäten noch die Angaben zu einer Party überprüfen.
      </P>

      <H2>9. Rechte an deinen Inhalten</H2>
      <P>
        Deine Texte und Fotos bleiben deine. Du räumst uns nur das Recht ein, sie
        im Rahmen der Plattform anzuzeigen und technisch zu verarbeiten – etwa
        Vorschaubilder zu erzeugen. Löschst du einen Inhalt, endet dieses Recht.
      </P>

      <H2>10. Haftung</H2>
      <P>
        Für Schäden, die auf einer Party entstehen, haften Host und Gäste
        untereinander nach den allgemeinen gesetzlichen Regeln. Wir haften
        unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung
        von Leben, Körper und Gesundheit. Bei einfacher Fahrlässigkeit haften wir
        nur für die Verletzung wesentlicher Vertragspflichten und der Höhe nach
        begrenzt auf den vorhersehbaren, typischen Schaden. Für
        nutzergenerierte Inhalte haften wir erst ab Kenntnis einer konkreten
        Rechtsverletzung.
      </P>

      <H2>11. Beendigung</H2>
      <P>
        Du kannst die Löschung deines Kontos jederzeit per E-Mail an{" "}
        {BETREIBER.email} verlangen; eigene Partys kannst du jederzeit selbst
        schließen oder löschen. Wir können das Nutzungsverhältnis bei
        erheblichen oder wiederholten Verstößen gegen diese Bedingungen beenden –
        vorher weisen wir dich in der Regel darauf hin, außer bei schweren
        Verstößen.
      </P>

      <H2>12. Änderungen und Schlussbestimmungen</H2>
      <P>
        Änderungen dieser Bedingungen kündigen wir mindestens zwei Wochen vorher
        an. Widersprichst du nicht und nutzt die App weiter, gelten sie als
        angenommen. Es gilt deutsches Recht; zwingende Verbraucherschutzvorschriften
        deines Wohnsitzlandes bleiben unberührt. Sollte eine Regelung unwirksam
        sein, bleibt der Rest wirksam.
      </P>
    </LegalPage>
  );
}
