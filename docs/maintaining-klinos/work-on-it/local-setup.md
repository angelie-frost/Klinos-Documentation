---
title: Local setup
description: Build Klinos, load it in Figma desktop, and set up the test tools.
order: 5
lastUpdated: "[VERIFY: date]"
---

There is no package install for the plugin itself. Python builds it. Node is only used for the parse check and the test tools.

## Requirements

- **Python 3,** to build.
- **Node,** for the parse check.
- **Figma desktop,** to load a development plugin. Local plugin import works in the desktop app only.
- **For the test tools:** Playwright (`npm i playwright`) and a Chromium. `CHROMIUM_PATH` is used if set, else `/opt/pw-browsers/chromium`, else Playwright's own.
- **For `tools/photoreal_assets.py` only:** Pillow and numpy.

On Windows, use `python` if `python3` is not on the path.

## Build

```sh
python3 tools/build.py            # writes ui.html and dist/preview.html
python3 tools/build.py --check    # builds, then node --check on every inline script and code.js
python3 tools/build.py --package  # builds, checks, then zips the plugin into dist/
```

Run `python3 tools/build.py --check` after every edit to `src/ui.html`. Don't call a change done before it passes.

## Load the plugin in Figma desktop

1. In Figma desktop, go to **Plugins → Development → Import plugin from manifest**.
2. Pick `manifest.json` in the repo root.

V3 installs beside V2. The plugin IDs are different, but both are named "Klinos". If you load both, rename one in its local manifest.

## Preview in a browser

`dist/preview.html` is the same panel running on its own. It loads Three.js from unpkg and uses images in place of Figma layers. The plugin build (`ui.html`) never loads anything from the network.

## Run the tests

```sh
node tools/verify.js            # parity with V2; give it 5 to 10 minutes under software GL
node tools/verify.js --legends  # the keyboard-legend guard alone, under a minute
node tools/render.js frames <outDir> <cases.json>
node tools/render.js closeup <outDir> <cases.json>
node tools/render.js diff <a.png> <b.png>
```

See [Testing and QA](testing-and-qa.md) for what each one proves.

> **Tip**
> Long renders under SwiftShader can take more than two minutes. Give render and verify commands 5 to 10 minutes before a timeout.

## Rebuild the Photoreal assets

Only after changing anything in `reference/photoreal/`:

```sh
python3 tools/photoreal_assets.py
```

Then build.
