---
title: Try it live
description: Use the Klinos panel in your browser, without Figma.
order: 6
lastUpdated: "[VERIFY: date]"
---

The live demo is the Klinos panel running in your browser. It is the same panel as the plugin, built as a standalone page, so you can try the controls before you install anything.

## What it is

The standalone preview is built from the same source as the plugin. There is no Figma selection, so images stand in for your frames and layers.

It loads its 3D library (Three.js) from the internet, so it needs a connection.

## Works fully

- **Theme.** Saved in the browser. The option reads "Match system" instead of "Match Figma".
- **Panel card order.** Saved in the browser.
- **Match a photo.** It uses a normal file picker, so it should work. This was read from the code, not tested.
- Switching modes, and the device, angle, lighting, staging, screen, frame, backdrop and shadow controls.

## Works partly

- **Use an image** stands in for the Figma selection. One image is the Studio screen design. Several images are Playground layers.
- **Insert becomes Export PNG.** It shows the image so you can save it.
- **Copy** only works where the browser allows writing to the clipboard. Otherwise the status bar tells you to use Export.

## Doesn't work here

- **Insert as layers.** The button is hidden.
- **Exploded layers.** Not offered.
- **Saving settings on a mockup, and Refresh.** They need Figma.

## Reset the demo

Click **Reset** above the demo. It restores everything to the default, including the remembered card order.

<!-- Media to capture:
  1. Screenshot: the live demo on this page, loaded, with Studio showing the placeholder design.
  2. Clip, 6 s: use an image to stand in for a frame, then click Export PNG and show the image.
-->
