<script lang="ts">
    import { onMount, tick } from 'svelte';
    import { transform } from '$lib/transformation/contentTransformer';
    import { sanitize } from '$lib/util/stringUtil.js';
    import gitHubLogo from '$lib/assets/img/github-mark-white.svg';
    import ContentTransformerEventHandler from '$lib/transformation/ContentTransformerEventHandler.svelte';
    import {
        COMMAND_DATA_ATTR,
        removeCommandQuery,
    } from '$lib/transformation/commandTransformer';
    import { download, pickFileAndRead } from '$lib/util/fileUtil';
    import CommandWindow from '$lib/components/CommandWindow.svelte';
    import type { Position } from '$lib/types';

    const PLACEHOLDER =
        'Type "<span class="font-extrabold">/</span>" for commands...';

    let editor: HTMLTextAreaElement;
    let overlayHtml = $state(PLACEHOLDER);

    const commands = {
        save: async () => {
            await tick();
            download('mod-pad.txt', editor.value);
        },
        open: () => {
            pickFileAndRead().then((content) => {
                editor.value = content;
                rerender();
            });
        },
        source: () => window.open('https://github.com/Pasi4K5/mod-pad'),
    };

    let typingCommand = $state(false);
    let commandWindowPos: Position = $state({ x: 0, y: 0 });
    let commandQuery: string | null = $state(null);
    let selectedCommandIdx = $state(0);

    const filteredCommands = $derived(
        Object.entries(commands).filter(([key]) =>
            key.startsWith(commandQuery ?? ''),
        ),
    );

    $effect(() => {
        selectedCommandIdx = Math.min(
            selectedCommandIdx,
            filteredCommands.length - 1,
        );
    });

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

    async function rerender(): Promise<void> {
        if (editor.value === '') {
            overlayHtml = `<span class="text-gray-200 opacity-30 italic">${PLACEHOLDER}</span>`;
            return;
        }

        normalizeEditorContent();

        let text = sanitize(editor.value);

        // Transform content.
        const result = transform(
            text,
            editor.selectionStart === editor.selectionEnd
                ? editor.selectionStart
                : null,
        );

        // Fix consecutive spaces and newlines.
        text = result.text
            .replaceAll(/^ /gm, '&nbsp;')
            .replaceAll(/^$/gm, '&nbsp;\n')
            .replaceAll(/^ *\$/gm, '&nbsp;\n')
            .replaceAll('  ', '&nbsp;&nbsp;');

        let html = '';
        const lines = text.split('\n');

        // Add dividers between lines.
        let i: number;
        for (i = 0; i < lines.length; i++) {
            const line = lines[i];

            html += `<div>${line}</div><div class="h-[1px] mb-[-1px] bg-gray-700"></div>`;
        }

        // Update overlay.
        overlayHtml = html;

        // Handle command query.
        if (result.commandQuery != null) {
            await handleCommandQuery(result.commandQuery);
        } else {
            hideCommandWindow();
        }
    }

    async function handleCommandQuery(cmd: string): Promise<void> {
        // Wait until the DOM is updated to get the command element and its position.
        await tick();

        commandQuery = cmd;
        const commandTextEl = document.querySelector(
            `[${COMMAND_DATA_ATTR}]`,
        ) as HTMLSpanElement;

        const boundingRect = commandTextEl.getBoundingClientRect();
        commandWindowPos = {
            x: boundingRect.left + window.scrollX,
            y: boundingRect.bottom + window.scrollY,
        };

        typingCommand = true;
    }

    function handleKeyDown(ev: KeyboardEvent): void {
        handleTabInput(ev);
        handleCommandExecution(ev);
        handleCommandNavigation(ev);
        handleCommandExit(ev);
    }

    function handleTabInput(ev: KeyboardEvent) {
        if (ev.key !== 'Tab') {
            return;
        }

        ev.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;

        editor.value =
            editor.value.substring(0, start) +
            '\t' +
            editor.value.substring(end);

        editor.selectionStart = editor.selectionEnd = start + 1;

        rerender();
    }

    function handleCommandExecution(ev: KeyboardEvent): void {
        if (
            !typingCommand ||
            ev.key !== 'Enter' ||
            filteredCommands.length === 0
        ) {
            return;
        }

        ev.preventDefault();

        const command = filteredCommands[selectedCommandIdx];
        command[1]();
        hideCommandWindow();
        editor.value = removeCommandQuery(editor.value);
        rerender();
    }

    function handleCommandNavigation(ev: KeyboardEvent): void {
        if (!typingCommand || filteredCommands.length === 0) {
            return;
        }

        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            selectedCommandIdx++;
        } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            selectedCommandIdx += filteredCommands.length - 1;
        }

        selectedCommandIdx %= filteredCommands.length;
    }

    function handleCommandExit(ev: KeyboardEvent): void {
        if (['Escape', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
            hideCommandWindow();
        }
    }

    function hideCommandWindow(): void {
        typingCommand = false;
        selectedCommandIdx = 0;
    }
</script>

<div class="relative m-4">
    <!-- Editor -->
    <textarea
        bind:this={editor}
        oninput={rerender}
        onkeydown={handleKeyDown}
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

{#if typingCommand && filteredCommands.length > 0}
    <CommandWindow
        {selectedCommandIdx}
        {filteredCommands}
        {commandWindowPos}
        {hideCommandWindow}
    />
{/if}

<ContentTransformerEventHandler />
