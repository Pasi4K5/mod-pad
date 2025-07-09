const forbiddenChars = new Map<number, string>([
    ['&'.charCodeAt(0), '&amp;'],
    ['<'.charCodeAt(0), '&lt;'],
    ['>'.charCodeAt(0), '&gt;'],
]);

export function sanitize(text: string): string {
    let sanitizedText = '';

    for (let i = 0; i < text.length; i++) {
        const replacement = forbiddenChars.get(text.charCodeAt(i));

        sanitizedText += replacement != null ? replacement : text[i];
    }

    return sanitizedText;
}
