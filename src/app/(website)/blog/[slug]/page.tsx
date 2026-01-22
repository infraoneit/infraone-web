import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { getBlogPostBySlugAsync, getAllBlogSlugs, getAllBlogPosts } from '@/lib/blog';
import { BlogPost } from '@/data/blogPosts';

interface BlogPostPageProps {
    params: Promise<{ slug: string }>;
}

// Generate static params for all blog posts (statisch + Keystatic)
export async function generateStaticParams() {
    const slugs = await getAllBlogSlugs();
    return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlugAsync(slug);

    if (!post) {
        return {
            title: 'Artikel nicht gefunden',
        };
    }

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
        },
    };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const { slug } = await params;
    const post = await getBlogPostBySlugAsync(slug);

    if (!post) {
        notFound();
    }

    // Get all posts for related posts section
    const allPosts = await getAllBlogPosts();

    // Get related posts (same category, excluding current)
    const relatedPosts: BlogPost[] = allPosts
        .filter(p => p.category === post.category && p.slug !== post.slug)
        .slice(0, 2);

    // If not enough related posts, fill with other posts
    if (relatedPosts.length < 2) {
        const otherPosts = allPosts
            .filter(p => p.slug !== post.slug && !relatedPosts.some(rp => rp.slug === p.slug))
            .slice(0, 2 - relatedPosts.length);
        relatedPosts.push(...otherPosts);
    }

    // Schema.org BlogPosting structured data (SEO optimiert)
    const blogPostingSchema = {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.excerpt,
        datePublished: post.date,
        dateModified: post.date,
        author: {
            '@type': 'Organization',
            name: post.author,
            url: 'https://www.infraone.ch',
        },
        publisher: {
            '@type': 'Organization',
            name: 'InfraOne IT Solutions GmbH',
            url: 'https://www.infraone.ch',
            logo: {
                '@type': 'ImageObject',
                url: 'https://www.infraone.ch/infraone-logo-schwarz.svg',
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://www.infraone.ch/blog/${post.slug}`,
        },
        keywords: post.keywords.join(', '),
        articleSection: post.category,
        inLanguage: 'de-CH',
    };

    // BreadcrumbList Schema für Navigation
    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.infraone.ch',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Blog',
                item: 'https://www.infraone.ch/blog',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: post.title,
                item: `https://www.infraone.ch/blog/${post.slug}`,
            },
        ],
    };

    return (
        <>
            {/* JSON-LD Structured Data - BlogPosting */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
            />
            {/* JSON-LD Structured Data - Breadcrumb */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* Hero Section */}
            <section className="py-12 lg:py-20 bg-gradient-to-br from-background via-background to-surface">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp">
                        <div className="max-w-4xl mx-auto">
                            {/* Breadcrumb */}
                            <nav className="flex items-center gap-2 text-sm text-text-secondary mb-6">
                                <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                                <span>/</span>
                                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
                                <span>/</span>
                                <span className="text-text-primary">{post.title.substring(0, 30)}...</span>
                            </nav>

                            {/* Category Badge */}
                            <div className="mb-4">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium bg-primary/10 text-primary rounded-full">
                                    <Tag className="w-3.5 h-3.5" />
                                    {post.category}
                                </span>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6 leading-tight">
                                {post.title}
                            </h1>

                            {/* Meta Info */}
                            <div className="flex flex-wrap items-center gap-6 text-sm text-text-secondary">
                                <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(post.date).toLocaleDateString('de-CH', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                                <span className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    {post.author}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    {post.readingTime} Lesezeit
                                </span>
                            </div>
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Featured Image (wenn vorhanden) oder Platzhalter */}
            <section className="container mx-auto px-4 -mt-4">
                <div className="max-w-4xl mx-auto">
                    <div className="relative aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border">
                        {post.featuredImage ? (
                            <Image
                                src={post.featuredImage}
                                alt={post.title}
                                fill
                                className="object-cover"
                                priority
                            />
                        ) : (
                            /* Platzhalter wenn kein Bild vorhanden */
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Tag className="w-8 h-8 text-primary" />
                                    </div>
                                    <p className="text-text-secondary text-sm">Kein Titelbild</p>
                                    <p className="text-text-secondary/60 text-xs mt-1">{post.category}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Article Content */}
            <article className="py-12 lg:py-16">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <AnimatedSection animation="slideUp">
                            {/* Markdown Content mit korrektem Rendering */}
                            <MarkdownRenderer content={post.content} />
                        </AnimatedSection>

                        {/* Keywords Tags */}
                        <div className="mt-12 pt-8 border-t border-border">
                            <p className="text-sm text-text-secondary mb-3">Schlagwörter:</p>
                            <div className="flex flex-wrap gap-2">
                                {post.keywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 text-sm bg-surface text-text-secondary rounded-full border border-border"
                                    >
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* CTA Section */}
                        <div className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                            <h3 className="text-xl font-bold text-text-primary mb-2">
                                Haben Sie Fragen zu diesem Thema?
                            </h3>
                            <p className="text-text-secondary mb-6">
                                Unsere Experten helfen Ihnen gerne weiter – unverbindlich und kostenlos.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button variant="primary" asChild>
                                    <Link href="/kontakt">
                                        Jetzt Kontakt aufnehmen
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Button variant="outline" asChild>
                                    <a href="tel:+41522221818">
                                        052 222 18 18
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </article>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <section className="py-12 lg:py-16 bg-surface">
                    <div className="container mx-auto px-4">
                        <div className="max-w-4xl mx-auto">
                            <h2 className="text-2xl font-bold text-text-primary mb-8">
                                Weitere Artikel
                            </h2>
                            <div className="grid md:grid-cols-2 gap-6">
                                {relatedPosts.map((relatedPost, index) => (
                                    <Link
                                        key={index}
                                        href={`/blog/${relatedPost.slug}`}
                                        className="group p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-lg transition-all"
                                    >
                                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                                            {relatedPost.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors mb-2">
                                            {relatedPost.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary line-clamp-2">
                                            {relatedPost.excerpt}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Back to Blog */}
            <section className="py-8 bg-background">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Zurück zur Blog-Übersicht
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
