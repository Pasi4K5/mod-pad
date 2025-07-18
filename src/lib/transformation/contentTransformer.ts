import { transformCommandQuery } from '$lib/transformation/commandTransformer';
import { replaceAll } from '$lib/util/regexUtil';
import type { CaretPosition } from '$lib/types';

// noinspection HtmlUnknownTarget
const simplePatterns: Array<{
    pattern: string;
    replacement: string;
    flags: string;
}> = [
    // To-Dos
    {
        pattern: '(\\bTO-?DO\\b.*)',
        replacement:
            '<span class="font-bold text-amber-600 bg-amber-600/20 rounded-sm">$1</span>',
        flags: 'i',
    },
    // Emphasis
    {
        pattern: '(\\*)([^\\s\\*](?:.*?[^\\s\\*])?)(\\*)',
        replacement:
            '<span class="italic opacity-50">$1</span><em class="font-bold opacity-200 text-yellow-100">$2</em><span class="italic opacity-50">$3</span>',
        flags: 'g',
    },
    // Bullet points
    {
        pattern: '^(\\s*)(\\*)(\\s+[^\\s]+.*)',
        replacement: '$1<span class="text-red-400 font-bold">●</span>$3',
        flags: '',
    },
    // Numbered lists
    {
        pattern: '^(\\s*)(\\d+\\.)(\\s+[^\\s]+.*)',
        replacement: '$1<span class="text-red-400 font-bold">$2</span>$3',
        flags: '',
    },
    // URLs
    {
        pattern:
            '(https?://[\\w-]+(?:\\.[\\w-]+)+[\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])',
        replacement:
            '<a href="$1" class="text-emerald-300 hover:underline" data-link target="_blank" rel="noopener noreferrer">$1</a>',
        flags: 'g',
    },
    // Difficulties
    {
        pattern: '(^|\\s)(\\[.*?\\])',
        replacement: '$1<span class="underline text-purple-500">$2</span>',
        flags: 'g',
    },
];

const complexReplacements: Array<{
    pattern: string;
    replace: (match: RegExpExecArray) => string;
    flags: string;
}> = [
    // osu! timestamps
    {
        pattern:
            '\\d{2}:\\d{2}:\\d{3} (\\((\\d+(,\\d+)*|\\d+\\|\\d+(,\\d+\\|\\d+)*)\\))?',
        replace: (match) =>
            '<a ' +
            `href="osu://edit/${encodeURI(match[0])}" ` +
            'class="z-2 text-blue-200 bg-black/33 hover:underline pointer-events-auto font-bold rounded-sm" ' +
            `>${match[0]}</a>`,
        flags: 'g',
    },
    // Headings
    {
        pattern: '^(#+)(\\s+[^\\s]+.*)',
        replace: (match) => {
            const level = match[1].length;
            const colors = [
                'text-red-400',
                'text-orange-300',
                'text-amber-300',
                'text-yellow-300',
            ];
            const colorClass = colors[Math.min(level - 1, colors.length - 1)];

            return `<span class="${colorClass} font-bold">${match[1]}${match[2]}</span>`;
        },
        flags: 'g',
    },
];

export function transform(
    lines: string[],
    caretPos: CaretPosition | null,
): string[] {
    const transformedLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const caretIdx =
            caretPos != null && caretPos.line === i ? caretPos : null;
        transformedLines.push(transformLine(lines[i], caretIdx));
    }

    return transformedLines;
}

export function transformLine(
    text: string,
    caretPos: CaretPosition | null,
): string {
    text = transformCommandQuery(text, caretPos ?? undefined);

    for (let i = 0; i < simplePatterns.length; i++) {
        const { pattern, replacement, flags } = simplePatterns[i];
        const regex = new RegExp(pattern, flags);
        text = text.replace(regex, replacement);
    }

    for (let i = 0; i < complexReplacements.length; i++) {
        const { pattern, replace, flags } = complexReplacements[i];
        const regex = new RegExp(pattern, flags);
        text = replaceAll(text, regex, replace);
    }

    return text;
}
