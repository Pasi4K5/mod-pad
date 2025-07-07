// Probably better to write a parser instead of using regexes at some point, but this is good enough for now.

// noinspection HtmlUnknownTarget
import { transformCommandQuery } from '$lib/transformation/commandTransformer';

const simpleReplacements: Record<
    string,
    { replacement: string; flags: string }
> = {
    // TO DO
    '(\\bTO-?DO\\b.*)': {
        replacement:
            '<span class="font-bold text-amber-600 bg-amber-600/20 rounded-sm">$1</span>',
        flags: 'gi',
    },
    // Emphasis
    '(\\*)([^\\s].*?[^\\s])(\\*)': {
        replacement:
            '<span class="italic opacity-50">$1</span><em class="font-bold opacity-200 text-yellow-100">$2</em><span class="italic opacity-50">$3</span>',
        flags: 'g',
    },
    // Bullet point
    '((?:\n|^)\\s*)(\\*)(\\s.*)': {
        replacement: '$1<span class="text-red-400 font-bold">●</span>$3',
        flags: 'g',
    },
    // URL
    '(https?://[\\w-]+(?:\\.[\\w-]+)+[\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])': {
        replacement:
            '<a href="$1" class="text-emerald-300 hover:underline" data-link target="_blank" rel="noopener noreferrer">$1</a>',
        flags: 'g',
    },
};

const complexReplacements: Record<string, (match: string) => string> = {
    '\\d{2}:\\d{2}:\\d{3}( \\((\\d+(,\\d+)*|\\d+\\|\\d+(,\\d+\\|\\d+)*)\\))?': (
        match,
    ) => {
        return (
            '<a ' +
            `href="osu://edit/${encodeURI(match)}" ` +
            'class="z-2 text-blue-200 bg-black/33 hover:underline pointer-events-auto font-bold rounded-sm" ' +
            `>${match}</a>`
        );
    },
};

export function transform(text: string, caretIdx: number | null): string {
    text = transformCommandQuery(text, caretIdx ?? 0);

    for (const [pattern, { replacement, flags }] of Object.entries(
        simpleReplacements,
    )) {
        const regex = new RegExp(pattern, flags);
        text = text.replace(regex, replacement);
    }

    for (const [pattern, replacement] of Object.entries(complexReplacements)) {
        const regex = new RegExp(pattern, 'g');
        text = text.replace(regex, (match) => replacement(match));
    }

    return text;
}
