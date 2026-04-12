# Orra — Teleprompter App

## Role
Act as a senior software engineer with strong mobile UI and problem-solving skills. Be proactive, concise, and direct. Prioritize accuracy and security.

## Project Overview
"Orra" is a React Native teleprompter app built with Expo SDK 54.

**Two screens:**
- `app/index.tsx` — Editor: write/import script, pick scroll speed (SpeedDial), play/reset
- `app/player.tsx` — Player: 3-2-1 countdown, auto-scroll via reanimated, tap to pause/resume, fade-to-white on end
- `app/_layout.tsx` — Stack navigator, no headers, player has no transition animation

**State:** `app/store.ts` — module-level store (no Redux/Zustand). Passes script text and speed between screens. URL params were abandoned due to text length cutoff.

**Icons:** Custom SVG components in `components/icons.tsx` (Play, Pause, Return, Reset, Options, FileTray).

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
- Scroll animation uses a `scrollY` shared value mirrored to the ScrollView via `useAnimatedReaction` → `scrollTo` on the UI thread at 60fps
- Manual drag syncs `scrollY` at gesture end (single event) to avoid feedback loops
- `READING_LINE = SCREEN_HEIGHT / 2` used as static top/bottom padding — avoids circular layout dependency

## Design
- White background (`#fff`), green accent `#34c759` for play/selected states
- Script text: 48px bold, lineHeight 56
- Speed dial arc at bottom center (134×134 container), play button 80px circle
- Top/bottom scrims via `expo-linear-gradient`

## Dev Commands
```bash
npx expo start        # start dev server
npx expo start --ios  # iOS simulator
npx expo start --android
```
