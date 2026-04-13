---
name: Teleprompter app overview
description: Core project context — what the app is, its stack, and how it's structured
type: project
originSessionId: a6391376-af53-4080-8eae-b6de12b1852c
---
React Native teleprompter app called "Orra" built with Expo SDK 54 and expo-router.

**Two screens:**
- `app/index.tsx` — Editor screen: write/import script, pick scroll speed (0.5x/1x/2x/5x via a SpeedDial), play/reset
- `app/player.tsx` — Player screen: countdown (3-2-1), then auto-scrolls using requestAnimationFrame, tap to pause/resume, ends with fade-to-white then navigates back

**State sharing:** `app/store.ts` — simple module-level store (no Redux/Zustand), passes script text, speed, dark mode, and autoRotate between screens.

**Why:** URL param approach was abandoned due to text length cutoff.

**Stack:** Expo 54, React Native 0.81.5, React 19, react-native-reanimated ~4.1.1, expo-router ~6.0.23, expo-linear-gradient, expo-document-picker, react-native-svg, expo-screen-orientation.

**Icons:** Custom SVG icons in `components/icons.tsx` (Play, Pause, Return, Reset, Options, FileTray, DialArch, ArrowUpIcon, ArrowDownIcon).

**Toast:** `components/Toast.tsx` — `useToast` hook + `Toast` component. Centered on screen, pill shape, white bg, subtle shadow, fade+scale animation, 18px bold, padding 28×16. Triggers: reset → "Script reset to default", import → "Script imported", natural run end → "That's a wrap". `store.ts` holds `setCompletedRun`/`takeCompletedRun` flag; player sets it only on natural end (not manual return); editor reads it via `useFocusEffect`.

**Design:** Clean white UI, green (#34c759) accent for play/selected states, large 48px bold script text, speed dial arc at bottom center, scrims fade top/bottom edges.

**Dark mode:** Persisted in `store.ts` (`getDarkMode`/`setDarkMode`). Editor and player both derive theme values at render time: `bg`, `fg`, `icon`, `scrim`, `scrimClear`, `archFill`, `borderColor`. Applied inline throughout JSX — StyleSheet stays static. Scrim gradients use `scrimClear` (matching-RGB transparent) not `rgba(0,0,0,0)` — wrong transparent causes muddy gray midpoints in the gradient.

**Options menu:** `components/OptionsMenu.tsx` — Modal-based glass card, anchored above the options button via `measureInWindow`. Spring open (tension 600, friction 38), timing close (120ms). Scale from bottom-left via compensating translateX/translateY. iOS 18+ uses `systemMaterial`/`systemMaterialDark` tint; older uses manual BlurView with `rgba` bg. Dark mode adapts tint, bg, text, and border colors. Rows: Dark Mode → FullDivider → "Player Options" header → Auto-rotate → Mirror Mode → Keep Screen Awake → Font Size.

**App bar transition:** Fade-dip on edit mode enter/exit. Single `Animated.Value` 0→1 over 500ms. "Orra." + import fades out in first 200ms (inputRange 0→0.4), 100ms gap, "Edit." fades in over last 200ms (inputRange 0.6→1). Two `absoluteFill` `Animated.View` layers with `pointerEvents` toggled.

**Scroll buttons:** Glass pill buttons (24×24, expo-blur BlurView intensity 20, rgba white bg, border overlay, layered shadow). Go-to-top shows at top:96 when scrollY>80; go-to-bottom shows at bottom:165 when >80px from end. Border is a separate absoluteFill overlay view — not on the clip view — so BlurView fills the full button without a 1px gap.

**Icon buttons (options, reset, return):** Use `Pressable` with a 48×48 pill background (borderRadius 40). Normal: `rgba(237,237,237,0.5)` light / `rgba(50,50,50,0.5)` dark. Active/pressed: `rgba(237,237,237,1)` light / `rgba(50,50,50,1)` dark. Options button keeps active state while menu is open. Tap area is 48×48 via the pill size — no hitSlop needed.

**Speed dial detail:** Background is `DialArch` SVG (109×40, #F4F4F4), positioned left:12 in a 134×134 container. Labels arc along the top of the arch, symmetric around container x≈66. Label positions: `.5x`(12,12,-42°), `1x`(36,0,-15°), `2x`(74,0,15°), `5x`(95,12,41°). Labels must stay at top:0–12 or they fall behind the play button.

**Auto-rotate:** `store.getAutoRotate()`/`setAutoRotate()`. Player locks to `LANDSCAPE_RIGHT` (notch on left) if enabled, `PORTRAIT_UP` if disabled. Always restores `PORTRAIT_UP` on unmount. Toast "rotate screen" shown on first countdown tick if enabled and not already landscape. `app.json` orientation is `"default"`.

**Player layout:** Plain `View` (not SafeAreaView) so absolute buttons are relative to full screen. In landscape: return button `right:37, bottom:46`; pause/play `right:21, top:center`; text `paddingLeft: insets.left + 32` to clear notch. Scrim heights `screenHeight * 0.2` (top) and `screenHeight * 0.4` (bottom).

**Tap-to-edit (editor):** `TextInput editable={true}` always. `onFocus` → `setIsEditing(true)`. `KeyboardAvoidingView behavior="padding"` lifts content when keyboard appears. Done button stays at `bottom:16`. `Keyboard.dismiss()` in `onScrollBeginDrag` when not editing prevents accidental keyboard during scroll.

**How to apply:** Understand full app context before suggesting changes. The scroll animation uses `requestAnimationFrame` + `scrollRef.current.scrollTo()` on the JS thread.
