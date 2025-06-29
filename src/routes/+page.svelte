<script lang="ts">
    import { onMount } from 'svelte';
    import { transform } from '$lib/contentTransformer';

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

        let text = editor.value;
        text = text.replaceAll("  ", "&nbsp;&nbsp;")
            .replace(/^ /g, "&nbsp;")
            .replaceAll("\n", "&nbsp;\n");
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

<div class="m-4 relative">

    <!-- Editor -->
    <textarea
        bind:this={editor}
        oninput={rerender}
        onblur={() => setTimeout(() => editor.focus(), 0)}
        onpaste={normalizeEditorContent}
        class="absolute outline-none text-transparent caret-white w-full resize-none"
    ></textarea>

    <!-- Overlay -->
    <div
        class="absolute w-full pointer-events-none wrap-break-word pb-4"
    >
        <!-- eslint-disable svelte/no-at-html-tags -->
        {@html overlayHtml}
    </div>

</div>
