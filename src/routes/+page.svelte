<script lang="ts">
	import { onMount } from 'svelte';

	let editor: HTMLTextAreaElement;
	let overlayHtml = "";

	onMount(() => {
		editor.focus();
		rerender();
	});

	function normalizeEditorContent(): void {
		editor.value = editor.value.replace(/\t/g, "  ");
		updateEditorHeight();
	}

	function updateEditorHeight(): void {
		editor.style.height = `${editor.scrollHeight}px`;
	}

	function rerender(): void {
		normalizeEditorContent();

		let text = sanitize(editor.value);
		text = replaceOsuTimestamps(text);
		text = replaceTodos(text);
		text = text.replaceAll("  ", "&nbsp;&nbsp;")
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

	function replaceOsuTimestamps(text: string): string {
		return text.replace(
			/(\d{2}:\d{2}:\d{3}( \(\d+(,\d+)*\))?)/g,
			match => {
				return '<a '
					+ `href="osu://edit/${encodeURI(match)}" `
					+ 'class="z-2 text-blue-200 bg-black/33 hover:underline pointer-events-auto font-bold rounded-sm" '
					+ `>${match}</a>`;
			}
		);
	}

	function replaceTodos(text: string): string {
		return text.replace(
			/(\bTODO\b.*)/g,
			"<span class='font-bold text-amber-600 bg-amber-600/20 rounded-sm'>$1</span>"
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
		oninput={rerender}
		onblur={() => setTimeout(() => editor.focus(), 0)}
		onpaste={normalizeEditorContent}
		class="absolute outline-none text-transparent caret-white w-full resize-none"
	></textarea>

	<!-- Overlay -->
	<div
		class="absolute w-full pointer-events-none wrap-break-word pb-4"
	>
		<!-- eslint-disable svelte/no-at-html-tags -->
		{@html overlayHtml}
	</div>

</div>
