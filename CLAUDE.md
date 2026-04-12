# Orra — Teleprompter App

## Role
Act as a senior software engineer with strong mobile UI and problem-solving skills. Be proactive, concise, and direct. Prioritize accuracy and security. User is non-technical — own all engineering decisions, explain briefly in plain language when relevant. For complex tasks, plan first. For risky or destructive actions, ask permission before proceeding.

## Figma
https://www.figma.com/design/LFRVlQU3x3TRIAalhUvj3R/orra-app?node-id=24-390&t=nnLNLf3iPh2Vmoff-0

## What is a Teleprompter App
A teleprompter scrolls a script at a controlled speed so a speaker can read while looking at the camera — no memorization needed. Used by news anchors, YouTubers, presenters, podcasters. Core experience: load script → set speed → play (hands-free auto-scroll) → pause/resume if needed.

## Editor Screen UX (intended behaviour)
- Default script is pre-loaded on first open
- **Tap the script text** → enters edit mode (title changes from "Orra." to "Edit.")
- **Edit mode**: full-screen text input, keyboard appears, "Done" button floats above keyboard to dismiss
- **Import button** (top right, file tray icon) → pick a `.txt` file, replaces current script
- **Speed dial** (bottom center arc) → select scroll speed: 0.5x / 1x / 2x / 5x
- **Play button** (bottom center circle, green) → saves script + speed to store, navigates to player
- **Reset button** (bottom right) → confirmation alert, resets script to default
- **Options button** (bottom left) → not yet implemented
- Read time estimate shown at the bottom (e.g. "~2 min read time") based on 140 wpm

## Player Screen UX (intended behaviour)
- After countdown (3-2-1), text auto-scrolls at the selected speed
- **Tap anywhere** → pause / resume from current position
- **Drag** → immediately pauses auto-scroll, user can freely scroll back and forth (e.g. re-read missed text); tap resumes from wherever they stopped
- **Pause/Play button** (bottom center) → same as tap
- **Return button** (bottom left) → back to editor at any time, cancels animation

## Project Overview
"Orra" is a React Native teleprompter app built with Expo SDK 54.

**Two screens:**
- `app/index.tsx` — Editor: write/import script, pick scroll speed (SpeedDial), play/reset
- `app/player.tsx` — Player: 3-2-1 countdown, requestAnimationFrame scroll, tap to pause/resume, fade-to-white on end
- `app/_layout.tsx` — Stack navigator, no headers, player has no transition animation

**State:** `app/store.ts` — module-level store (no Redux/Zustand). Passes script text and speed between screens. URL params were abandoned due to text length cutoff.

**Icons:** Custom SVG components in `components/icons.tsx` (Play, Pause, Return, Reset, Options, FileTray, DialArch).

**Toast:** `components/Toast.tsx` — `useToast` hook + `Toast` component. Pill-shaped, white bg, subtle shadow, centered on screen, fade + scale animation. Font 18px bold, padding 28×16. Three triggers: script reset → "Script reset to default", file import → "Script imported", completed run → "That's a wrap". Completed-run signal lives in `store.ts` as `setCompletedRun` / `takeCompletedRun` (reads-and-clears). Player calls `setCompletedRun` only in the natural-end `finished` callback, not on manual return. Editor checks via `useFocusEffect`.

## Stack
| Package | Version |
|---|---|
| Expo | ~54.0.33 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| expo-router | ~6.0.23 |
| react-native-reanimated | ~4.1.1 |
| react-native-svg | 15.12.1 |
| expo-linear-gradient | ^15.0.8 |
| expo-document-picker | ~14.0.8 |

## Architecture Notes
- Scroll animation uses `requestAnimationFrame` calling `scrollRef.current.scrollTo()` every frame — reliable on RN 0.81 new architecture (Fabric)
- `scrollYRef` (plain ref) tracks current scroll position; synced from `onScrollEndDrag` / `onMomentumScrollEnd` after manual drag
- `onScrollBeginDrag` pauses auto-scroll when user drags; animation resumes from `scrollYRef.current` on next play
- `READING_LINE = SCREEN_HEIGHT / 2` as static top/bottom padding — places start/end pills at screen center
- Reanimated used for: countdown zoom-out animation (scale 1→1.6, opacity 1→0, 850ms), player fade-in on first play (opacity 0→1, 800ms), and fade-to-white on natural end (opacity 1→0, 500ms with 600ms delay)

## Design
- White background (`#fff`), green accent `#34c759` for play/selected states
- Script text: 48px bold, lineHeight 56
- Speed dial arc at bottom center (134×134 container), play button 80px circle
- Speed dial background is a custom SVG arch (`DialArch` in icons.tsx) — 109×40, fill `#F4F4F4`, positioned at `left: 12` in the 134px container to center it. Labels (.5x / 1x / 2x / 5x) arc along the top of the arch, symmetric around arch center (container x≈66). Do not use a plain View or gradient for the dial background.
- Top/bottom scrims via `expo-linear-gradient`

## Decisions & Solutions Log
Problems we've hit and how we solved them — do not revisit these.

| # | Problem | Solution |
|---|---|---|
| 1 | Player scroll animation not working at all | `babel.config.js` was missing — reanimated's babel plugin is required for worklets to run. Created it with `react-native-reanimated/plugin`. |
| 2 | `reactCompiler: true` in app.json | Removed — React Compiler (experimental) conflicts with reanimated hooks. |
| 3 | `scrollEnabled={false}` during playing blocked programmatic scroll | `scrollEnabled={true}` always. `onScrollBeginDrag` pauses state instead. |
| 4 | `useAnimatedReaction` + `scrollTo` unreliable on RN 0.81 Fabric | Replaced with `requestAnimationFrame` + `scrollRef.current.scrollTo()` — frame-synced, JS-thread, works on all architectures. |
| 5 | Speed dial background looked wrong (flat gray oval / full circle) | The background is an exact SVG arch from Figma (`DialArch` component, 109×40). Do not replace with a View or LinearGradient. The "go to bottom" button (iOS glass look) is a separate element — do not confuse it with the dial knob. |
| 6 | Speed dial labels mispositioned / asymmetric | Labels must be symmetric around arch center (container x≈66). Correct positions: `.5x` left:12 top:12 rotate:-42deg, `1x` left:36 top:0 rotate:-15deg, `2x` left:74 top:0 rotate:15deg, `5x` left:95 top:12 rotate:41deg. Moving labels below the arch (into play button area) hides them behind the play button — keep top values at 0–12. |

## Dev Commands
```bash
npx expo start --clear   # always clear cache after config changes
npx expo start --ios
npx expo start --android
```
