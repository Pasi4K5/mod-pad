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
    import CommandPalette from '$lib/components/CommandPalette.svelte';
    import type { Command, Position } from '$lib/types';

    const PLACEHOLDER =
        'Type "<span class="font-extrabold">/</span>" for commands...';

    let editor: HTMLTextAreaElement;
    let overlayHtml = $state(PLACEHOLDER);

    const commands: Array<Command> = [
        {
            name: 'help',
            action: () =>
                window.open(
                    'https://github.com/Pasi4K5/mod-pad?tab=readme-ov-file#how-to-use-modpad',
                ),
        },
        {
            name: 'save',
            action: async () => {
                await tick();
                download('mod-pad.txt', editor.value);
            },
        },
        {
            name: 'open',
            action: () => {
                pickFileAndRead().then((content) => {
                    editor.value = content;
                    rerender();
                });
            },
        },
        {
            name: 'source',
            action: () => window.open('https://github.com/Pasi4K5/mod-pad'),
        },
    ];

    const commandPalette = $state({
        pos: { x: 0, y: 0 } as Position,
        query: null as string | null,
        selectedIdx: 0,
    });

    const typingCommand = $derived(commandPalette.query != null);

    const filteredCommands = $derived(
        commands.filter((cmd) =>
            cmd.name.startsWith(commandPalette.query ?? ''),
        ),
    );

    onMount(() => {
        editor.focus();
        rerender();
    });

    async function rerender(): Promise<void> {
        editor.style.height = `${editor.scrollHeight}px`;

        const isEmpty = editor.value === '';

        if (isEmpty) {
            overlayHtml = `<span class="text-gray-200 opacity-30 italic">${PLACEHOLDER}</span>`;
        } else {
            let text = sanitize(editor.value);

            // Transform content.
            text = transform(
                text,
                editor.selectionStart === editor.selectionEnd
                    ? editor.selectionStart
                    : null,
            ).replaceAll(/^$/gm, '&nbsp;\n');

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
        }

        await handleCommandQuery();
    }

    async function handleCommandQuery(): Promise<void> {
        // Wait until the DOM is updated to get the command element.
        await tick();

        const cmdTextEl = document.querySelector(`[${COMMAND_DATA_ATTR}]`) as
            | HTMLSpanElement
            | undefined;

        commandPalette.query = cmdTextEl?.textContent?.trim()?.slice(1) ?? null;

        if (cmdTextEl == null) {
            commandPalette.selectedIdx = 0;

            return;
        }

        commandPalette.selectedIdx = Math.min(
            commandPalette.selectedIdx,
            filteredCommands.length - 1,
        );

        const boundingRect = cmdTextEl.getBoundingClientRect();
        commandPalette.pos = {
            x: boundingRect.left + window.scrollX,
            y: boundingRect.bottom + window.scrollY,
        };
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

        const command = filteredCommands[commandPalette.selectedIdx];
        command.action();
        hideCommandPalette();
        editor.value = removeCommandQuery(editor.value);
        rerender();
    }

    function handleCommandNavigation(ev: KeyboardEvent): void {
        if (!typingCommand || filteredCommands.length === 0) {
            return;
        }

        if (ev.key === 'ArrowDown') {
            ev.preventDefault();
            commandPalette.selectedIdx =
                (commandPalette.selectedIdx + 1) % filteredCommands.length;
        } else if (ev.key === 'ArrowUp') {
            ev.preventDefault();
            commandPalette.selectedIdx =
                (commandPalette.selectedIdx + filteredCommands.length - 1) %
                filteredCommands.length;
        }
    }

    function handleCommandExit(ev: KeyboardEvent): void {
        if (['Escape', 'ArrowLeft', 'ArrowRight'].includes(ev.key)) {
            hideCommandPalette();
        }
    }

    function hideCommandPalette(): void {
        commandPalette.query = null;
        commandPalette.selectedIdx = 0;
    }
</script>

<div
    class="relative m-4 max-w-full [&>*]:absolute [&>*]:wrap-break-word [&>*]:break-all [&>*]:whitespace-break-spaces"
>
    <!-- Editor -->
    <textarea
        bind:this={editor}
        oninput={rerender}
        onkeydown={handleKeyDown}
        onblur={() => setTimeout(() => editor.focus(), 0)}
        onpaste={() => (editor.value = editor.value.replace(/\t/g, '  '))}
        class="w-full max-w-full resize-none text-transparent caret-white outline-none"
    ></textarea>

    <!-- Overlay -->
    <div class="pointer-events-none w-full max-w-full pb-4">
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
    <CommandPalette
        selectedCommandIdx={commandPalette.selectedIdx}
        {filteredCommands}
        pos={commandPalette.pos}
        {hideCommandPalette}
    />
{/if}

<ContentTransformerEventHandler />
