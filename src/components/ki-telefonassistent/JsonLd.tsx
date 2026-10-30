/** Strukturierte Daten als JSON-LD (je Objekt ein Script-Tag). */
export function JsonLd({ daten }: { daten: Array<object | null | undefined> }) {
    return (
        <>
            {daten.filter(Boolean).map((d, i) => (
                <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d).replace(/</g, '\\u003c') }} />
            ))}
        </>
    );
}
