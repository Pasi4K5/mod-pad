<script lang="ts">
	import { onMount } from 'svelte';

	let editor: HTMLTextAreaElement;
	let overlayHtml = "";

	onMount(() => editor.focus());

	function handleInput(): void {
		editor.value = editor.value.replace("	", "  ");
		rerender();
	}

	function rerender(): void {
		let text = sanitize(editor.value);
		text = parseOsuTimestamps(text);
		text = text.replaceAll("	", "  ")
			.replaceAll("  ", "&nbsp;&nbsp;");
		overlayHtml = text.replaceAll("\n", '<br>');
	}

	function parseOsuTimestamps(text: string): string {
		console.log(text);
		return text.replace(
			/(\d{2}:\d{2}:\d{3}( \(\d+(,\d+)*\))?)/g,
			match => {
				return `<a href="osu://edit/${encodeURI(match)}" class="text-blue-200 hover:underline pointer-events-auto font-bold">${match}</a>`;
			}
		);
	}

	function sanitize(text: string): string {
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<textarea
	bind:this={editor}
	oninput={handleInput}
	class="absolute w-screen h-screen outline-none caret-white"
></textarea>

<div
	class="absolute w-screen h-screen outline-none pointer-events-none wrap-break-word"
>
	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html overlayHtml}
</div>
