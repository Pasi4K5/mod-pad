<script lang="ts">
    import { onMount } from 'svelte';
    import { transform } from '$lib/contentTransformer';
    import { sanitize } from '$lib/stringUtil.js';

    let editor: HTMLTextAreaElement;
    let overlayHtml = '';

    onMount(() => {
        editor.focus();
        rerender();
    });

    function normalizeEditorContent(): void {
        editor.value = editor.value.replace(/\t/g, '  ');
        updateEditorHeight();
    }

    function updateEditorHeight(): void {
        editor.style.height = `${editor.scrollHeight}px`;
    }

    function rerender(): void {
        normalizeEditorContent();

        let text = sanitize(editor.value);
        text = text
            .replaceAll('  ', '&nbsp;&nbsp;')
            .replace(/^ /g, '&nbsp;')
            .replace(/^$/gm, '&nbsp;\n');
        text = transform(text);
        const lines = text.split('\n');

        let html = '';

        let i: number;
        for (i = 0; i < lines.length; i++) {
            const line = lines[i];

            html += `<div>${line}</div><div class="h-[1px] mb-[-1px] bg-gray-700"></div>`;
        }

        overlayHtml = html;
    }
</script>

<div class="relative m-4">
    <!-- Editor -->
    <textarea
        bind:this={editor}
        oninput={rerender}
        onblur={() => setTimeout(() => editor.focus(), 0)}
        onpaste={normalizeEditorContent}
        class="absolute w-full resize-none text-transparent caret-white outline-none"
    ></textarea>

    <!-- Overlay -->
    <div class="pointer-events-none absolute w-full pb-4 wrap-break-word">
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html overlayHtml}
    </div>
</div>
