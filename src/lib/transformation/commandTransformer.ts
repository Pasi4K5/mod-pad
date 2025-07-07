export const COMMAND_DATA_ATTR = 'data-command';

let cmdStartIdx = 0,
    cmdEndIdx = 0;

export function transformCommandQuery(text: string, caretIdx?: number): string {
    if (caretIdx != null) {
        for (const match of text.matchAll(/(^|\s)(\/([A-Za-z]*))/gm)) {
            if (match.index + match[0].length !== caretIdx) {
                continue;
            }

            cmdStartIdx = match.index;
            cmdEndIdx = match.index + match[0].length;

            return (
                text.slice(0, cmdStartIdx) +
                match[1] +
                `<span ${COMMAND_DATA_ATTR}>${match[2]}</span>` +
                text.slice(cmdEndIdx)
            );
        }
    }

    return text;
}

export function removeCommandQuery(text: string): string {
    return text.slice(0, cmdStartIdx) + text.slice(cmdEndIdx);
}
