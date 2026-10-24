---
title: "A browser is not a mock"
description: "Focus, storage, and layout deserve to meet the environment that owns them."
date: "2026-09-17"
author: "Mira Chen"
category: "Engineering"
tags: ["browser", "testing"]
featured: false
---

An input can pass a component test and still be impossible to reach with a keyboard. A storage call can resolve and still leave two tabs disagreeing. The browser has behavior that a plain JavaScript runtime does not reproduce.

## Choose the environment for the question

Use a fast logic test for sorting or filtering. Use a browser when the question concerns focus, rendering, native controls, or persistence. Use a complete journey when several boundaries have to cooperate.

The goal is not to move every test into the slowest environment. It is to avoid asking a mock to prove something it cannot observe.

## Look at the result

Open a dialog, move through its controls, and close it. Verify that focus returns to the trigger. Resize the page and check whether the menu still fits. Reload after a save and read the value back through the interface.

Those checks describe outcomes. They leave room to change the implementation.

## Keep one piece of evidence

For visual behavior, keep a screenshot with its viewport and scenario. For scrolling, a short recording is more useful than a hundred assertions about CSS classes.

Evidence should help the next person understand what happened. A green command without a visible result often leaves too much to guess.
