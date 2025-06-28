<script lang="ts">
	import { onMount } from 'svelte';

	let editor: HTMLDivElement;
	let overlayHtml = "";

	onMount(() => editor.focus());

	function rerender(): void {
		let text = sanitize(editor.innerText);
		text = parseOsuTimestamps(text);
		overlayHtml = text.replace(/\n/g, '<br>');
	}

	function parseOsuTimestamps(text: string): string {
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

<div
	bind:this={editor}
	contenteditable="true"
	oninput={rerender}
	class="absolute w-screen h-screen outline-none text-transparent caret-white"
></div>

<div
	class="absolute w-screen h-screen outline-none pointer-events-none"
>
	<!-- eslint-disable svelte/no-at-html-tags -->
	{@html overlayHtml}
</div>
