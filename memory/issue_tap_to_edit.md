---
name: Tap-to-edit fix (cursor placement + keyboard behaviour)
description: Last worked-on issue — editor TextInput tap behaviour, keyboard on scroll, cursor hidden behind keyboard
type: project
originSessionId: cedfabe2-8e32-4868-813a-97960c0ff8bc
---
## The Problem

Three related issues on the editor screen when tapping to edit the script:

1. **Two taps required** — first tap removed bottom controls and showed Done button, but no cursor appeared and no keyboard. Had to tap a second time to actually start editing.
2. **Keyboard fired during scroll** — just scrolling the script (not intending to edit) would sometimes pop up the keyboard.
3. **Cursor hidden behind keyboard** — after the keyboard appeared, the cursor/text was obscured behind it rather than scrolled into view.

## Root Cause

We were using `editable={isEditing}` on the TextInput, toggled by `onPressIn`. On iOS, `onPressIn` does **not** fire on a non-editable TextInput — so the first tap was silently ignored. The manual `keyboardWillShow` listener + `marginBottom: keyboardHeight` approach to shift content up was also unreliable.

## The Fix

Three changes working together:

| Change | Why |
|---|---|
| `editable={true}` always | iOS places cursor exactly where tapped on first touch |
| `onFocus={() => setIsEditing(true)}` | Replaces broken `onPressIn` — fires reliably when TextInput gains focus |
| `KeyboardAvoidingView behavior="padding"` wrapping content | Lifts the entire content area when keyboard appears — Done button stays at `bottom: 16` above keyboard automatically, no manual height math |
| `Keyboard.dismiss()` in `onScrollBeginDrag` (when not editing) | Prevents keyboard firing during accidental scroll touches |

## Files Changed

- `app/index.tsx` — TextInput, ScrollView, removed keyboard listeners, replaced `View` wrapper with `KeyboardAvoidingView`

## What to Verify When Testing

- Tap script text → cursor appears at tap position immediately (one tap)
- Keyboard appears, Done button is visible above it
- Scrolling without tapping text → no keyboard
- Tap Done → keyboard dismisses, controls return
