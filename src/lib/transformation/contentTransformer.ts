// noinspection HtmlUnknownTarget
import { transformCommandQuery } from '$lib/transformation/commandTransformer';
import { replaceAll } from '$lib/util/regexUtil';

const simpleReplacements: Record<
    string,
    { replacement: string; flags: string }
> = {
    // To-Dos
    '(\\bTO-?DO\\b.*)': {
        replacement:
            '<span class="font-bold text-amber-600 bg-amber-600/20 rounded-sm">$1</span>',
        flags: 'gi',
    },
    // Emphasis
    '(\\*)([^\\s\\*].*?[^\\s\\*])(\\*)': {
        replacement:
            '<span class="italic opacity-50">$1</span><em class="font-bold opacity-200 text-yellow-100">$2</em><span class="italic opacity-50">$3</span>',
        flags: 'g',
    },
    // Bullet points
    '((?:\n|^)\\s*)(\\*)(\\s.*)': {
        replacement: '$1<span class="text-red-400 font-bold">●</span>$3',
        flags: 'g',
    },
    // URLs
    '(https?://[\\w-]+(?:\\.[\\w-]+)+[\\w.,@?^=%&:/~+#-]*[\\w@?^=%&/~+#-])': {
        replacement:
            '<a href="$1" class="text-emerald-300 hover:underline" data-link target="_blank" rel="noopener noreferrer">$1</a>',
        flags: 'g',
    },
};

const complexReplacements: Record<
    string,
    { replace: (match: RegExpExecArray) => string; flags: string }
> = {
    // osu! timestamps
    '\\d{2}:\\d{2}:\\d{3} (\\((\\d+(,\\d+)*|\\d+\\|\\d+(,\\d+\\|\\d+)*)\\))?': {
        replace: (match) =>
            '<a ' +
            `href="osu://edit/${encodeURI(match[0])}" ` +
            'class="z-2 text-blue-200 bg-black/33 hover:underline pointer-events-auto font-bold rounded-sm" ' +
            `>${match[0]}</a>`,
        flags: 'g',
    },
    // Headings
    '^(#+) (.*)': {
        replace: (match) => {
            const level = match[1].length;
            const colors = [
                'text-red-300',
                'text-orange-300',
                'text-amber-300',
                'text-yellow-300',
            ];
            const colorClass = colors[Math.min(level - 1, colors.length - 1)];

            return `<span class="${colorClass} font-bold">${match[1]} ${match[2]}</span>`;
        },
        flags: 'g',
    },
};

export function transform(
    lines: string[],
    caretPos: { line: number; col: number } | null,
): string[] {
    return lines.map((line, idx) => {
        const caretIdx =
            caretPos && caretPos.line === idx ? caretPos.col : null;
        return transformLine(line, caretIdx);
    });
}

function transformLine(text: string, caretIdx: number | null): string {
    text = transformCommandQuery(text, caretIdx ?? 0);

    for (const [pattern, { replacement, flags }] of Object.entries(
        simpleReplacements,
    )) {
        const regex = new RegExp(pattern, flags);
        text = text.replace(regex, replacement);
    }

    for (const [pattern, { replace, flags }] of Object.entries(
        complexReplacements,
    )) {
        const regex = new RegExp(pattern, flags);
        text = replaceAll(text, regex, replace);
    }

    return text;
}
