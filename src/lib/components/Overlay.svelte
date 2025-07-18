<script lang="ts">
    type Props = {
        lines: string[];
    };

    const props: Props = $props();
</script>

<!--eslint-disable svelte/no-at-html-tags -->
{#each props.lines as line, i (i)}
    {@html line}
    <hr class="mb-[-1px] h-[1px] border-gray-700" />
{/each}
