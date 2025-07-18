export function getElementByAttribute(attribute: string): HTMLElement | null {
    return document.querySelector(`[${attribute}]`);
}
