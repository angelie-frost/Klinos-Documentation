---
title: Ownership and access
description: Who publishes Klinos, where the code lives, and how access works.
order: 13
lastUpdated: "[VERIFY: date]"
---

## Publishing

The Chief Creative Officer publishes new versions of Klinos to the company's Figma organization. Designers open it from there.

## Code

The code lives in a GitHub repository. Anyone with access to the repository can review changes. See [Branching and contributing](../work-on-it/branching-and-contributing.md).

## Docs

The docs site is a separate project from the plugin repository. Docs updates are made on their own, not in the same commit or pull request as a code change.

## Feedback

Bug reports and feedback go directly to the plugin's maintainer. See [Feedback and bug reports](../../using-klinos/reference/feedback.md).

## What the repo says

- Changing `manifest.json` needs asking first. Plugin data is private to the plugin ID, so saved mockups depend on it.
- Working agreements for anyone changing the code are in `CLAUDE.md`. See [AI-assisted development](../work-on-it/ai-assisted-development.md).
