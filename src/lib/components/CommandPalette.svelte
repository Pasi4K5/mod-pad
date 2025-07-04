<script lang="ts">
    import type { Position } from '$lib/types';

    type Props = {
        filteredCommands: [string, () => void][];
        pos: Position;
        selectedCommandIdx: number;
        hideCommandPalette: () => void;
    };

    const props: Props = $props();
</script>

<div
    class="fixed flex flex-col items-stretch overflow-hidden rounded bg-gray-700"
    style="left: {props.pos.x}px;
        top: {props.pos.y}px;"
>
    {#each props.filteredCommands as [name, command], i (i)}
        <button
            class="px-3 text-left text-white {i === props.selectedCommandIdx
                ? 'bg-gray-600'
                : ''}"
            onclick={() => {
                command();
                props.hideCommandPalette();
            }}
        >
            {name}
        </button>
    {/each}
</div>
