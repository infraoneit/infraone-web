import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { getAllBlogPosts } from '@/lib/blog';

/**
 * Zeigt den neuesten Blog-Beitrag gross auf der Homepage (Cover, Titel, Lead, Datum, Kategorie).
 * Liest dynamisch aus content/blog/ (statisch + Keystatic) und sortiert nach publishDate absteigend.
 * Darunter ein klarer Verweis auf alle Beitraege (/blog).
 */
export async function BlogPreviewSection() {
    const allPosts = await getAllBlogPosts();
    const post = allPosts[0];

    if (!post) return null;

    return (
        <section className="py-16 lg:py-24 bg-surface">
            <div className="container mx-auto px-4">
                {/* Headline */}
                <AnimatedSection animation="slideUp" className="text-center mb-12 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                        <BookOpen className="w-4 h-4" />
                        Aus unserem Blog
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                        IT-Wissen, das weiterhilft
                    </h2>
                    <p className="text-text-secondary">
                        Praxistipps, Vergleiche und Hintergrundwissen für Schweizer KMU — direkt aus unserer Beratungspraxis. Unser aktuellster Beitrag:
                    </p>
                </AnimatedSection>

                {/* Neuester Beitrag — gross */}
                <AnimatedSection animation="slideUp" delay={0.1}>
                    <Link href={`/blog/${post.slug}`} className="block group max-w-5xl mx-auto">
                        <article className="flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-150">
                            {/* Cover */}
                            <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
                                {post.featuredImage ? (
                                    <Image
                                        src={post.featuredImage}
                                        alt={post.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 1024px) 100vw, 1024px"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen className="w-20 h-20 text-primary/40" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex flex-col flex-grow p-6 lg:p-10">
                                <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                                    <Tag className="w-3 h-3" />
                                    {post.category}
                                </span>
                                <h3 className="text-2xl lg:text-3xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-text-secondary leading-relaxed mb-6 flex-grow">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between text-sm text-text-secondary pt-4 border-t border-border">
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4" />
                                            {new Date(post.date).toLocaleDateString('de-CH', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4" />
                                            {post.readingTime}
                                        </span>
                                    </div>
                                    <span className="flex items-center gap-1.5 text-primary font-medium">
                                        Lesen
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        </article>
                    </Link>
                </AnimatedSection>

                {/* CTA: Alle Beiträge */}
                <div className="text-center mt-10">
                    <Button variant="outline" size="lg" asChild>
                        <Link href="/blog">
                            Alle Beiträge ansehen
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
