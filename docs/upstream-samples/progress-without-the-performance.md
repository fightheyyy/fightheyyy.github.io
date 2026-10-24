---
title: "Progress without the performance"
description: "A reading indicator can orient a person without asking for attention."
date: "2026-09-02"
author: "Rowan Ellis"
category: "Design"
tags: ["scrolling", "motion"]
featured: false
---

A good reading-progress indicator is something you can ignore until you need it. It answers a small question: how far through this piece am I?

## Measure the article

The footer is not part of the essay. Neither is a long list of related posts. Calculate progress from the reading region so that reaching the last paragraph feels like reaching the end.

A short article needs a separate rule because its height may be less than the viewport. Clamping a division by zero is not a design decision.

## Change the form with the screen

A desktop sidebar has room for a percentage and a quiet segmented bar. A phone does not. A thin line at the top can keep the same information without taking space from the text.

## Respect stillness

Progress can update directly with scrolling. It does not need a spring, a bounce, or a delay. If the person prefers reduced motion, preserve the useful information and remove the decorative movement.
