import { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants';

/**
 * robots.ts
 *
 * Steuert das Crawling-Verhalten fuer Suchmaschinen und AI-Crawler.
 * AI-Crawler (GPTBot, ClaudeBot, etc.) sind explizit erlaubt, damit
 * InfraOne in ChatGPT, Claude, Perplexity und Google's AI-Overviews
 * gefunden wird.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            // Standard fuer alle Crawler
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/', '/keystatic/'],
            },
            // OpenAI / ChatGPT
            { userAgent: 'GPTBot', allow: '/' },
            { userAgent: 'ChatGPT-User', allow: '/' },
            { userAgent: 'OAI-SearchBot', allow: '/' },
            // Anthropic / Claude
            { userAgent: 'ClaudeBot', allow: '/' },
            { userAgent: 'Claude-Web', allow: '/' },
            { userAgent: 'anthropic-ai', allow: '/' },
            // Google Generative AI (Bard / Gemini, separat von Googlebot)
            { userAgent: 'Google-Extended', allow: '/' },
            // Common Crawl (fuettert viele AI-Modelle)
            { userAgent: 'CCBot', allow: '/' },
            // Perplexity
            { userAgent: 'PerplexityBot', allow: '/' },
            // Apple Intelligence
            { userAgent: 'Applebot-Extended', allow: '/' },
            // Bytedance / TikTok
            { userAgent: 'Bytespider', allow: '/' },
            // Mistral AI
            { userAgent: 'MistralAI-User', allow: '/' },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
        host: BASE_URL,
    };
}
