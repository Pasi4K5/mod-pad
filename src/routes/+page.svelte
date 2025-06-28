<script lang="ts">
	import { onMount } from 'svelte';

	let editor: HTMLTextAreaElement;
	let overlayHtml = "";

	onMount(() => {
		editor.focus();
		updateEditorHeight();
		rerender();
	});

	function handleInput(): void {
		editor.value = editor.value.replace("	", "  ");
		updateEditorHeight();
		rerender();
	}

	function updateEditorHeight(): void {
		editor.style.height = `${editor.scrollHeight}px`;
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
				return '<a '
					+ `href="osu://edit/${encodeURI(match)}" `
					+ 'class="z-2 text-blue-200 hover:underline pointer-events-auto font-bold rounded-sm" '
					+ 'style="background-color: rgba(0, 0, 0, 0.333);" '
					+ `>${match}</a>`;
			}
		);
	}

	function sanitize(text: string): string {
		return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
</script>

<div class="m-4 relative">

	<!-- Editor -->
	<textarea
		bind:this={editor}
		oninput={handleInput}
		onblur={() => setTimeout(() => editor.focus(), 0)}
		class="absolute outline-none text-transparent caret-white w-full resize-none"
	></textarea>

	<!-- Overlay -->
	<div
		class="absolute w-full pointer-events-none wrap-break-word"
	>
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html overlayHtml}
	</div>

</div>
