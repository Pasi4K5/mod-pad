<script lang="ts">
    import { onMount, tick, untrack } from 'svelte';
    import { sanitize } from '$lib/util/stringUtil.js';
    import gitHubLogo from '$lib/assets/img/github-mark-white.svg';
    import ContentTransformerEventHandler from '$lib/transformation/ContentTransformerEventHandler.svelte';
    import {
        COMMAND_DATA_ATTR,
        getCommandStartIdx,
        removeCommandQuery,
    } from '$lib/transformation/commandTransformer';
    import { download, pickFileAndRead } from '$lib/util/fileUtil';
    import CommandPalette from '$lib/components/CommandPalette.svelte';
    import type { Command, Position } from '$lib/types';
    import {
        transform,
        transformLine,
    } from '$lib/transformation/contentTransformer';
    import Overlay from '$lib/components/Overlay.svelte';
    import { getElementByAttribute } from '$lib/util/domUtil';

    const PLACEHOLDER =
        '<span class="text-gray-200 opacity-30 italic">Start typing, or type "<span class="font-extrabold">/</span>" for commands...</span>';

    let editor: HTMLTextAreaElement;
    let overlayWrapper: HTMLDivElement;
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
                changesSaved = true;
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

    let currSelection = {
        start: 0,
        end: 0,
    };

    let changesSaved = false;
    let clickedLink = false;

    onMount(() => {
        window.addEventListener('beforeunload', (ev) => {
            if (clickedLink) {
                clickedLink = false;

                return;
            }

            if (!changesSaved && editor.value !== '') {
                ev.preventDefault();
            }
        });

        editor.focus();
        rerender();
    });

    function explicitEffect(fn: () => void, depsFn: () => unknown[]): void {
        $effect(() => {
            depsFn();
            untrack(fn);
        });
    }

    explicitEffect(addLinkHandlers, () => [overlayHtmlLines]);

    function addLinkHandlers() {
        for (let el of overlayWrapper.getElementsByTagName('a')) {
            el.onclick = () => (clickedLink = true);
        }
    }

    async function handleInput(ev?: Event) {
        changesSaved = false;
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

        if (
            ev == null ||
            ev.inputType === 'insertFromPaste' || // Rerender all lines on paste because Chromium sucks.
            currSelection.start !== currSelection.end // Relies on the fact that "selectionchange" is handled after "input".
        ) {
            rerenderAll(text);

            return;
        }

        const caretPos = editor.selectionEnd;

        const linesUpToCaret = text.substring(0, caretPos).split('\n');
        const caretLineIdx = linesUpToCaret.length - 1;
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
            global: caretPos,
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

        const cmdTextEl = getElementByAttribute(COMMAND_DATA_ATTR);

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

    function handleSelect(): void {
        currSelection = {
            start: editor.selectionStart,
            end: editor.selectionEnd,
        };

        cleanUpCommandHighlighting();
    }

    /**
     * Removes command highlighting when the caret moves to a different line.
     * This does not happen automatically, because the line hasn't been changed,
     * so it is not considered for rerendering.
     */
    function cleanUpCommandHighlighting(): void {
        const cmdTextEl = getElementByAttribute(COMMAND_DATA_ATTR);

        if (cmdTextEl == null) {
            return;
        }

        const cmdLineIdx =
            editor.value.slice(0, getCommandStartIdx()).split('\n').length - 1;
        const caretLineIdx =
            editor.value.substring(0, editor.selectionEnd).split('\n').length -
            1;

        if (cmdLineIdx !== caretLineIdx) {
            overlayHtmlLines[cmdLineIdx] = transformLine(
                editor.value.split('\n')[cmdLineIdx],
                null,
            );
            hideCommandPalette();
        }
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
        onselectionchange={handleSelect}
        onblur={() => setTimeout(() => editor.focus(), 0)}
        class="w-full max-w-full resize-none text-transparent caret-white outline-none"
    ></textarea>

    <!-- Overlay -->
    <div
        bind:this={overlayWrapper}
        class="pointer-events-none w-full max-w-full pb-4"
    >
        <Overlay lines={overlayHtmlLines} />
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
