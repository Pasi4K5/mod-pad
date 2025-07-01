<script lang="ts">
    function setLinksClickable(ev: KeyboardEvent, clickable: boolean) {
        console.log(ev.type);
        if (ev.key !== 'Control') {
            return;
        }

        for (const linkEl of document.querySelectorAll('[data-link]')) {
            const classList = linkEl.classList;
            const toggle = clickable ? classList.add : classList.remove;
            toggle.call(classList, 'pointer-events-auto');
        }
    }
</script>

<svelte:window
    onkeydown={(ev) => setLinksClickable(ev, true)}
    onkeyup={(ev) => setLinksClickable(ev, false)}
/>
