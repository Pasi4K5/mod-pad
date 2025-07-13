import type { CaretPosition } from '$lib/types';

export const COMMAND_DATA_ATTR = 'data-command';

let globalCmdStartIdx = 0,
    globalCmdEndIdx = 0;

export function transformCommandQuery(
    text: string,
    caretPos?: CaretPosition,
): string {
    if (caretPos != null) {
        for (const match of text.matchAll(/(^|\s)(\/)([A-Za-z]*)/gm)) {
            if (match.index + match[0].length !== caretPos.col) {
                continue;
            }

            const lineOffset = caretPos.global - caretPos.col;
            const localCmdStartIdx = match.index;
            const localCmdEndIdx = match.index + match[0].length;
            globalCmdStartIdx = localCmdStartIdx + lineOffset;
            globalCmdEndIdx = localCmdEndIdx + lineOffset;

            return (
                text.slice(0, localCmdStartIdx) +
                match[1] +
                `<span ${COMMAND_DATA_ATTR} class="font-extrabold">${match[2]}${match[3]}</span>` +
                text.slice(localCmdEndIdx)
            );
        }
    }

    return text;
}

export function removeCommandQuery(text: string): string {
    return text.slice(0, globalCmdStartIdx) + text.slice(globalCmdEndIdx);
}

export function getCommandStartIdx(): number {
    return globalCmdStartIdx;
}
