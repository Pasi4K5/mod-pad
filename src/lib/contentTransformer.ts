export function transform(text: string): string {
    text = replaceOsuTimestamps(text);
    text = replaceTodos(text);

    return text;
}

function replaceOsuTimestamps(text: string): string {
    return text.replace(/(\d{2}:\d{2}:\d{3}( \(\d+(,\d+)*\))?)/g, (match) => {
        return (
            '<a ' +
            `href="osu://edit/${encodeURI(match)}" ` +
            'class="z-2 text-blue-200 bg-black/33 hover:underline pointer-events-auto font-bold rounded-sm" ' +
            `>${match}</a>`
        );
    });
}

function replaceTodos(text: string): string {
    return text.replace(
        /(\bTODO\b.*)/g,
        "<span class='font-bold text-amber-600 bg-amber-600/20 rounded-sm'>$1</span>",
    );
}
