'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import Link from 'next/link';

interface MarkdownRendererProps {
    content: string;
}

/**
 * Konvertiert Markdoc-spezifische Syntax zu Standard-Markdown
 */
function convertMarkdocToMarkdown(content: string): string {
    let result = content;
    
    // Markdoc Tabellen zu GFM Tabellen konvertieren
    // {% table %} ... {% /table %}
    const tableRegex = /\{% table %\}([\s\S]*?)\{% \/table %\}/g;
    
    result = result.replace(tableRegex, (match, tableContent) => {
        const rows = tableContent.trim().split('---').map((row: string) => row.trim()).filter(Boolean);
        
        if (rows.length === 0) return '';
        
        let markdown = '';
        rows.forEach((row: string, index: number) => {
            // Jede Zeile beginnt mit "- " für jede Zelle
            const cells = row.split('\n')
                .map((line: string) => line.replace(/^- /, '').trim())
                .filter(Boolean);
            
            if (cells.length > 0) {
                markdown += '| ' + cells.join(' | ') + ' |\n';
                
                // Nach der ersten Zeile kommt die Trennlinie
                if (index === 0) {
                    markdown += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
                }
            }
        });
        
        return markdown;
    });
    
    return result;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    // Konvertiere Markdoc zu Standard-Markdown
    const markdownContent = convertMarkdocToMarkdown(content);
    
    return (
        <div className="prose prose-lg max-w-none
            prose-headings:text-text-primary prose-headings:font-bold
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-h4:text-lg prose-h4:mt-6 prose-h4:mb-2
            prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-4
            prose-strong:text-text-primary prose-strong:font-semibold
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-ul:text-text-secondary prose-ul:my-4
            prose-ol:text-text-secondary prose-ol:my-4
            prose-li:my-1
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-table:border-collapse prose-table:w-full
            prose-th:border prose-th:border-border prose-th:p-3 prose-th:bg-surface prose-th:text-text-primary prose-th:font-semibold
            prose-td:border prose-td:border-border prose-td:p-3 prose-td:text-text-secondary
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-6
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-text-secondary
        ">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom Link Rendering
                    a: ({ href, children }) => {
                        const isInternal = href?.startsWith('/') || href?.startsWith('#');
                        if (isInternal) {
                            return (
                                <Link href={href || '#'} className="text-primary hover:underline">
                                    {children}
                                </Link>
                            );
                        }
                        return (
                            <a 
                                href={href} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                            >
                                {children}
                            </a>
                        );
                    },
                    // Custom Image Rendering - Type guard for string
                    img: ({ src, alt }) => {
                        // Ensure src is a string (not Blob) before using string methods
                        if (!src || typeof src !== 'string') return null;
                        
                        // Relative Pfade für Next.js Image
                        const imageSrc = src.startsWith('/') ? src : `/${src}`;
                        
                        return (
                            <span className="block my-6">
                                <Image
                                    src={imageSrc}
                                    alt={alt || 'Blog Bild'}
                                    width={800}
                                    height={450}
                                    className="rounded-xl shadow-lg w-full h-auto"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                />
                                {alt && (
                                    <span className="block text-center text-sm text-text-secondary mt-2">
                                        {alt}
                                    </span>
                                )}
                            </span>
                        );
                    },
                    // Custom Table Rendering
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-6">
                            <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    ),
                    thead: ({ children }) => (
                        <thead className="bg-surface">
                            {children}
                        </thead>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border p-3 text-left font-semibold text-text-primary">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border p-3 text-text-secondary">
                            {children}
                        </td>
                    ),
                    // Custom Heading Rendering
                    h2: ({ children }) => (
                        <h2 className="text-2xl font-bold text-text-primary mt-10 mb-4">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-xl font-bold text-text-primary mt-8 mb-3">
                            {children}
                        </h3>
                    ),
                    h4: ({ children }) => (
                        <h4 className="text-lg font-bold text-text-primary mt-6 mb-2">
                            {children}
                        </h4>
                    ),
                    // Custom List Rendering
                    ul: ({ children }) => (
                        <ul className="list-disc list-inside my-4 space-y-2 text-text-secondary">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal list-inside my-4 space-y-2 text-text-secondary">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-text-secondary">
                            {children}
                        </li>
                    ),
                    // Custom Paragraph
                    p: ({ children }) => (
                        <p className="text-text-secondary leading-relaxed mb-4">
                            {children}
                        </p>
                    ),
                    // Custom Blockquote
                    blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-text-secondary">
                            {children}
                        </blockquote>
                    ),
                    // Custom Code
                    code: ({ children, className }) => {
                        const isBlock = className?.includes('language-');
                        if (isBlock) {
                            return (
                                <code className="block bg-surface p-4 rounded-lg overflow-x-auto text-sm">
                                    {children}
                                </code>
                            );
                        }
                        return (
                            <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {markdownContent}
            </ReactMarkdown>
        </div>
    );
}
