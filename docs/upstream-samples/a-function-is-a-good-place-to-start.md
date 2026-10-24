---
title: "A function is a good place to start"
description: "Before a service, a registry, or a framework, try naming one rule."
date: "2026-09-20"
author: "Rowan Ellis"
category: "Engineering"
tags: ["functions", "testing"]
featured: false
---

A surprising amount of application behavior can begin as a function that receives a value and returns a decision. It does not need to know where the value came from.

## Find the decision

Consider a list of articles. The interface asks which entries belong in a category. That is a rule about data, not a rule about components.

```ts
function inCategory(article: { category: string }, selected: string) {
  return selected === 'All' || article.category === selected
}
```

The function is almost boring. That is useful. You can explain it to another person without first explaining your state-management system.

## Keep effects around the rule

Fetching articles and writing preferences involve the outside world. Keep those operations in the code that coordinates the interaction. Feed their results into the rule.

You do not need to turn every line into an abstraction. Extract a rule when it has a name, a reason to change, or a meaningful behavior to test.

## Stop when it is clear

A function can grow into a module when the problem grows. Starting small does not prevent that. It gives you evidence about which parts actually belong together.
