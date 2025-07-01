<script lang="ts">
    import { onMount } from 'svelte';
    import { transform } from '$lib/contentTransformer';
    import { sanitize } from '$lib/stringUtil.js';
    import gitHubLogo from '$lib/assets/img/github-mark-white.svg';

    const PLACEHOLDER = 'Start typing...';

    let editor: HTMLTextAreaElement;
    let overlayHtml = PLACEHOLDER;

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
        if (editor.value === '') {
            overlayHtml = `<span class="text-gray-200 opacity-30 italic">${PLACEHOLDER}</span>`;
            return;
        }

        normalizeEditorContent();

        let text = sanitize(editor.value);
        text = transform(text);
        text = text
            .replaceAll('  ', '&nbsp;&nbsp;')
            .replace(/^ /g, '&nbsp;')
            .replace(/^$/gm, '&nbsp;\n');
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

<a
    class="fixed right-2 bottom-2"
    href="https://github.com/Pasi4K5/mod-pad"
    target="_blank"
    rel="noopener noreferrer"
>
    <img src={gitHubLogo} alt="GitHub" class="w-10" />
</a>
