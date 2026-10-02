---
title: Data and compatibility
description: What Klinos stores, where, and how saved settings stay compatible.
order: 4
lastUpdated: "[VERIFY: date]"
---

## Two places, two kinds of data

| Data | Where | Scope |
|---|---|---|
| A mockup's settings | Plugin data on the inserted node, key `perspectiveMockup` | Travels with the Figma file |
| Panel layout | `figma.clientStorage`, key `layout` | Per user, per plugin, on one machine |
| Theme | `figma.clientStorage`, key `theme` | Per user, per plugin |
| Card order | `figma.clientStorage`, key `cardOrder` | Per user, per mode |

`clientStorage` can be cleared, and it never goes in the file. In the standalone preview, card order is kept in `localStorage` under `klinos-card-order`.

## What is stored on a mockup

- **Studio and Photoreal:** `{sourceId, settings}`. Selecting the mockup restores the settings, so it can be refreshed in place.
- **Playground image:** `{sourceId, sourceIds, settings}`, so a refresh reads every source layer back.
- **Playground layers:** plugin data with `kind: 'layers'`. Selecting the frame restores its settings and the button reads Rebuild layers.
- **Exploded layers:** the layer list choices (`plExplodeSel`) are saved with the image.

Plugin data is private to the plugin ID that wrote it. V3 can't read V2's mockups, and V2 can't read V3's.

## Temporary data

Exploded layers reads cards from temporary copies of the frame, named "Klinos temporary" and marked with plugin data `klinosTemporary`. Each copy is removed after the read, and leftovers are swept when the plugin starts.

## The settings version

`SETTINGS_V = 3`, saved as `v` in every mockup's settings.

New features have added their keys without changing it: Playground's `pl*` keys, `staging` and `stageFloat`, all with `SETTINGS_V` unchanged. Ask before changing the version.

## How restoring works

`restoreSettings` in `src/ui.html` does this for every saved mockup:

1. Start from `defaults()`.
2. Copy over only the keys `defaults()` knows. Unknown keys are ignored.
3. Validate and clamp each value. An unknown device becomes the iPhone 17 Pro, an unknown finish becomes that device's default, numbers are clamped to their slider ranges, and an unknown Look falls back to Calibrated.
4. Set `v` to the current `SETTINGS_V`.

So a mockup saved before a key existed opens with that key's default.

## How a migration is written

The existing code shows the pattern: translate old values inside `restoreSettings`, after the copy and before validation.

```js
// Silver and Gold were V2's (non-iPhone 13) finishes; Starlight is the nearest light one.
if (d.phoneFinish === 'Silver' || d.phoneFinish === 'Gold') d.phoneFinish = 'Starlight';
```

Another example: a v3-14 mockup had one `grainAmt` for all bodies. It now carries over into `grainAmtBy` for its own body only, and only if it was changed from the old default.

Rules for a new migration:
- Keep it in `restoreSettings`, so every saved mockup passes through it.
- Map old values to the nearest current ones. Never throw on bad data; fall back to a default.
- Add new keys to `defaults()` and clamp them in `restoreSettings`.
- Ask before changing `SETTINGS_V`.

## Card order is sanitised

`sanitizeOrder` keeps known card IDs in saved order, drops unknown and duplicate ones, and inserts a missing card at its default index. Any bad value means the default order.
