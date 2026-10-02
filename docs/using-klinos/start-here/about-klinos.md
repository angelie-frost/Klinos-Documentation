---
title: About Klinos
description: What the name means, why we built it, and how V3 grew out of V2.
order: 2
lastUpdated: "[VERIFY: date]"
---

## The name

Klinos comes from the Greek word *klino*, meaning to tilt or to lean. The name describes what the plugin does: it tilts a device screen into a 3D perspective angle.

## Why we built it

The idea started from something small. While searching Pinterest for mockup inspiration for Checkpoint slides, these tilted, floating device mockups kept showing up — a style that stood out and raised a simple question: aside from paid rendering apps, was there a free tool that could achieve the same effect?

Existing mockup plugins were available, and while many offered high-quality mockups and preset angle options, most were limited in scope and not entirely free. Few, if any, allowed designers to freely adjust the angle or perspective of a mockup; most locked users into a fixed set of presets.

That gap led to a simple idea: build a Figma plugin around a library of device mockups, with the flexibility to explore any angle or perspective. It's built for anyone who wants to work with this kind of tilted, perspective layout style.

## Who it's for

The design team first. Beyond that, anyone who likes this style, as described above.

## From V2 to V3

### V2

V2 was the first Klinos. Its Studio mode drew the devices directly in shaders, as raymarched shapes. It covered the iPhone 13, iPhone 17 Pro, MacBook Pro 16″ and iPad Pro 11″.

V2's device finishes were fitted to Apple's own product renders. That colour matching is called the calibration.

### V3

V3 rebuilds the plugin on Three.js. The devices are now 3D meshes, but they still use V2's calibrated material. The finishes look the same as in V2.

The team compared the two before switching. The mesh version came within 0.33 to 0.64 points out of 255, on average, of V2's renders across finishes and poses. That close a match is why the calibration could be kept as it was.

### What V3 added

- **Editable lighting.** Looks, plus an editor for the softbox lights. Calibrated is the default and matches V2.
- **Sharper preview.** The preview renders at your screen's own pixel density and stays sharp when you zoom in. Drag it to turn the device and check the result, or try it in the [live demo](../reference/try-it-live.md).
- **Polished frame and Surface texture.** A mirror-polished frame for the phones, and a fine grain that makes the body read as metal on every device. Both are switches that start off. When you turn on Surface texture, it starts at its own default strength on each device. See [Devices and finishes](../studio/devices.md).
- **Galaxy S26.** A new device with no V2 version.
- **Photoreal mode.** Static renders of real devices with your design keyed into the screen.
- **Playground mode.** Any Figma layer as an angled card, or several layers as a layout. This is new in V3, not a V2 feature.
- **Dark theme.** V2's panel was light only. V3 keeps V2's panel design and adds a dark version on Figma's dark grey.

Smaller changes are listed in the [Changelog](../reference/changelog.md).

### How V3 stays true to V2

A test tool renders V2's shaders and V3's meshes at the same pose, finish and size, then compares them pixel by pixel. It fails if the Calibrated look drifts. Maintainers run it after changing a shader, the geometry or the camera.

## V2 and V3 side by side

- V3 installs beside V2. The two have different plugin IDs, but both are named "Klinos" in Figma. If you load both, rename one in its local manifest.
- V3 can't refresh mockups made in V2. A mockup's settings are private to the plugin that made it.

> **Tip**
> Not sure which one you have open? V3 shows its build number, for example v3.15, at the right of the preview's status bar.

<!-- Media to capture:
  1. Optional screenshot: the same device and finish rendered in V2 and V3, side by side, Calibrated look.
-->
