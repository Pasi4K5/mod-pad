<script lang="ts">
	import { onMount } from 'svelte';

	let editor: HTMLTextAreaElement;
	let overlayHtml = "";

	onMount(() => editor.focus());

	function handleInput(): void {
		editor.value = editor.value.replace("	", "  ");
		editor.style.height = `${editor.scrollHeight}px`;
		rerender();
	}

	function rerender(): void {
		let text = sanitize(editor.value);
		text = parseOsuTimestamps(text);
		text = text.replaceAll("	", "  ")
			.replaceAll("  ", "&nbsp;&nbsp;")
			.replaceAll("\n", "&nbsp;\n")
			+ "&nbsp;";
		const lines = text.split("\n");

		let html = "";

		let i: number;
		for (i = 0; i < lines.length; i++) {
			const line = lines[i];

			html += `<div>${line}</div><div class="h-[1px] mb-[-1px] bg-gray-700"></div>`;
		}

		overlayHtml = html;
	}

	function parseOsuTimestamps(text: string): string {
		return text.replace(
			/(\d{2}:\d{2}:\d{3}( \(\d+(,\d+)*\))?)/g,
			match => {
				return `<a href="osu://edit/${encodeURI(match)}" class="text-blue-200 hover:underline pointer-events-auto font-bold bg-gray-900 rounded-sm">${match}</a>`;
			}
		);
	}

	function sanitize(text: string): string {
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<div class="m-2 relative">

	<!-- Overlay -->
	<div
		class="absolute z-0 w-full pointer-events-none wrap-break-word"
	>
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html overlayHtml}
	</div>

	<!-- Editor -->
	<textarea
		bind:this={editor}
		oninput={handleInput}
		class="absolute z-1 outline-none text-transparent caret-white w-full resize-none"
	></textarea>

</div>
