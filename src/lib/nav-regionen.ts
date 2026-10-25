/**
 * Regionsseiten für das Mega-Menü «Für wen» (AUFTRAG-100).
 *
 * Quelle sind dieselben Funktionen wie `generateStaticParams` der drei
 * `[region]`-Templates (IT-Support, Cloud-Telefonie, Webdesign): Das Menü
 * verlinkt also genau die Seiten, die gebaut werden — keine neuen Routen.
 * Nur auf dem Server aufrufen (liest content/ vom Dateisystem).
 */
import {
    getAllCloudTelefonieRegionSlugs,
    getAllITSupportRegionSlugs,
    getAllWebdesignRegionSlugs,
    getCloudTelefonieRegion,
    getITSupportRegion,
    getWebdesignRegion,
} from '@/lib/leistungen';
import type { NavRegionen, Region } from '@/components/layout/navigation';

async function sammle(slugs: string[], lade: (slug: string) => Promise<{ name?: string } | null>): Promise<Region[]> {
    const liste = await Promise.all(
        slugs.map(async (slug) => {
            const daten = await lade(slug);
            return daten?.name ? { slug, name: daten.name } : null;
        }),
    );
    return liste.filter((r): r is Region => r !== null).sort((a, b) => a.name.localeCompare(b.name, 'de-CH'));
}

export async function ladeNavRegionen(): Promise<NavRegionen> {
    const [itSupport, cloudTelefonie, webdesign] = await Promise.all([
        getAllITSupportRegionSlugs().then((s) => sammle(s, getITSupportRegion)),
        getAllCloudTelefonieRegionSlugs().then((s) => sammle(s, getCloudTelefonieRegion)),
        getAllWebdesignRegionSlugs().then((s) => sammle(s, getWebdesignRegion)),
    ]);
    return { itSupport, cloudTelefonie, webdesign };
}
