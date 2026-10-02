---
title: About Klinos
description: What the name means, why the plugin exists, and how V3 grew out of V2.
order: 2
lastUpdated: "[VERIFY: date]"
---

## The name

Klinos comes from the Greek word *klino*, meaning to tilt or to lean. The name describes what the plugin does: it tilts a device screen into a 3D perspective angle.

## Why it exists

Klinos is our in-house Figma plugin for making mockups. It lets you put a frame onto a device, or turn any layer into an angled card, without leaving Figma. The result goes back onto the canvas next to your design.

The idea started from tilted, floating device mockups seen on Pinterest while looking for inspiration for Checkpoint slides. Existing mockup plugins mostly locked users into fixed presets and were not fully free.

Klinos is a free Figma plugin with a library of device mockups where you can explore any angle or perspective.

## Who it's for

The design team, and anyone who wants this tilted, angled mockup style.

## From V2 to V3

### V2

V2 was the first Klinos. Its Studio mode drew the devices directly in shaders, as raymarched shapes. It covered the iPhone 13, iPhone 17 Pro, MacBook Pro 16″ and iPad Pro 11″.

V2's device finishes were fitted to Apple's own product renders. That colour matching is called the calibration.

### V3

V3 rebuilds the plugin on Three.js. The devices are now 3D meshes, but they still use V2's calibrated material. The finishes look the same as in V2.

The team compared the two before switching. The mesh version came within 0.33 to 0.64 points out of 255, on average, of V2's renders across finishes and poses. That close a match is why the calibration could be kept as it was.

### What V3 added

- **Editable lighting.** Looks, plus an editor for the softbox lights. Calibrated is the default and matches V2.
- **Galaxy S26.** A new device with no V2 version.
- **Photoreal mode.** Static renders of real devices with your design keyed into the screen.
- **Playground mode** (unreleased, ships in the next package, v3.16). Any Figma layer as an angled card, or several layers as a layout. This is new in V3, not a V2 feature.
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
