---
title: "Leave a better README than you found"
description: "A useful front door explains how to run, change, and verify a project."
date: "2026-09-11"
author: "Mira Chen"
category: "Workflow"
tags: ["documentation", "onboarding"]
featured: false
---

The README is often the first place a new contributor looks and the last place a departing contributor edits. That mismatch explains a lot of confusing afternoons.

## Put the first successful action near the top

State the runtime requirements and the exact install and start commands. Include the expected local address. A person should be able to reach a working page before reading the entire architecture discussion.

## Show where a change belongs

A short map is enough: content lives here, shared rules there, browser adapters over there. Link to deeper documentation when the explanation needs room.

Avoid a directory listing that merely repeats the file explorer. Explain the responsibility, not just the name.

## Make verification concrete

Document the command that checks a change and what it covers. Separate a build from browser evidence. If a deployment is a different action, say so.

Finally, follow your own instructions in a fresh checkout. The missing step becomes obvious when you no longer rely on the state of your usual machine.
