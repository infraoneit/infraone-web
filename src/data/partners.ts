/**
 * Partnerdaten fuer /partner.
 *
 * Bewusst zwei getrennte Gruppen:
 * - Gewerbepartner: Firmen, mit denen wir Projekte gemeinsam ausfuehren.
 * - Technologiepartner: Hersteller, deren Produkte wir einsetzen und betreuen.
 *
 * Beides sind unterschiedliche Aussagen und duerfen nicht vermischt werden.
 */

export interface Partner {
    name: string;
    logo: string;
    url: string;
    /** Was die Firma macht - eine Zeile. */
    kurz: string;
    /** Warum wir zusammenarbeiten bzw. wofuer wir das Produkt einsetzen. */
    text: string;
    /** Zusatzklasse fuers Logo (z. B. brightness-0 fuer rein weisse SVGs auf hellem Chip). */
    logoClass?: string;
}

export const gewerbepartner: Partner[] = [
    {
        name: 'Elektro-Tel AG',
        logo: '',
        url: 'https://www.elektro-tel.ch',
        kurz: 'Elektroinstallation, seit 1968',
        text: 'Elektrotechnik trifft laufend auf Informatik. Durch diese Partnerschaft bieten wir Videoüberwachung und Alarmierungssysteme aus einer Hand: Verkabelung und Installation kommen vom Elektrofachbetrieb, Konfiguration, Netzwerkanbindung und Betrieb von uns. Für Sie bleibt es ein Projekt statt zwei.',
    },
];

export const technologiepartner: Partner[] = [
    {
        name: 'peoplefone',
        logo: '/images/partners/partner-peoplefone.svg',
        url: 'https://www.peoplefone.ch',
        kurz: 'Schweizer VoIP-Anbieter',
        text: 'Unser Anbieter für Rufnummern und SIP-Trunks. Server und Daten bleiben in der Schweiz - für viele Kunden das ausschlaggebende Argument.',
    },
    {
        name: '3CX',
        logo: '/images/partners/partner-3cx.svg',
        url: 'https://www.3cx.com/',
        kurz: 'Telefonanlagen-Software',
        text: 'Die Telefonanlage, die wir einrichten und betreuen. Läuft in der Cloud oder auf eigener Hardware, mit Apps für Handy und Rechner.',
    },
    {
        name: 'Milestone',
        logo: '/images/partners/partner-milestone.svg',
        url: 'https://www.milestonesys.com/',
        kurz: 'Eines der grössten Videomanagement-Systeme',
        text: 'Software für Videoüberwachung, die auch bei hundert Kameras noch übersichtlich bleibt. Herstellerunabhängig, damit Sie bei der Kamerawahl frei sind.',
    },
    {
        name: 'Ubiquiti',
        logo: '/images/partners/partner-ubiquiti.svg',
        url: 'https://www.ui.com/',
        kurz: 'Netzwerktechnik und Kameras',
        text: 'Switches, Access Points und UniFi Protect. Ein System für Netzwerk und Video, zentral verwaltbar - unser Standard für KMU-Netze.',
    },
    {
        name: 'Fortinet',
        logo: '/images/partners/partner-fortinet.svg',
        url: 'https://www.fortinet.com/',
        kurz: 'Firewalls und Netzwerksicherheit',
        text: 'Firewalls für Standorte mit erhöhten Anforderungen: Zugriffsschutz, VPN für Aussendienst und Homeoffice, gefiltertes Surfen.',
    },
    {
        name: 'Sophos',
        logo: '/images/partners/partner-sophos.svg',
        url: 'https://www.sophos.com/',
        kurz: 'Endpoint-Schutz',
        text: 'Virenschutz und Verschlüsselung für Arbeitsplätze und Server, zentral überwacht. Meldet Vorfälle, bevor sie zum Stillstand führen.',
    },
    {
        name: 'Microsoft',
        logo: '/images/partners/partner-microsoft.svg',
        url: 'https://www.microsoft.com/de-ch',
        kurz: 'Microsoft 365, Windows, Azure',
        text: 'Von der Lizenz bis zur Migration: E-Mail, Teams, SharePoint und Windows-Server - eingerichtet, abgesichert und gesichert.',
    },
    {
        name: 'Synology',
        logo: '/images/partners/partner-synology.svg',
        url: 'https://www.synology.com/',
        kurz: 'Netzwerkspeicher und Backup',
        text: 'Datenablage und Sicherung im eigenen Haus. Bildet zusammen mit Veeam unsere Standardlösung für Backups, die im Ernstfall auch wirklich zurückspielen.',
    },
    {
        name: 'Veeam',
        logo: '/images/partners/partner-veeam.svg',
        url: 'https://www.veeam.com/',
        kurz: 'Backup und Wiederherstellung',
        text: 'Sichert Server, virtuelle Maschinen und Microsoft 365. Wir prüfen Rücksicherungen regelmässig - ein Backup, das nie getestet wurde, ist keines.',
    },
    {
        name: 'HPE',
        logo: '/images/partners/partner-hpe.svg',
        url: 'https://www.hpe.com/ch/de/home.html',
        kurz: 'Server und Storage',
        text: 'Serverhardware für Betriebe, die ihre Systeme im Haus behalten - mit Garantieerweiterung und Reaktionszeiten, die zum Betrieb passen.',
    },
    {
        name: 'Lenovo',
        logo: '/images/partners/partner-lenovo.svg',
        url: 'https://www.lenovo.com/ch/de/',
        kurz: 'Notebooks und Arbeitsplatzrechner',
        text: 'Unsere Standardwahl für Geschäftsgeräte: einheitliche Modellreihen, lange Verfügbarkeit, Vor-Ort-Garantie.',
    },
    {
        name: 'iWay',
        logo: '/images/partners/partner-iway.svg',
        url: 'https://www.iway.ch/',
        kurz: 'Schweizer Internetanbieter',
        text: 'Geschäftsanschlüsse mit fester IP-Adresse und verbindlichem Support - Grundlage für Telefonie, Fernzugriff und Videoüberwachung.',
    },
    {
        name: 'Proxmox',
        logo: '/images/partners/proxmox-black.svg',
        url: 'https://www.proxmox.com/',
        kurz: 'Virtualisierung (Open Source)',
        text: 'Mehrere Server auf einer Maschine - spart Hardware und macht Wiederherstellungen im Notfall deutlich schneller. Open Source ohne Lizenzkosten, mit voller Kontrolle über die eigene Umgebung.',
    },
    {
        name: 'TP-Link',
        logo: '/images/partners/TP-Link-logo.svg',
        url: 'https://www.tp-link.com/ch/',
        kurz: 'Switches und WLAN',
        text: 'Switches und Access Points für kleinere Netzwerke, zentral verwaltbar über die Omada-Plattform. Die bewährte Wahl, wenn das Budget im Vordergrund steht.',
    },
];
