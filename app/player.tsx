import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PauseIcon, PlayIcon, ReturnIcon } from '../components/icons';
import { Toast, useToast } from '../components/Toast';
import * as Haptics from 'expo-haptics';
import { store } from './store';

type PlayerState = 'countdown' | 'playing' | 'paused' | 'ended';

const PAUSE_BTN_SIZE = 80;
// Static dimensions based on portrait — used for scroll padding and initial button layout.

export default function PlayerScreen() {
  const router = useRouter();
  const text = store.getScript();
  const speed = store.getSpeed();
  const darkMode = store.getDarkMode();
  const autoRotate = store.getAutoRotate();

  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;
  const insets = useSafeAreaInsets();

  const bg        = darkMode ? '#000' : '#fff';
  const fg        = darkMode ? '#fff' : '#000';
  const scrim     = darkMode ? '#000000' : '#ffffff';
  const scrimClear = darkMode ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)';
  const pillBg    = darkMode ? 'rgba(50,50,50,0.5)' : 'rgba(237,237,237,0.5)';
  const activeBg  = darkMode ? 'rgba(50,50,50,1)' : 'rgba(237,237,237,1)';

  const [state, setState] = useState<PlayerState>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const maxScrollRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const { toast, show } = useToast();

  const screenOpacity = useSharedValue(0);

  // Lock to landscape-left on mount if autoRotate (notch stays on left, right side clear).
  // Lock orientation on mount; always restore portrait on unmount.
  useEffect(() => {
    ScreenOrientation.lockAsync(
      autoRotate
        ? ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
        : ScreenOrientation.OrientationLock.PORTRAIT_UP
    );
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // Progress bar (1 = full / 100% remaining, 0 = empty)
  const progressValue = useSharedValue(1);
  const progressStyle = useAnimatedStyle(() => ({
    width: progressValue.value * screenWidth,
  }));

  // Play button auto-hide
  const btnOpacity = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ opacity: btnOpacity.value }));
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const showButton = useCallback(() => {
    clearHideTimer();
    btnOpacity.value = withTiming(1, { duration: 200 });
  }, [clearHideTimer]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      btnOpacity.value = withTiming(0, { duration: 400 });
    }, 2500);
  }, [clearHideTimer]);

  const fadedIn = useRef(false);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  const countdownScale = useSharedValue(1);
  const countdownOpacity = useSharedValue(1);
  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
    opacity: countdownOpacity.value,
  }));

  // Each time the countdown number changes, reset and animate out
  useEffect(() => {
    if (state !== 'countdown' || countdown === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Show rotate prompt once on the first countdown tick
    if (countdown === 3 && autoRotate && !isLandscape) {
      show('rotate screen');
    }
    countdownScale.value = 1;
    countdownOpacity.value = 1;
    countdownScale.value = withTiming(1.6, { duration: 850, easing: Easing.out(Easing.ease) });
    countdownOpacity.value = withTiming(0, { duration: 850, easing: Easing.out(Easing.ease) });
  }, [countdown]);

  const stopAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Countdown 3 → 2 → 1 → playing
  useEffect(() => {
    if (state !== 'countdown') return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timer); setState('playing'); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  // Drive scroll via requestAnimationFrame. Picks up from scrollYRef.current
  // so resuming after a manual drag starts from wherever the user left off.
  useEffect(() => {
    stopAnimation();

    if (state === 'playing' && contentHeight > 0 && scrollViewHeight > 0) {
      const maxScroll = Math.max(0, contentHeight - scrollViewHeight);
      maxScrollRef.current = maxScroll;
      if (scrollYRef.current >= maxScroll) { setState('ended'); return; }

      const pixelsPerMs = (80 * speed) / 1000;
      let lastTime: number | null = null;

      const animate = (time: number) => {
        if (lastTime !== null) {
          const delta = time - lastTime;
          scrollYRef.current = Math.min(scrollYRef.current + pixelsPerMs * delta, maxScroll);
          scrollRef.current?.scrollTo({ y: scrollYRef.current, animated: false });
          progressValue.value = 1 - scrollYRef.current / maxScroll;

          if (scrollYRef.current >= maxScroll) {
            setState('ended');
            return;
          }
        }
        lastTime = time;
        rafRef.current = requestAnimationFrame(animate);
      };

      rafRef.current = requestAnimationFrame(animate);
    }

    return stopAnimation;
  }, [state, contentHeight, scrollViewHeight, speed, stopAnimation]);

  // Fade in the player the first time countdown ends, show start toast
  useEffect(() => {
    if (state === 'playing' && !fadedIn.current) {
      fadedIn.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      screenOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
      show('start reading');
    }
  }, [state]);

  // Show end toast when script finishes
  useEffect(() => {
    if (state === 'ended') show('fin.');
  }, [state]);

  // Auto-hide play button while playing; show when paused or ended
  useEffect(() => {
    if (state === 'playing') {
      showButton();
      scheduleHide();
    } else if (state === 'paused') {
      showButton();
    } else {
      clearHideTimer();
    }
    return clearHideTimer;
  }, [state, showButton, scheduleHide, clearHideTimer]);

  // Ended: brief pause → fade to white → go back
  useEffect(() => {
    if (state !== 'ended') return;
    screenOpacity.value = withDelay(
      600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) {
          runOnJS(store.setCompletedRun)();
          runOnJS(router.back)();
        }
      })
    );
  }, [state]);

  const handleTap = () => {
    if (state === 'countdown' || state === 'ended') return;
    showButton();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState(state === 'playing' ? 'paused' : 'playing');
  };

  const handleReturn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    stopAnimation();
    cancelAnimation(screenOpacity);
    router.back();
  };

  // After a manual drag while paused, sync scrollYRef so the animation
  // resumes from the user's chosen position, not the pre-drag position.
  const handleManualScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
    if (maxScrollRef.current > 0) {
      progressValue.value = 1 - scrollYRef.current / maxScrollRef.current;
    }
  };

  // Countdown — full screen, nothing else visible
  if (state === 'countdown') {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />
        <Toast message={toast.message} id={toast.id} />
        <View style={styles.countdownScreen}>
          <Animated.Text style={[styles.countdownNumber, { color: fg }, countdownStyle]}>
          {countdown}
        </Animated.Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Toast message={toast.message} id={toast.id} />

      <Animated.View style={[styles.fadeView, fadeStyle]}>

        {/* Scroll content -------------------------------------------------- */}
        <View style={StyleSheet.absoluteFill}>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingTop: screenHeight / 2 + 96,
                paddingBottom: screenHeight / 2 + 180,
                paddingLeft: isLandscape ? insets.left + 32 : 32,
                paddingRight: isLandscape ? insets.right + PAUSE_BTN_SIZE + 21 + 16 : 32,
              },
            ]}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
            onScrollBeginDrag={() => { if (state === 'playing') setState('paused'); }}
            onScrollEndDrag={handleManualScrollEnd}
            onMomentumScrollEnd={handleManualScrollEnd}
          >
            <Text style={[styles.scriptText, { color: fg }]}>{text}</Text>
          </ScrollView>

          <LinearGradient
            colors={[scrim, scrimClear]}
            style={[styles.topScrim, { height: screenHeight * 0.2 }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={[scrimClear, scrim]}
            style={[styles.bottomScrim, { height: screenHeight * 0.4 }]}
            pointerEvents="none"
          />
        </View>

        {/* Tap-to-pause overlay — only while playing so manual scroll works while paused */}
        {state === 'playing' && (
          <TouchableWithoutFeedback onPress={handleTap}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
        )}

        {/* Return button */}
        <Pressable
          style={[
            styles.returnBtn,
            isLandscape
              ? { right: 37, bottom: 46 }
              : { left: 46, bottom: 37 },
          ]}
          onPress={handleReturn}
        >
          {({ pressed }) => (
            <View style={[styles.returnBtnPill, { backgroundColor: pressed ? activeBg : pillBg }]}>
              <ReturnIcon size={32} color={fg} />
            </View>
          )}
        </Pressable>

        {/* Progress bar — depletes left→right as script is read */}
        <Animated.View style={[styles.progressBar, progressStyle]} pointerEvents="none" />

        {/* Pause / Play — always tappable for both pause and resume */}
        <Animated.View
          style={[
            styles.pauseBtn,
            btnStyle,
            isLandscape
              ? { right: 21, top: (screenHeight - PAUSE_BTN_SIZE) / 2 }
              : { left: (screenWidth - PAUSE_BTN_SIZE) / 2, bottom: 21 },
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleTap}>
            <View style={[
              styles.pauseBtnCircle,
              state === 'paused' ? styles.pauseCircleGreen : styles.pauseCircleRed,
            ]}>
              {state === 'paused'
                ? <PlayIcon size={32} color="#fff" />
                : <PauseIcon size={32} color="#fff" />}
            </View>
          </TouchableOpacity>
        </Animated.View>

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  fadeView: {
    flex: 1,
  },

  countdownScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 200,
    fontWeight: '700',
    color: '#333',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // All padding set inline — adapts to orientation and safe area insets.
  },

  scriptText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    lineHeight: 56,
  },

  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  returnBtn: {
    position: 'absolute',
  },
  returnBtnPill: {
    width: 48,
    height: 48,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  pauseBtn: {
    position: 'absolute',
    width: PAUSE_BTN_SIZE,
    height: PAUSE_BTN_SIZE,
  },
  pauseBtnCircle: {
    flex: 1,
    borderRadius: PAUSE_BTN_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseCircleRed: { backgroundColor: '#ff3b30' },
  pauseCircleGreen: { backgroundColor: '#34c759' },

  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    backgroundColor: '#34c759',
  },
});
