import { blogPosts, BlogPost } from '@/data/blogPosts';
import fs from 'fs';
import path from 'path';

// Dynamisch den Reader erstellen um Build-Fehler zu vermeiden
async function getReader() {
    const { createReader } = await import('@keystatic/core/reader');
    const keystaticConfig = (await import('../../keystatic.config')).default;
    return createReader(process.cwd(), keystaticConfig);
}

/**
 * Kategorie-Mapping für schöne Anzeige
 */
const categoryDisplayNames: Record<string, string> = {
    'it-wissen': 'IT-Wissen',
    'telefonie': 'Telefonie',
    'netzwerke': 'Netzwerke',
    'gebaeudeautomation': 'Gebäudeautomation',
    'webdesign': 'Webdesign',
    'kontrollraum': 'Kontrollraum',
};

/**
 * Liest den Content direkt aus der .mdoc Datei
 */
function readMdocContent(slug: string): string {
    try {
        const mdocPath = path.join(process.cwd(), 'content', 'blog', slug, 'content.mdoc');
        if (fs.existsSync(mdocPath)) {
            return fs.readFileSync(mdocPath, 'utf-8');
        }
    } catch (e) {
        console.error(`[Blog] Error reading mdoc for ${slug}:`, e);
    }
    return '';
}

/**
 * Verarbeitet den Content aus Keystatic (kann String, Objekt oder Funktion sein)
 */
async function processContent(content: any, slug: string): Promise<string> {
    // Zuerst versuchen, direkt die .mdoc Datei zu lesen
    const mdocContent = readMdocContent(slug);
    if (mdocContent) {
        return mdocContent;
    }
    
    // Fallback: Versuche den Content aus dem Reader zu laden
    if (!content) return '';
    if (typeof content === 'string') return content;
    
    // Wenn es eine async Funktion ist (Markdoc Reader)
    if (typeof content === 'function') {
        try {
            const doc = await content();
            if (doc && typeof doc === 'string') {
                return doc;
            }
            // Wenn doc ein Array ist, ist es wahrscheinlich eine Markdoc-Struktur
            if (Array.isArray(doc)) {
                return JSON.stringify(doc);
            }
        } catch (e) {
            console.error('[Blog] Error processing markdoc content:', e);
        }
        return '';
    }
    
    return String(content);
}

/**
 * Lädt alle Blog-Posts aus beiden Quellen (statisch + Keystatic)
 * Sortiert nach Datum (neueste zuerst)
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    // Starte mit statischen Posts
    const allPosts: BlogPost[] = [...blogPosts];

    try {
        // Keystatic Blog-Posts laden
        const reader = await getReader();
        const keystaticPosts = await reader.collections.blog.all();
        
        for (const post of keystaticPosts) {
            const entry = post.entry;
            
            // Keywords aus Keystatic (immer Array)
            const keywordsArray: string[] = entry.keywords ? [...entry.keywords] : [];
            
            // Content laden (aus .mdoc Datei oder Reader)
            const contentString = await processContent(entry.content, post.slug);
            
            // Titelbild verarbeiten (kann String oder Objekt sein)
            let featuredImageUrl: string | undefined;
            if (entry.featuredImage) {
                if (typeof entry.featuredImage === 'string') {
                    featuredImageUrl = entry.featuredImage;
                } else if (typeof entry.featuredImage === 'object' && entry.featuredImage !== null) {
                    // Keystatic Image Object: { src: string, ... }
                    featuredImageUrl = (entry.featuredImage as any).src || undefined;
                }
            }
            
            // Konvertiere zu BlogPost Format
            const blogPost: BlogPost = {
                slug: post.slug,
                title: entry.title || 'Untitled',
                excerpt: entry.excerpt || '',
                content: contentString,
                date: entry.publishDate || new Date().toISOString().split('T')[0],
                author: 'InfraOne Team',
                category: categoryDisplayNames[entry.category] || entry.category || 'IT-Wissen',
                keywords: keywordsArray,
                readingTime: entry.readingTime || '5 Min.',
                featuredImage: featuredImageUrl,
            };
            
            // Nur hinzufügen wenn nicht bereits als statischer Post vorhanden
            if (!allPosts.some(p => p.slug === blogPost.slug)) {
                allPosts.push(blogPost);
            }
        }
    } catch (error) {
        console.error('[Blog] Error loading Keystatic posts:', error);
    }

    // Sortieren nach Datum (neueste zuerst)
    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/**
 * Lädt einen einzelnen Blog-Post nach Slug
 */
export async function getBlogPostBySlugAsync(slug: string): Promise<BlogPost | null> {
    // Zuerst in statischen Posts suchen
    const staticPost = blogPosts.find(p => p.slug === slug);
    if (staticPost) {
        return staticPost;
    }

    try {
        // In Keystatic suchen
        const reader = await getReader();
        const post = await reader.collections.blog.read(slug);
        
        if (!post) {
            return null;
        }

        // Keywords aus Keystatic (immer Array)
        const keywordsArray: string[] = post.keywords ? [...post.keywords] : [];
        
        // Content laden
        const contentString = await processContent(post.content, slug);

        // Titelbild verarbeiten (kann String oder Objekt sein)
        let featuredImageUrl: string | undefined;
        if (post.featuredImage) {
            if (typeof post.featuredImage === 'string') {
                featuredImageUrl = post.featuredImage;
            } else if (typeof post.featuredImage === 'object' && post.featuredImage !== null) {
                featuredImageUrl = (post.featuredImage as any).src || undefined;
            }
        }

        return {
            slug: slug,
            title: post.title || 'Untitled',
            excerpt: post.excerpt || '',
            content: contentString,
            date: post.publishDate || new Date().toISOString().split('T')[0],
            author: 'InfraOne Team',
            category: categoryDisplayNames[post.category] || post.category || 'IT-Wissen',
            keywords: keywordsArray,
            readingTime: post.readingTime || '5 Min.',
            featuredImage: featuredImageUrl,
        };
    } catch (error) {
        console.error(`[Blog] Error reading Keystatic post '${slug}':`, error);
    }

    return null;
}

/**
 * Gibt alle Blog-Slugs zurück (für generateStaticParams)
 */
export async function getAllBlogSlugs(): Promise<string[]> {
    const slugs = blogPosts.map(p => p.slug);

    try {
        const reader = await getReader();
        const keystaticPosts = await reader.collections.blog.all();
        for (const post of keystaticPosts) {
            if (!slugs.includes(post.slug)) {
                slugs.push(post.slug);
            }
        }
    } catch (error) {
        console.error('[Blog] Error getting Keystatic slugs:', error);
    }

    return slugs;
}
