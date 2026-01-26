import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';
import { AnimatedSection, StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import { getAllBlogPosts } from '@/lib/blog';
import { 
    generateBlogSchema, 
    generateItemListSchema,
    generateBreadcrumbListSchema,
    generateWebPageSchema,
} from '@/lib/seo/schema';
import { BASE_URL } from '@/lib/constants';

export const metadata: Metadata = {
    title: 'Blog | IT-Wissen & Neuigkeiten',
    description: 'Aktuelle Artikel zu IT-Themen, Tipps für KMU und Neuigkeiten von InfraOne IT Solutions.',
    keywords: ['IT Blog', 'IT Wissen', 'IT Tipps KMU', 'InfraOne News'],
};

export default async function BlogPage() {
    // Lädt alle Posts (statisch + Keystatic), bereits sortiert nach Datum
    const sortedPosts = await getAllBlogPosts();

    // 1. Blog Schema
    const blogSchema = generateBlogSchema();
    
    // 2. ItemList Schema (alle Artikel)
    const articleTitles = sortedPosts.map(post => post.title);
    const itemListSchema = generateItemListSchema(
        articleTitles,
        'InfraOne IT Solutions Blog-Artikel'
    );
    
    // 3. Breadcrumb Schema
    const breadcrumbSchema = generateBreadcrumbListSchema([
        { name: 'Home', url: BASE_URL },
        { name: 'Blog', url: `${BASE_URL}/blog` },
    ]);
    
    // 4. WebPage Schema
    const webPageSchema = generateWebPageSchema(
        `${BASE_URL}/blog`,
        'Blog - InfraOne IT Solutions',
        'Aktuelle Artikel zu IT-Themen, Tipps für KMU und Neuigkeiten.'
    );

    return (
        <>
            {/* 1. Blog Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
            />
            
            {/* 2. ItemList Schema (alle Artikel) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
            />
            
            {/* 3. Breadcrumb Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            
            {/* 4. WebPage Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
            
            {/* Hero */}
            <section className="py-16 lg:py-24 bg-gradient-to-br from-background via-background to-surface">
                <div className="container mx-auto px-4 text-center">
                    <AnimatedSection animation="slideUp">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4">
                            <span className="gradient-text">Blog</span>
                        </h1>
                        <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                            IT-Wissen, Praxistipps und Neuigkeiten von InfraOne
                        </p>
                    </AnimatedSection>
                </div>
            </section>

            {/* Blog Posts Grid */}
            <section className="py-16 lg:py-24 bg-surface">
                <div className="container mx-auto px-4">
                    <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" staggerDelay={0.1}>
                        {sortedPosts.map((post) => (
                            <StaggerItem key={post.slug}>
                                <Link href={`/blog/${post.slug}`} className="block h-full">
                                    <article className="group h-full flex flex-col p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-xl transition-all duration-150">
                                        <div className="mb-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                                <Tag className="w-3 h-3" />
                                                {post.category}
                                            </span>
                                        </div>
                                        <h2 className="text-xl font-bold text-text-primary mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                            {post.title}
                                        </h2>
                                        <p className="text-text-secondary text-sm mb-6 line-clamp-3 flex-grow">
                                            {post.excerpt}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-text-secondary pt-4 border-t border-border/50">
                                            <div className="flex items-center gap-4">
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
                                            <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-150">
                                                Lesen
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </article>
                                </Link>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>
        </>
    );
}
