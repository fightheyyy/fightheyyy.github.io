---
title: Building for the long way round
description: A quieter approach to making things for the web. Start with something useful, leave room to change your mind, and keep the important parts close.
date: '2026-10-02'
author: Rowan Ellis
category: Engineering
tags: [craft, architecture, local-first]
featured: true
---
There is a particular kind of satisfaction in a tool that still works after you have forgotten how it was built. You open it, find the thing you came for, and get on with your day. Nothing asks you to remember a framework, renew a session, or admire the infrastructure.

That is the kind of software I want to make more of. Small enough to understand. Useful enough to keep. Built with some consideration for the person who will have to change it six months from now — who, inconveniently, will probably be me.

This is a notebook about that work. Here is where I would start.

## Start with the useful thing

Before picking a library, write down one thing a person should be able to finish. Make it specific enough that you can sit beside them and watch it happen.

For a reading list, “manage knowledge” is too large. “Save this page, find it tomorrow, and remember why I saved it” is a useful beginning. It gives you three moments to design and three behaviors to verify.

The first version can be modest. A title, a URL, a short note, and a date. You do not need a graph to prove that remembering a page is valuable.

::note-figure{label="Fig. A" caption="A small loop that earns its place. Each step leaves the reader somewhere better than before."}
Save a page → Leave a note → Find it again
::

The loop matters more than the feature count. If someone can complete it without asking for help, you have a foundation worth extending.

## Keep the moving parts visible

A small application still has boundaries. It receives input, applies a rule, stores a result, and renders something a person can act on. Those boundaries become easier to work with when they are explicit.

### A rule you can read

Here is the entire rule for whether a saved page matches a search. There is no component instance, storage connection, or network request hiding inside it.

```ts
interface SavedPage {
  title: string
  note: string
  tags: readonly string[]
}

export function matches(page: SavedPage, query: string): boolean {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const text = [page.title, page.note, ...page.tags].join(' ').toLowerCase()

  return words.every(word => text.includes(word))
}
```

An empty query matches everything because there are no words to reject. A multi-word query requires every word to appear, but their order does not matter. Both decisions are visible in a few lines.

This function is not an architecture. It is one clean boundary. That is usually a better unit of progress.

### Storage at the edge

Now place persistence behind a small interface. The important choice is not the name of the pattern. It is whether the reading-list rules can run without opening a browser database.

```ts
interface PageStore {
  save(page: SavedPage): Promise<void>
  list(): Promise<readonly SavedPage[]>
}
```

A browser adapter can implement this interface with IndexedDB. A test can implement it with an array. Each has a different job, and neither needs to pretend to be the other.

Be careful with interfaces that predict every future feature. Add a capability when a real interaction requires it. The boundary should make the current system easier to understand, not advertise how much architecture you know.

### Name the failure

The storage adapter might fail. The browser could run out of space, a migration could be interrupted, or a document could be malformed. Those are different situations, but the person using your tool needs one immediate answer: did my work survive?

Keep the unsaved note visible. Explain what happened in the place where they were working. Offer a way to copy or export it before suggesting a retry. A toast that disappears while the data is lost is not recovery.

## Give the interface some room

A list is often a better starting point than a wall of cards. It puts titles on a shared edge, gives dates a predictable home, and makes a long collection easy to scan.

Whitespace is part of that structure. It separates the introduction from the index, one thought from the next, and the controls from the content they act on.

| Element | What it should help with | What to keep quiet |
| --- | --- | --- |
| Title | Recognizing the saved page | Decorative weight |
| Date | Locating it in time | Repeated labels |
| Note | Remembering why it mattered | Unnecessary truncation |
| Tags | Narrowing the collection | Competing colors |

A useful test is to remove the decoration and look again. Can you still see the hierarchy? If the answer is no, more decoration probably will not help.

> The interface should spend its energy on the thing the person came to do.

This applies to motion too. A small transition can explain where an element went. An entrance animation on every navigation can make someone wait for something they already understand.

## Test the journey at its boundaries

There is no single test that proves a reading list works. Different checks answer different questions. Choosing the right environment for each one keeps the feedback useful.

### Rules in isolation

Check that matching is case-insensitive, that an empty query preserves all pages, and that multiple search terms combine correctly. These tests are quick because they do not need a browser.

```ts
expect(matches(
  { title: 'A useful page', note: 'Read after lunch', tags: ['design'] },
  'USEFUL design',
)).toBe(true)
```

A test should explain a decision. If changing an internal variable name breaks it, the test probably knows more than it needs to.

### The browser as a real environment

Storage, focus, and scrolling belong in a browser. Save a page, reload, and find it again. Open the search dialog with a keyboard. Close it and verify that focus returns to the control that opened it.

Do not stop at “the button received a click.” Look for the result that matters: a saved item, a visible error, or a restored focus target. These observations survive implementation changes.

### One complete trip

Finally, follow the smallest complete journey: save, annotate, search, reopen. Use a realistic title, a long note, and a narrow viewport. The application should make sense without the person who built it standing nearby.

::callout{title="A practical stopping point"}
When the useful loop works, pause before adding another feature. Ask someone to use it. The next improvement may be a clearer label rather than a new capability.
::

## Leave a path for the next person

Write down how to run the project, where the rules live, and what must pass before a change ships. Keep those instructions close to the code. A small, accurate document is easier to trust than a long guide that describes last year's system.

For sample content, include the awkward cases: a long title, a table that needs horizontal scrolling, an article with nested headings, and a search that finds nothing. They are not edge cases to the person who encounters them.

Use honest defaults. A newsletter form should not promise a subscription unless it is connected to a service. A Copy button should only say “Copied” after the clipboard accepts the text. A draft should remain outside the public collection.

## Keep going, gently

Building for the long way round does not mean predicting every future requirement. It means leaving enough clarity that a future change feels possible.

Start with a useful loop. Keep its rules readable. Test the places where it meets the world. Give the interface room to explain itself. Then write down what you learned.

The next note can begin there.
