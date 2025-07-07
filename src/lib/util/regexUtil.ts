export function replaceAll(
    text: string,
    pattern: RegExp,
    replace: (match: RegExpExecArray) => string,
): string {
    let offset = 0;

    for (const match of text.matchAll(pattern)) {
        const replacement = replace(match);
        text =
            text.slice(0, match.index + offset) +
            replacement +
            text.slice(match.index + match[0].length + offset);
        offset += replacement.length - match[0].length;
    }

    return text;
}
