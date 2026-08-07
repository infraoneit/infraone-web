import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Tag, BookOpen } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { Button } from '@/components/ui/Button';
import { getAllBlogPosts } from '@/lib/blog';

/**
 * Zeigt die drei neuesten Blog-Beitraege nebeneinander auf der Homepage
 * (Cover oben, Kategorie, Titel, Datum). Liest dynamisch aus content/blog/
 * und sortiert nach publishDate absteigend. Darunter der Verweis auf /blog.
 */
export async function BlogPreviewSection() {
    const allPosts = await getAllBlogPosts();
    const posts = allPosts.slice(0, 3);

    if (posts.length === 0) return null;

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
                        Praxistipps, Vergleiche und Hintergrundwissen für Schweizer KMU — direkt aus unserer Beratungspraxis.
                    </p>
                </AnimatedSection>

                {/* Die drei neuesten Beitraege nebeneinander */}
                <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                    {posts.map((post) => (
                        <StaggerItem key={post.slug}>
                            <Link href={`/blog/${post.slug}`} className="block group h-full">
                                <article className="flex flex-col h-full rounded-2xl bg-card border border-border overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-150">
                                    {/* Cover */}
                                    <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5">
                                        {post.featuredImage ? (
                                            <Image
                                                src={post.featuredImage}
                                                alt={post.title}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <BookOpen className="w-16 h-16 text-primary/40" strokeWidth={1.5} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-grow p-6">
                                        <span className="inline-flex self-start items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                                            <Tag className="w-3 h-3" />
                                            {post.category}
                                        </span>
                                        <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </h3>
                                        <p className="text-sm text-text-secondary leading-relaxed mb-4 flex-grow line-clamp-3">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-text-secondary pt-3 border-t border-border">
                                            <div className="flex items-center gap-3">
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
                                            <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
                                </article>
                            </Link>
                        </StaggerItem>
                    ))}
                </StaggerContainer>

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
