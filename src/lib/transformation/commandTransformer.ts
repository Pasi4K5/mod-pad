import type { TransformResult } from '$lib/transformation/contentTransformer';

export const COMMAND_DATA_ATTR = 'data-command';

let cmdStartIdx = 0,
    cmdEndIdx = 0;

export function transformCommandQuery(
    text: string,
    caretIdx?: number,
): TransformResult {
    let commandQuery: string | undefined;

    if (caretIdx != null) {
        for (const match of text.matchAll(/(^| )(\/([A-Za-z]+))/g)) {
            if (match.index + match[0].length !== caretIdx) {
                continue;
            }

            cmdStartIdx = match.index;
            cmdEndIdx = match.index + match[0].length;

            text =
                text.slice(0, cmdStartIdx) +
                match[1] +
                `<span ${COMMAND_DATA_ATTR}>${match[2]}</span>` +
                text.slice(cmdEndIdx);

            commandQuery = match[3];
            break;
        }
    }

    return {
        text,
        commandQuery,
    };
}

export function removeCommandQuery(text: string): string {
    return text.slice(0, cmdStartIdx) + text.slice(cmdEndIdx);
}
