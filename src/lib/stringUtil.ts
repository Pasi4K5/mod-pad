export function sanitize(text: string): string {
    return text
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/&/g, "&amp;");
}
