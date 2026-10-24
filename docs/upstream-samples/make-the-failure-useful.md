---
title: "Make the failure useful"
description: "An error message should leave someone with one good next step."
date: "2026-09-23"
author: "Mira Chen"
category: "Workflow"
tags: ["errors", "writing", "recovery"]
featured: false
---

Something went wrong. The application knows a request failed, but the person using it knows only that their work has stopped. The gap between those two perspectives is where a useful error message belongs.

## Say what survived

Start with the thing the person cares about. If their draft is safe, say so. If it is only stored in the current tab, explain that honestly and offer a way to copy it.

Do not promise a save merely because the request was sent. Wait for the operation to complete, then describe the result.

::media-tabs{first="Before" second="After"}
#first
Something went wrong. Error 503. Try again.

#second
Your note is still on this device. We could not sync it just now. Keep writing, or try syncing again when the connection is back.
::

## Offer a specific action

“Try again” is useful when a retry might work. It is frustrating when the same invalid input will fail forever. Tell people which field needs attention, preserve what they entered, and put the action beside the explanation.

## Keep the technical detail available

A support identifier can help someone investigate. Keep it secondary and easy to copy. It should not replace the explanation.

```ts
interface SaveResult {
  savedLocally: boolean
  sync: 'complete' | 'pending' | 'failed'
}
```

This state describes more than success or failure. The interface can tell the truth about local safety even when the network is unavailable.

## Test recovery

Turn the network off while saving. Read the message without looking at the console. Can you tell what happened, what remains, and what to do next? That is the acceptance test.
