import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { getAllBlogPosts } from '@/lib/blog';

/**
 * Zeigt die 3 neuesten Blog-Beiträge auf der Homepage.
 * Liest dynamisch aus content/blog/ (statisch + Keystatic) und sortiert nach publishDate.
 * Wenn kein featuredImage vorhanden ist, wird ein Kategorie-Gradient mit Icon angezeigt.
 */
export async function BlogPreviewSection() {
    const allPosts = await getAllBlogPosts();
    const latestPosts = allPosts.slice(0, 4);

    if (latestPosts.length === 0) return null;

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
                        Praxistipps, Vergleiche und Hintergrundwissen für Schweizer KMU — direkt aus unserer Beratungspraxis. Die vier neuesten Beiträge:
                    </p>
                </AnimatedSection>

                {/* Posts Grid */}
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" staggerDelay={0.1}>
                    {latestPosts.map((post) => (
                        <StaggerItem key={post.slug}>
                            <Link href={`/blog/${post.slug}`} className="block h-full group">
                                <article className="h-full flex flex-col rounded-2xl bg-card border border-border overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-150">
                                    {/* Thumbnail mit Fallback */}
                                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
                                        {post.featuredImage ? (
                                            <Image
                                                src={post.featuredImage}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-14 h-14 text-primary/40" strokeWidth={1.5} />
                                            </div>
                                        )}
                                        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-card/95 text-primary rounded-full backdrop-blur">
                                            <Tag className="w-3 h-3" />
                                            {post.category}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col p-5">
                                        <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary mb-4 line-clamp-3 flex-grow">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-text-secondary pt-3 border-t border-border">
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(post.date).toLocaleDateString('de-CH', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {post.readingTime}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
                                                Lesen
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

                {/* CTA */}
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
