import { blogPosts, BlogPost } from '@/data/blogPosts';
import fs from 'fs';
import path from 'path';

/**
 * Probe natürliche Bilddimensionen via Sharp (build-time, server-only).
 * Wird benutzt um featuredImageWidth/Height zu setzen, sodass Next/Image
 * den korrekten Platz reserviert und keinen Crop oder Letterbox erzeugt.
 */
async function probeImageDimensions(featuredImage?: string): Promise<{ width?: number; height?: number }> {
    if (!featuredImage || /^https?:\/\//.test(featuredImage)) return {};
    const localPath = path.join(process.cwd(), 'public', featuredImage.replace(/^\//, ''));
    if (!fs.existsSync(localPath)) return {};
    try {
        const sharp = (await import('sharp')).default;
        const meta = await sharp(localPath).metadata();
        if (meta.width && meta.height) {
            return { width: meta.width, height: meta.height };
        }
    } catch {
        // sharp fehlgeschlagen, gib leer zurück
    }
    return {};
}

async function withImageDimensions(post: BlogPost): Promise<BlogPost> {
    if (post.featuredImageWidth && post.featuredImageHeight) return post;
    const { width, height } = await probeImageDimensions(post.featuredImage);
    if (width && height) {
        return { ...post, featuredImageWidth: width, featuredImageHeight: height };
    }
    return post;
}

/**
 * Kategorie-Mapping für schöne Anzeige (für Posts aus content/blog/*.json)
 */
const categoryDisplayNames: Record<string, string> = {
    'it-wissen': 'IT-Wissen',
    'telefonie': 'Telefonie',
    'netzwerke': 'Netzwerke',
    'gebaeudeautomation': 'Gebäudeautomation',
    'webdesign': 'Webdesign',
    'kontrollraum': 'Kontrollraum',
};

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/**
 * Liest den Content direkt aus der .mdoc Datei
 */
function readMdocContent(slug: string): string {
    const mdocPath = path.join(BLOG_DIR, slug, 'content.mdoc');
    if (!fs.existsSync(mdocPath)) return '';
    try {
        return fs.readFileSync(mdocPath, 'utf-8');
    } catch {
        return '';
    }
}

/**
 * Liest alle Posts aus content/blog/*.json (plain fs, kein Keystatic-SDK).
 * Jede .json enthält metadata (title, excerpt, category, keywords, publishDate, readingTime,
 * optional featuredImage), der Content kommt aus dem zugehörigen Ordner content.mdoc.
 */
function loadJsonBasedPosts(): BlogPost[] {
    if (!fs.existsSync(BLOG_DIR)) return [];
    const files = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
        .filter(d => d.isFile() && d.name.endsWith('.json'))
        .map(d => d.name);

    const posts: BlogPost[] = [];
    for (const file of files) {
        const slug = file.replace('.json', '');
        try {
            const meta = JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8'));
            const content = readMdocContent(slug);

            posts.push({
                slug,
                title: meta.title || 'Untitled',
                excerpt: meta.excerpt || '',
                content,
                date: meta.publishDate || new Date().toISOString().split('T')[0],
                author: 'InfraOne Team',
                category: categoryDisplayNames[meta.category] || meta.category || 'IT-Wissen',
                keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
                readingTime: meta.readingTime || '5 Min.',
                featuredImage: typeof meta.featuredImage === 'string' ? meta.featuredImage : undefined,
            });
        } catch {
            // Skip broken file
        }
    }
    return posts;
}

/**
 * Lädt alle Blog-Posts (statisch aus blogPosts.ts + file-system aus content/blog/).
 * Sortiert nach Datum (neueste zuerst). Statische Einträge gewinnen bei Slug-Konflikt.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    const allPosts: BlogPost[] = [...blogPosts];
    const jsonPosts = loadJsonBasedPosts();

    for (const post of jsonPosts) {
        if (!allPosts.some(p => p.slug === post.slug)) {
            allPosts.push(post);
        }
    }

    const withDimensions = await Promise.all(allPosts.map(withImageDimensions));
    return withDimensions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Lädt einen einzelnen Blog-Post nach Slug.
 */
export async function getBlogPostBySlugAsync(slug: string): Promise<BlogPost | null> {
    // Zuerst in statischen Posts suchen
    const staticPost = blogPosts.find(p => p.slug === slug);
    if (staticPost) return await withImageDimensions(staticPost);

    // Sonst in content/blog/ suchen
    const jsonPath = path.join(BLOG_DIR, `${slug}.json`);
    if (!fs.existsSync(jsonPath)) return null;

    try {
        const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const content = readMdocContent(slug);

        const post: BlogPost = {
            slug,
            title: meta.title || 'Untitled',
            excerpt: meta.excerpt || '',
            content,
            date: meta.publishDate || new Date().toISOString().split('T')[0],
            author: 'InfraOne Team',
            category: categoryDisplayNames[meta.category] || meta.category || 'IT-Wissen',
            keywords: Array.isArray(meta.keywords) ? meta.keywords : [],
            readingTime: meta.readingTime || '5 Min.',
            featuredImage: typeof meta.featuredImage === 'string' ? meta.featuredImage : undefined,
        };
        return await withImageDimensions(post);
    } catch {
        return null;
    }
}

/**
 * Gibt alle Blog-Slugs zurück (für generateStaticParams).
 */
export async function getAllBlogSlugs(): Promise<string[]> {
    const slugs = new Set<string>(blogPosts.map(p => p.slug));

    if (fs.existsSync(BLOG_DIR)) {
        const files = fs.readdirSync(BLOG_DIR, { withFileTypes: true })
            .filter(d => d.isFile() && d.name.endsWith('.json'))
            .map(d => d.name.replace('.json', ''));
        files.forEach(s => slugs.add(s));
    }

    return Array.from(slugs);
}
