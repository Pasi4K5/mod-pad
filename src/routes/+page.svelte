<script lang="ts">
    import { onMount, tick } from 'svelte';
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
    import { transform } from '$lib/transformation/contentTransformer';

    const PLACEHOLDER =
        '<span class="text-gray-200 opacity-30 italic">Type "<span class="font-extrabold">/</span>" for commands...</span>';

    let editor: HTMLTextAreaElement;
    let overlayHtmlLines = $state([PLACEHOLDER]);

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

    async function handleInput(ev?: Event) {
        rerender(ev as InputEvent);
        await handleCommandQuery();
    }

    function rerender(ev?: InputEvent): void {
        editor.style.height = `${editor.scrollHeight}px`;

        const isEmpty = editor.value === '';

        if (isEmpty) {
            overlayHtmlLines = [PLACEHOLDER];

            return;
        }

        const text = sanitize(editor.value);

        if (ev == null) {
            rerenderAll(text);

            return;
        }

        const caretPos = editor.selectionEnd;

        const linesUpToCaret = text.substring(0, caretPos).split('\n');
        const caretLineIdx = linesUpToCaret.length - 1;

        if (ev?.inputType === 'insertLineBreak') {
            overlayHtmlLines.splice(caretLineIdx + 1, 0, '');

            return;
        }

        const data = ev?.data;

        if (data == null) {
            // If no data is present, the input is not a simple text input, so we rerender all lines.
            rerenderAll(text);

            return;
        }

        const caretColIdx = linesUpToCaret[caretLineIdx].length;
        const numChangedLines = data.split('\n').length;
        const firstChangedLineIdx = caretLineIdx - numChangedLines + 1;
        const changedLines = text
            .split('\n')
            .slice(firstChangedLineIdx, caretLineIdx + 1);
        const transformedLines = transform(changedLines, {
            line: caretLineIdx - firstChangedLineIdx,
            col: caretColIdx,
        });

        overlayHtmlLines = [
            ...overlayHtmlLines.slice(0, firstChangedLineIdx),
            ...transformedLines,
            ...overlayHtmlLines.slice(caretLineIdx + 1),
        ];
    }

    function rerenderAll(text: string): void {
        overlayHtmlLines = transform(text.split('\n'), null);
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
        oninput={handleInput}
        onkeydown={handleKeyDown}
        onblur={() => setTimeout(() => editor.focus(), 0)}
        onpaste={() => (editor.value = editor.value.replace(/\t/g, '  '))}
        class="w-full max-w-full resize-none text-transparent caret-white outline-none"
    ></textarea>

    <!-- Overlay -->
    <div class="pointer-events-none w-full max-w-full pb-4">
        <!-- eslint-disable svelte/no-at-html-tags -->
        {#each overlayHtmlLines as line, i (i)}
            {@html line}
            <hr class="mb-[-1px] h-[1px] border-gray-700" />
        {/each}
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
