# Orra — Teleprompter App

## Role
Act as a senior software engineer with strong mobile UI and problem-solving skills. Be proactive, concise, and direct. Prioritize accuracy and security. User is non-technical — own all engineering decisions, explain briefly in plain language when relevant. For complex tasks, plan first. For risky or destructive actions, ask permission before proceeding. Never commit to git unless the user explicitly asks — it's a security and blunder risk.

## Commit Sequence (follow exactly when user says "commit")
1. Update memory files (`~/.claude/projects/.../memory/`) with anything new worth remembering
2. Update `CLAUDE.md` to document new features, design decisions, or architecture changes
3. Stage and commit everything together (code + docs in one commit)

## The UI Design
- The URL for the design in figma:
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
- **Options button** (bottom left) → opens floating glass context menu
- Read time estimate shown at the bottom (e.g. "~2 min read time") based on 140 wpm

## Player Screen UX (intended behaviour)
- After countdown (3-2-1), text auto-scrolls at the selected speed
- **Tap anywhere** → pause / resume from current position
- **Drag** → immediately pauses auto-scroll, user can freely scroll back and forth (e.g. re-read missed text); tap resumes from wherever they stopped
- **Pause/Play button** (bottom center) → same as tap; auto-hides after 2.5s of playing, reappears instantly on any tap; stays visible when paused
- **Return button** (bottom left) → back to editor at any time, cancels animation
- **Progress bar** (bottom edge, green) → 3px bar, full width at start, depletes right-to-left as script is read; always visible

## Project Overview
"Orra" is a React Native teleprompter app built with Expo SDK 54.

**Two screens:**
- `app/index.tsx` — Editor: write/import script, pick scroll speed (SpeedDial), play/reset
- `app/player.tsx` — Player: 3-2-1 countdown, requestAnimationFrame scroll, tap to pause/resume, fade-to-white on end
- `app/_layout.tsx` — Stack navigator, no headers, player has no transition animation

**State:** `app/store.ts` — module-level store (no Redux/Zustand). Passes script text, speed, and dark mode between screens. URL params were abandoned due to text length cutoff.

**Icons:** Custom SVG components in `components/icons.tsx` (Play, Pause, Return, Reset, Options, FileTray, DialArch, ArrowUpIcon, ArrowDownIcon).

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
| expo-haptics | ~15.0.8 |

## Architecture Notes
- Scroll animation uses `requestAnimationFrame` calling `scrollRef.current.scrollTo()` every frame — reliable on RN 0.81 new architecture (Fabric)
- `scrollYRef` (plain ref) tracks current scroll position; synced from `onScrollEndDrag` / `onMomentumScrollEnd` after manual drag
- `onScrollBeginDrag` pauses auto-scroll when user drags; animation resumes from `scrollYRef.current` on next play
- `READING_LINE = SCREEN_HEIGHT / 2` as static top/bottom padding — places start/end pills at screen center
- Reanimated used for: countdown zoom-out animation (scale 1→1.6, opacity 1→0, 850ms), player fade-in on first play (opacity 0→1, 800ms), fade-to-white on natural end (opacity 1→0, 500ms with 600ms delay), play button auto-hide (fade out 400ms after 2.5s, fade in 200ms on tap), progress bar width
- Play button auto-hide: `btnOpacity` shared value, `hideTimerRef` setTimeout. Fades out only while playing; any tap calls `showButton()` immediately before state change. `scheduleHide()` restarts timer on each resume.
- Progress bar: `progressValue` shared value (1→0), updated every RAF frame via `1 - scrollYRef.current / maxScroll`. `maxScrollRef` caches max scroll so it's accessible in `handleManualScrollEnd` for post-drag sync. Width = `progressValue * SCREEN_WIDTH`, left-anchored, shrinks from right.
- Scroll content: `paddingTop: READING_LINE + 96` (text starts 96px below reading line), `paddingBottom: READING_LINE + 180` (restores end runway lost when start/end pills were removed)
- Start and end pills removed — replaced by toasts: "start reading" on first play, "fin." on natural end. Toast shadow: opacity 0.18, radius 20, offset 6, elevation 10.

