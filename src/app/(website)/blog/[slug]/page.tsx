import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { getBlogPostBySlugAsync, getAllBlogSlugs } from '@/lib/blog';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import {
    generateBlogPostingSchema,
    generateBreadcrumbListSchema,
    generateWebPageSchema,
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export async function generateStaticParams() {
    const slugs = await getAllBlogSlugs();
    return slugs.map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const post = await getBlogPostBySlugAsync(slug);
    
    if (!post) {
        return {
            title: 'Artikel nicht gefunden | InfraOne Blog',
        };
    }

    return {
        title: post.title,
        description: post.excerpt,
        keywords: post.keywords,
        alternates: {
            canonical: `${BASE_URL}/blog/${slug}`,
        },
    };
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = await getBlogPostBySlugAsync(slug);

    if (!post) {
        notFound();
    }

    // 1. BlogPosting Schema
    const blogPostingSchema = generateBlogPostingSchema(
        post.title,
        post.excerpt,
        slug,
        post.date,
        post.category,
        post.readingTime
    );

    // 2. Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Blog', url: `${BASE_URL}/blog` },
        { name: post.title, url: `${BASE_URL}/blog/${slug}` },
    ]);

    // 3. WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/blog/${slug}`,
        post.title,
        post.excerpt
    );

    return (
        <>
            {/* 1. BlogPosting Schema (mit Speakable) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        ...blogPostingSchema,
                        speakable: {
                            '@type': 'SpeakableSpecification',
                            cssSelector: ['.article-content h1', '.article-content p:first-of-type'],
                        },
                    }),
                }}
            />

            {/* 2. Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />

            {/* 3. WebPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />

            {/* Hero Section — 2-Spalten Layout (Bild rechts) wenn featuredImage vorhanden, sonst 1-Spalter.
                Background-Overlay ist immer das generische Tech-Background-Bild. */}
            <section className="relative py-12 lg:py-16 bg-gradient-to-br from-background via-background to-surface overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <Image
                        src="/images/blog-hero-background.webp"
                        alt=""
                        fill
                        className="object-cover"
                        priority
                        aria-hidden="true"
                    />
                </div>
                <div className="container mx-auto px-4 relative z-10">
                    <AnimatedSection animation="slideUp">
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Zurück zum Blog
                        </Link>

                        <div className={post.featuredImage ? 'grid lg:grid-cols-2 gap-12 items-center' : ''}>
                            <div className={post.featuredImage ? 'max-w-xl' : 'max-w-4xl'}>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                        <Tag className="w-3 h-3" />
                                        {post.category}
                                    </span>
                                </div>

                                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                                    {post.title}
                                </h1>

                                <p className="text-xl text-text-secondary mb-6">{post.excerpt}</p>

                                <div className="flex items-center gap-6 text-sm text-text-secondary">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(post.date).toLocaleDateString('de-CH', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        {post.readingTime}
                                    </span>
                                </div>
                            </div>

                            {post.featuredImage && (
                                <div className="hidden lg:block">
                                    <Image
                                        src={post.featuredImage}
                                        alt={post.title}
                                        width={post.featuredImageWidth ?? 1200}
                                        height={post.featuredImageHeight ?? 675}
                                        sizes="(max-width: 1024px) 100vw, 50vw"
                                        className="w-full h-auto rounded-2xl shadow-2xl border border-border"
                                    />
                                </div>
                            )}
                        </div>
                    </AnimatedSection>
                </div>
            </section>

            {/* Article Content */}
            <section className="py-12 lg:py-16 bg-background">
                <div className="container mx-auto px-4">
                    <AnimatedSection animation="slideUp" delay={0.2}>
                        <article className="article-content max-w-4xl mx-auto prose prose-lg prose-slate dark:prose-invert prose-headings:text-text-primary prose-p:text-text-secondary prose-a:text-primary prose-strong:text-text-primary prose-code:text-primary prose-pre:bg-surface prose-pre:border prose-pre:border-border">
                            <MarkdownRenderer content={post.content} />
                        </article>
                    </AnimatedSection>
                </div>
            </section>

            {/* Back to Blog */}
            <section className="py-12 bg-surface">
                <div className="container mx-auto px-4 text-center">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Alle Artikel anzeigen
                    </Link>
                </div>
            </section>
        </>
    );
}
