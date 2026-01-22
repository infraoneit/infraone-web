import { Metadata } from 'next';

export interface BlogPost {
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    date: string;
    author: string;
    category: string;
    keywords: string[];
    readingTime: string;
    featuredImage?: string; // Optionales Titelbild (Pfad zum Bild)
}

export const blogPosts: BlogPost[] = [
    {
        slug: 'it-trifft-ot',
        title: 'IT trifft OT – Unterschied IT und OT Systeme',
        excerpt: 'IT und OT wachsen zusammen. Erfahren Sie, warum diese Konvergenz zur Schlüsselkompetenz moderner Unternehmen wird und welche Sicherheitsrisiken dabei entstehen.',
        date: '2025-01-15',
        author: 'InfraOne Team',
        category: 'IT-Wissen',
        keywords: ['IT OT Unterschied', 'IT OT Konvergenz', 'Industrie 4.0', 'OT Security'],
        readingTime: '6 Min.',
        content: `
## IT trifft OT – Warum die Verbindung zur Schlüsselkompetenz wird

Die Digitalisierung verändert nicht nur Büros, sondern auch Produktionshallen, Gebäude und Infrastrukturen. Dabei treffen zwei Welten aufeinander: **IT (Information Technology)** und **OT (Operational Technology)**. Die Konvergenz dieser Systeme ist heute entscheidend für den Erfolg moderner Unternehmen.

### Was ist der Unterschied zwischen IT und OT?

**IT (Informationstechnologie)** umfasst alle Systeme zur Verarbeitung und Speicherung von Daten:
- Server, PCs, Netzwerke
- ERP-Systeme, CRM, Cloud-Dienste
- E-Mail, Collaboration-Tools

**OT (Operational Technology)** steuert physische Prozesse und Maschinen:
- SPS-Steuerungen (z.B. WAGO, Siemens)
- Gebäudeautomation (HLK, Licht, Zutritt)
- Produktionsanlagen und Sensoren
- SCADA- und MES-Systeme

### Warum wachsen IT und OT zusammen?

Die Industrie 4.0 und Smart-Building-Trends erfordern eine Vernetzung beider Welten:

- **Echtzeitdaten** aus der Produktion für Business Intelligence
- **Remote-Zugriff** auf Maschinen und Anlagen
- **Automatisierung** von Prozessen über Systemgrenzen hinweg
- **Predictive Maintenance** durch Sensor-Datenanalyse

### Sicherheitsrisiken der IT/OT-Konvergenz

Die Verschmelzung bringt erhebliche Cybersecurity-Herausforderungen:

1. **Veraltete OT-Systeme**: Viele Steuerungen laufen seit Jahrzehnten ohne Updates
2. **Keine Patches möglich**: Produktionsunterbrechungen sind oft nicht akzeptabel
3. **Fehlende Segmentierung**: Direkter Zugriff von IT auf OT-Netzwerke
4. **Unzureichendes Monitoring**: OT-Protokolle werden nicht überwacht

### Empfehlungen für KMU

Für eine sichere IT/OT-Integration empfehlen wir:

- **Netzwerksegmentierung**: OT-Systeme in eigene VLANs isolieren
- **Firewall-Regeln**: Nur notwendige Verbindungen erlauben
- **Monitoring**: [PRTG oder ähnliche Tools](/blog/prtg-netzwerkmonitoring) auch für OT-Protokolle nutzen
- **Notfallplan**: Incident Response Prozesse definieren
- **Schulung**: Mitarbeiter für beide Welten sensibilisieren

### Fazit

Die Konvergenz von IT und OT ist keine Option, sondern Notwendigkeit. Wer beide Welten versteht und sicher verbindet, gewinnt Wettbewerbsvorteile. [InfraOne IT Solutions](/it-support) unterstützt Sie bei der Planung und Umsetzung Ihrer IT/OT-Strategie.
        `.trim(),
    },
    {
        slug: 'multimonitor-systeme-black-box-emerald',
        title: 'Multimonitor-Systeme mit Black Box Emerald – KVM-over-IP Lösungen',
        excerpt: 'Moderne KVM-over-IP Multimonitor-Systeme mit Black Box Emerald ermöglichen flexible und zentrale Steuerung in Kontrollräumen, Leitständen und Sicherheitszentralen.',
        date: '2025-01-10',
        author: 'InfraOne Team',
        category: 'Kontrollraum',
        keywords: ['KVM over IP', 'Black Box Emerald', 'Kontrollraum', 'Multimonitor', 'Leitstand'],
        readingTime: '7 Min.',
        content: `
## Multimonitor-Systeme mit Black Box Emerald – die smarte Lösung für Kontrollräume

Die Anforderungen an Kontrollräume, Leitstände und sicherheitskritische Umgebungen steigen stetig. Systeme müssen heute nicht nur hochverfügbar und skalierbar sein, sondern auch flexibel, bedienerfreundlich und IP-basiert.

Mit **Black Box Emerald** steht eine moderne KVM-over-IP-Lösung zur Verfügung, die genau diese Anforderungen erfüllt – für Multiuser-Zugriff, 4K-Videoübertragung, USB-Routing und zentralisierte Steuerung.

### Vorteile von Black Box Emerald

- **Zentrale Bedienung** mehrerer Rechner über IP – lokal und remote
- **4K- und HD-Videoübertragung** mit geringer Latenz
- **Skalierbar** für Video Walls und grosse Leitstellen
- **Multimonitor-Unterstützung** (Single/Dual/Quad-Setup)
- **Nahtlose Integration** mit Emerald PE, SE, 4K und ZeroU Gateways
- **Redundanz und Sicherheit** durch verschlüsselten Datenverkehr
- **KVM-Matrix-Manager** für intuitives Umschalten und Steuerung

### Typische Anwendungsbereiche

- Polizei- und Sicherheitszentralen
- Leitstände in Energie, Verkehr oder Industrie
- Banken und Kontrollräume mit hohen Sicherheitsanforderungen
- Broadcast & Videoüberwachungssysteme
- IT-Infrastrukturen mit Multiuser-Zugriff

### Kurze Anleitung zur Inbetriebnahme

#### 1. Planung & Topologie
Definiere die Monitore, Transmitter, Receiver und benötigten Arbeitsplätze. Plane die Netzwerksegmente und mögliche Redundanz.

#### 2. Hardware anschliessen
Transmitter an die Quellen (Server, PC, Video-Encoder), Receiver an die Monitore. Alle Geräte ins gleiche IP-Netzwerk einbinden.

#### 3. Emerald Manager konfigurieren
Der Boxilla KVM-Manager erkennt automatisch die Geräte und ermöglicht die Zuweisung von Quellen zu Arbeitsplätzen.

#### 4. Benutzer & Profile anlegen
Verwalte Zugriffsrechte pro Benutzer oder Gruppe. Besonders nützlich für zeitkritische Umgebungen oder Schichtbetrieb.

#### 5. Videoqualität und USB-Routing einstellen
Passe Auflösung, Bandbreite und USB-Zugriff für jede Station individuell an – z.B. für Maus/Tastatur, Touchscreens oder Smartcards.

#### 6. Testen und optimieren
Stelle sicher, dass alle Umschaltungen verzögerungsfrei funktionieren und die Videoqualität den Anforderungen entspricht.

### Fazit

Black Box Emerald ist ideal für professionelle Anwendungen, bei denen es auf Stabilität, Bedienkomfort und Flexibilität ankommt. Die Multimonitor-Funktionalität und IP-basierte Architektur machen das System zukunftssicher – und bestens geeignet für zentrale IT-Infrastrukturen und moderne Leitstellen.

**Wenn du Unterstützung bei der Planung oder Umsetzung brauchst:** InfraOne IT Solutions bietet Beratung, Installation und Support für Black Box KVM-Systeme in der Schweiz. Erfahren Sie mehr über unsere [Kontrollraum-Lösungen](/kontrollraum).
        `.trim(),
    },
    {
        slug: 'moderne-telefonie-peoplefone-3cx',
        title: 'Moderne Telefonie mit peoplefone und 3CX',
        excerpt: 'Die Verbindung von 3CX mit Peoplefone bietet Unternehmen eine zuverlässige und flexible VoIP-Telefonielösung. Schritt-für-Schritt zur modernen Telefonanlage.',
        date: '2025-01-05',
        author: 'InfraOne Team',
        category: 'Telefonie',
        keywords: ['3CX peoplefone', 'VoIP Telefonanlage', 'SIP Trunk Schweiz', 'Cloud Telefonie KMU'],
        readingTime: '5 Min.',
        content: `
## Vorteile der Kombination 3CX und Peoplefone

Die Verbindung von 3CX mit Peoplefone bietet Unternehmen eine zuverlässige und flexible Telefonielösung. Durch die direkte Integration in 3CX ist die Einrichtung einfach und schnell erledigt. Peoplefone überzeugt mit attraktiven Preisen, lokalem Support und stabiler Sprachqualität.

3CX ermöglicht standortunabhängiges Arbeiten über Desktop, App oder Webclient – ideal für Homeoffice oder mobile Teams. Die Lösung ist skalierbar, kosteneffizient und funktioniert mit vielen gängigen IP-Telefonen. So erhalten KMU eine professionelle [Kommunikationslösung](/cloud-telefonie), die sich an ihre Bedürfnisse anpasst.

## 3CX mit Peoplefone verbinden – Schritt-für-Schritt

Die Kombination von 3CX und Peoplefone ist eine beliebte Lösung für Unternehmen, die auf moderne VoIP-Telefonie, Flexibilität und Kosteneffizienz setzen.

### 1. SIP-Trunk in 3CX anlegen
Melde dich in der 3CX Management Console an. Unter dem Menüpunkt „SIP-Trunks" wählst du Peoplefone als Anbieter und gibst deine Hauptnummer ein.

### 2. Zugangsdaten eintragen
Gib die von Peoplefone bereitgestellten SIP-Zugangsdaten ein (Benutzername, Passwort, Hauptnummer). Diese findest du im Kundenportal von Peoplefone.

### 3. Rufnummern & Weiterleitungen einrichten
Erstelle deine DIDs (Durchwahlnummern) und lege fest, wie eingehende Anrufe verteilt werden – z.B. auf Nebenstellen, Gruppen oder Voicemail.

### 4. Ausgehende Regeln konfigurieren
Definiere, wann Anrufe über den Peoplefone-Trunk geleitet werden. Du kannst verschiedene Regeln anlegen, etwa für internationale Anrufe oder Notrufnummern.

### 5. Funktionstest durchführen
Teste eingehende und ausgehende Gespräche und überprüfe die Verbindung in der 3CX-Konsole unter „Activity Log". Achte auch auf die Sprachqualität.

### Warum 3CX mit Peoplefone?

- **Einfache Einrichtung** dank zertifizierter Integration
- **Flexibel einsetzbar** – lokal, in der Cloud oder hybrid
- **Hohe Sprachqualität** & stabile Verbindungen
- **Kompatibel** mit IP-Telefonen, Softphones & MS Teams
- **Schweizer Provider** mit transparenten Kosten

Erfahren Sie mehr über unsere [Cloud-Telefonie Angebote](/cloud-telefonie).

### Fazit

Die Kombination aus 3CX und Peoplefone ist ideal für KMU, die eine moderne, sichere und skalierbare Business-Telefonie suchen. Du profitierst von einer professionellen Anlage, lokalem Support und voller Kostenkontrolle – ohne Kompromisse bei Qualität oder Funktionen.
        `.trim(),
    },
    {
        slug: 'prtg-netzwerkmonitoring',
        title: 'PRTG Netzwerkmonitoring – So behältst du deine IT im Griff',
        excerpt: 'Mit dem PRTG Network Monitor von Paessler kannst du dein gesamtes IT-Netzwerk überwachen, Störungen frühzeitig erkennen und Ausfälle vermeiden.',
        date: '2024-12-20',
        author: 'InfraOne Team',
        category: 'Netzwerke',
        keywords: ['PRTG Netzwerk Monitoring', 'IT Überwachung KMU', 'Netzwerk Monitoring Schweiz', 'Paessler PRTG'],
        readingTime: '6 Min.',
        content: `
## PRTG Netzwerkmonitoring – So behältst du deine IT im Griff

Mit dem PRTG Network Monitor von Paessler kannst du dein gesamtes IT-Netzwerk überwachen, Störungen frühzeitig erkennen und Ausfälle vermeiden. Die Lösung ist flexibel, skalierbar und auch für kleinere Unternehmen bestens geeignet. [Professionelles IT-Monitoring](/it-support) ist heute unverzichtbar.

Ob Server, Firewalls, Switches, Cloud-Dienste oder Internetverbindungen – mit PRTG hast du jederzeit einen vollständigen Überblick über deine IT-Infrastruktur.

### Vorteile von PRTG für Unternehmen

- **Zentrale Übersicht**: Alle Geräte, Verbindungen und Dienste in einer Oberfläche – visuell und in Echtzeit
- **Frühwarnsystem**: Automatische Benachrichtigungen bei Ausfällen oder Grenzwertüberschreitungen
- **Ressourcen sparen**: Weniger manuelle Checks, mehr Effizienz im IT-Betrieb
- **Flexible Sensoren**: Über 250 vordefinierte Sensoren für Netzwerk, Server, SNMP, HTTP, Ping, Cloud, etc.
- **Einfache Einrichtung**: Web-basiertes Interface, schnell implementierbar
- **DSGVO-konform**: Lokale oder private Cloud-Installation möglich – volle Kontrolle über deine Daten

### Erste Schritte – PRTG einrichten

#### 1. Installation starten
Lade PRTG von [paessler.com](https://www.paessler.com) herunter und installiere es auf einem Windows-Server oder einer virtuellen Maschine.

#### 2. Netzwerk scannen lassen
Nach der Installation erkennt PRTG automatisch viele Geräte in deinem Netzwerk (Auto-Discovery). Du kannst zusätzliche IPs oder Subnetze manuell eintragen.

#### 3. Sensoren aktivieren
Füge Sensoren hinzu – zum Beispiel für Ping, CPU-Auslastung, Bandbreite, HTTP-Checks oder Windows-Dienste.

#### 4. Dashboards & Maps anpassen
Erstelle individuelle Übersichten für bestimmte Standorte, Kunden oder Anwendungen – ideal für Managed Services oder interne IT-Abteilungen.

#### 5. Alarme & Benachrichtigungen definieren
Lass dich per E-Mail, SMS oder Push-Nachricht benachrichtigen, wenn ein Gerät ausfällt, die Bandbreite zu hoch ist oder Dienste nicht verfügbar sind.

### Typische Einsatzbereiche für KMU

- Überwachung von Servern, NAS und Firewalls
- Ausfallsicherheit von VoIP-Systemen und Cloud-Diensten
- Kontrolle von Internetverbindung & VPN-Stabilität
- IT-Dokumentation für Audits und ISO 27001-Vorgaben
- Unterstützung von IT-Outsourcing und Managed Services

### Fazit

Mit PRTG behältst du jederzeit die Kontrolle über deine IT – zuverlässig, skalierbar und einfach zu bedienen. Besonders für kleine und mittlere Unternehmen ist es eine leistungsstarke Lösung, um Netzwerkprobleme frühzeitig zu erkennen und Ausfallzeiten zu minimieren. Wir unterstützen Sie gerne beim [IT-Support und Monitoring](/it-support).
        `.trim(),
    },
    {
        slug: 'wago-codesys-migration',
        title: 'WAGO SPS auf Codesys 3.5 Migrieren – So gelingt der Umstieg',
        excerpt: 'CODESYS 3.5 ist heute Standard in der Gebäudeautomation und industriellen Steuerung. So migrierst du deine WAGO SPS-Projekte erfolgreich.',
        date: '2024-12-10',
        author: 'InfraOne Team',
        category: 'Automation',
        keywords: ['WAGO SPS', 'CODESYS 3.5 Migration', 'Gebäudeautomation', 'SPS Programmierung'],
        readingTime: '8 Min.',
        content: `
## WAGO SPS auf Codesys 3.5 Migrieren – So gelingt der Umstieg

CODESYS 3.5 ist heute Standard in der Welt der modernen Gebäudeautomation und industriellen Steuerung. Auch bei WAGO SPS-Systemen lohnt sich die Migration – für mehr Leistung, Modularität und Zukunftssicherheit.

Wenn du noch ältere WAGO-Projekte (z.B. CODESYS 2.3 oder ältere Bibliotheken) betreibst, ist jetzt der richtige Zeitpunkt für die Umstellung.

### Vorteile der Migration auf CODESYS 3.5

- **Moderne Entwicklungsumgebung** mit objektorientierter Programmierung
- **Starke Visualisierungsmöglichkeiten** (WebVisu, HTML5-kompatibel)
- **Mehr Flexibilität** durch strukturierte Projekte & modulare Bibliotheken
- **Aktive Community** & Hersteller-Support
- **Langfristige Wartbarkeit** für professionelle Automationslösungen
- **Kompatibel** mit WAGO PFC100 / PFC200 und anderen CODESYS-kompatiblen Steuerungen

### Schritt-für-Schritt-Anleitung: Migration auf CODESYS 3.5

#### 1. Projektanalyse
Überprüfe deine bestehende CODESYS 2.3 Anwendung: Welche Bibliotheken werden verwendet? Gibt es veraltete Befehle, Visualisierungselemente oder proprietäre Erweiterungen?

#### 2. Neue Projektstruktur anlegen
Erstelle in CODESYS 3.5 ein neues leeres Projekt mit dem passenden Zielsystem (z.B. „WAGO PFC200"). Achte auf die richtige Firmware-Version.

#### 3. Bibliotheken aktualisieren
Verwende aktuelle CODESYS 3.5-Bibliotheken, z.B. WAGOApp PLCCommunication oder WAGOApp Modbus. Vermeide inkompatible Alt-Bibliotheken.

#### 4. Programmcode übertragen und umschreiben
Funktionen, FBs und globale Variablen manuell migrieren. Nutze OOP (Objektorientierung), ENUMs und Interfaces für sauberen, wartbaren Code.

#### 5. Visualisierung neu aufbauen
Nutze WebVisu oder das Visualisierungselement in CODESYS 3.5 – kompatibel mit Browsern ohne zusätzliche Plugins (HTML5).

#### 6. Kompilieren, testen und aufspielen
Baue das Projekt und lade es auf die WAGO SPS. Teste die Ein-/Ausgänge, Protokolle (z.B. Modbus, MQTT) und Visualisierung.

#### 7. Dokumentation anpassen
Passe Projektdokumentation, Netzwerktopologie, IP-Adressen und Benutzerhandbuch an. So bleibt alles auditfähig und nachvollziehbar.

### Anwendungsbeispiele

- Gebäudeleittechnik mit WAGO SPS & Loxone
- HLK-Steuerung, Lichtmanagement und Energie-Monitoring
- Sicherheitstechnik & Türmanagement in öffentlichen Gebäuden
- Smart Building-Projekte für Schulen, Villen, Büros und KMU

### Fazit

Die Migration auf CODESYS 3.5 ist der Schlüssel für eine zukunftssichere, moderne Steuerungslösung. Sie eröffnet neue Möglichkeiten für Visualisierung, Modularisierung und professionelle Projektstrukturen – besonders im Bereich Smart Building und Industrieautomation.

**Bei InfraOne IT Solutions unterstützen wir dich gerne bei der Analyse, Planung und Umsetzung deiner Migration.** Kontaktiere unsere [Gebäudeautomations-Experten](/gebaeudeautomation) für ein unverbindliches Gespräch.
        `.trim(),
    },
];

// Helper function to get a blog post by slug (from static data)
export function getBlogPostBySlug(slug: string): BlogPost | undefined {
    return blogPosts.find(post => post.slug === slug);
}

// Helper function to generate metadata for a blog post
export function generateBlogMetadata(post: BlogPost): Metadata {
    return {
        title: post.title,
        description: post.excerpt,
        keywords: post.keywords,
        authors: [{ name: post.author }],
        openGraph: {
            title: post.title,
            description: post.excerpt,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
        },
        alternates: {
            canonical: `https://www.infraone.ch/blog/${post.slug}`,
            languages: {
                'de-CH': `https://www.infraone.ch/blog/${post.slug}`,
            },
        },
    };
}

// Export all static blog posts for use with Keystatic combined data
export function getAllStaticBlogPosts(): BlogPost[] {
    return blogPosts;
}