## Design
- White background (`#fff`), green accent `#34c759` for play/selected states
- Script text: 48px bold, lineHeight 56
- Speed dial arc at bottom center (134×134 container), play button 80px circle
- Speed dial background is a custom SVG arch (`DialArch` in icons.tsx) — 109×40, fill `#F4F4F4` (dark: `#2C2C2E`), positioned at `left: 12` in the 134px container to center it. Labels (.5x / 1x / 2x / 5x) arc along the top of the arch, symmetric around arch center (container x≈66). Do not use a plain View or gradient for the dial background.
- Top/bottom scrims via `expo-linear-gradient`. The transparent end of a scrim gradient MUST use matching-RGB transparent (e.g. `rgba(255,255,255,0)` with white, `rgba(0,0,0,0)` with black) — mismatched RGB channels produce muddy gray midpoints.
- App bar crossfade: single `Animated.Value` (0→1, 500ms). "Orra." + import fade out over first 200ms, 100ms empty gap, "Edit." fades in over last 200ms. Reverses on dismiss. Two `Animated.View` layers with `absoluteFill` + `pointerEvents` toggled.
- Scroll buttons: glass pill (24×24, borderRadius 12), `expo-blur` BlurView (intensity 20, tint light), `rgba(255,255,255,0.20)` bg, layered shadow. Go-to-top appears at `top: 16` when scrollY > 80; go-to-bottom at `bottom: 165` when more than 80px from end. Arrow SVGs from Figma, accept `color` prop. Border is a separate `absoluteFill` overlay view (not on the clip) so BlurView fills the full circle with no 1px gap — apply this pattern to all glass buttons.
- Icon buttons (options, reset, return): `Pressable` with 48×48 pill (borderRadius 40). Normal bg: `rgba(237,237,237,0.5)` light / `rgba(50,50,50,0.5)` dark. Active/pressed bg: `rgba(237,237,237,1)` light / `rgba(50,50,50,1)` dark. Options keeps active state while menu is open (`optionsOpen` flag). Tap area provided by pill size — no hitSlop needed.
- **Dark mode:** `store.getDarkMode()`/`setDarkMode()` persists across navigation. Both screens derive `bg`, `fg`, `icon`, `scrim`, `scrimClear`, `archFill`, `borderColor` inline at render time — StyleSheet stays static. StatusBar style, scrims, text, icons, borders, BlurView tints all adapt.
- **Options menu** (`components/OptionsMenu.tsx`): Modal glass card, position from `measureInWindow` on button tap (`cardBottom = SCREEN_HEIGHT - anchorY + 12`). Spring open (tension 600, friction 38), timing close 120ms. Scale from bottom-left via compensating translateX/translateY. 35% black backdrop. iOS 18+: `systemMaterial`/`systemMaterialDark` tint; older: manual BlurView + rgba bg. Dark mode adapts tint, bg, text, border. Rows: Dark Mode → FullDivider → "Player Options" header → Auto-rotate → Mirror Mode → Keep Screen Awake → Font Size (chevron only, not yet wired).

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
| 7 | Options menu position wrong repeatedly | Solved definitively with `measureInWindow` on the button at tap time. Do not compute from safe area insets. Formula: `cardBottom = SCREEN_HEIGHT - anchorY + 12`. |
| 8 | Scrim gradient shows muddy gray midpoints in dark mode | The transparent end of a LinearGradient must match the opaque end's RGB channels. Use `rgba(255,255,255,0)` with white, `rgba(0,0,0,0)` with black. Using `rgba(0,0,0,0)` with a white start causes the interpolation to pass through gray. Store as `scrimClear` computed from `darkMode`. |
| 9 | BlurView card looked opaque | `backgroundColor: '#fff'` on the shadow wrapper was blurring white → appeared solid. Fixed by setting shadow wrapper bg to `rgba(255,255,255,0.01)` so BlurView captures real background content. |
| 10 | Glass buttons show 1px dark gap on all sides in dark mode | `borderWidth: 1` on the `overflow: hidden` clip view shrinks the content box, leaving a 1px gap the dark background bleeds through. Fix: remove border from clip view, add a separate `absoluteFill` View with just `borderWidth`/`borderRadius` rendered on top. BlurView fills the full container with no gap. |

## Haptics
`expo-haptics` is wired to all main interactions:
- **Speed dial** → `selectionAsync()` on each tap
- **Play** → `impact(Medium)`
- **Reset confirm** → `notification(Warning)`
- **Done (edit dismiss)** → `impact(Light)`
- **Countdown tick (3/2/1)** → `impact(Light)`
- **Countdown end / scroll start** → `notification(Success)`
- **Pause / Resume / Return (player)** → `impact(Light)`

## Dev Commands
```bash
npx expo start --clear   # always clear cache after config changes
npx expo start --ios
npx expo start --android
```
