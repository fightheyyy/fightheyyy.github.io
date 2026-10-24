---
title: "A small case for local-first software"
description: "Keep the work close to the person doing it. The network can catch up."
date: "2026-09-29"
author: "Mira Chen"
category: "Engineering"
tags: ["persistence", "offline"]
featured: false
---

The most useful offline feature is not an airplane icon. It is the quiet confidence that the sentence you just wrote will still be there when the train leaves the tunnel.

Local-first design begins with that expectation. The device holds a working copy, edits take effect immediately, and the network becomes a way to coordinate rather than a gate in front of every interaction.

## Start with ownership

Ask where the authoritative copy lives. If every keystroke must make a round trip before it is safe, a slow connection becomes part of the writing experience. That may be acceptable for some tools. It should be a deliberate choice.

For a personal notebook, a local database is a reasonable beginning. Save a complete edit in one transaction. Show whether synchronization is pending. Let the person export their own data without contacting your servers.

## Synchronization is a separate problem

Working offline does not magically solve conflicts. Two devices can edit the same note. Decide whether your product needs automatic merging, a conflict screen, or a simpler single-writer rule.

| Concern | Local responsibility | Sync responsibility |
| --- | --- | --- |
| Typing | Immediate feedback | Nothing yet |
| Saving | Durable transaction | Queue a change |
| Reconnection | Keep the editor usable | Reconcile versions |

The important boundary is visible behavior: pending synchronization must not look like lost work.

## Test the uncomfortable moment

Make an edit, close the tab, disconnect the network, and reopen it. Then reconnect from a second tab. Check the actual content, not merely the storage API's return value.

A small tool that passes this test has earned a little trust. That is a better beginning than a sync animation.
