# mod!pad

A simple, minimalist, web-based notepad application for osu! modding.

<p align="center">
    <img src="./assets/img/mod_pad_512.png" alt="mod!pad logo"/>
</p>

## How to use mod!pad

First, open [mod!pad](https://modpad.pasi.dev/) in your web browser.

Type `/` to open the command palette, and continue typing to search for commands.
Most importantly, you can use `/save` to save your current note to a text file,
and `/open` to load a text file from your local file system.

## Features

Most notably, osu! timestamps (all game modes supported) are highlighted and clickable.

Furthermore, it offers some simple text highlighting for `*emphasis*`, `* bullet points` and `TODO`s.
URLs are clickable while holding `Ctrl`.

## Tech Stack

osu!pad is built with Svelte, TypeScript, Tailwind CSS, and Deno.

## Running mod!pad locally

**Prerequisites:**
- [Git](https://git-scm.com/downloads)
- [Deno](https://deno.com/)

**Step 1:** Clone the repository:

```bash
git clone https://github.com/Pasi4K5/mod-pad.git
cd mod-pad
```

**Step 2:** Install dependencies:

```bash
deno install --allow-scripts
```

**Step 3:** Start the development server:

```bash
deno task dev --open
```

## Contributing

Contributions of any kind (bug reports, feature requests, pull requests) are welcome!

Please read the [contributing guidelines](./CONTRIBUTING.md) before proceeding.
