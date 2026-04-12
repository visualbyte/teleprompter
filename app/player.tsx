import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
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
import { LinearGradient } from 'expo-linear-gradient';
import { PauseIcon, PlayIcon, ReturnIcon } from '../components/icons';
import { store } from './store';

type PlayerState = 'countdown' | 'playing' | 'paused' | 'ended';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PAUSE_BTN_SIZE = 80;

// Half the physical screen height used as top/bottom padding so the
// start pill and end pill each land at the vertical center (reading line)
// when scrollY = 0 and scrollY = maxScroll respectively.
const READING_LINE = SCREEN_HEIGHT / 2;

export default function PlayerScreen() {
  const router = useRouter();
  const text = store.getScript();
  const speed = store.getSpeed();

  const [state, setState] = useState<PlayerState>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const screenOpacity = useSharedValue(0);
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
      if (scrollYRef.current >= maxScroll) { setState('ended'); return; }

      const pixelsPerMs = (80 * speed) / 1000;
      let lastTime: number | null = null;

      const animate = (time: number) => {
        if (lastTime !== null) {
          const delta = time - lastTime;
          scrollYRef.current = Math.min(scrollYRef.current + pixelsPerMs * delta, maxScroll);
          scrollRef.current?.scrollTo({ y: scrollYRef.current, animated: false });

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

  // Fade in the player the first time countdown ends
  useEffect(() => {
    if (state === 'playing' && !fadedIn.current) {
      fadedIn.current = true;
      screenOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
    }
  }, [state]);

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
    setState(state === 'playing' ? 'paused' : 'playing');
  };

  const handleReturn = () => {
    stopAnimation();
    cancelAnimation(screenOpacity);
    router.back();
  };

  // After a manual drag while paused, sync scrollYRef so the animation
  // resumes from the user's chosen position, not the pre-drag position.
  const handleManualScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollYRef.current = e.nativeEvent.contentOffset.y;
  };

  // Countdown — full screen, nothing else visible
  if (state === 'countdown') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.countdownScreen}>
          <Animated.Text style={[styles.countdownNumber, countdownStyle]}>
          {countdown}
        </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <Animated.View style={[styles.fadeView, fadeStyle]}>

        {/* Scroll content -------------------------------------------------- */}
        <View style={StyleSheet.absoluteFill}>
          <ScrollView
            ref={scrollRef}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
            onScrollBeginDrag={() => { if (state === 'playing') setState('paused'); }}
            onScrollEndDrag={handleManualScrollEnd}
            onMomentumScrollEnd={handleManualScrollEnd}
          >
            <View style={styles.startPill}>
              <Text style={styles.startPillText}>start reading</Text>
            </View>

            <Text style={styles.scriptText}>{text}</Text>

            <View style={styles.endPill}>
              <Text style={styles.endPillText}>end of the script...</Text>
            </View>
          </ScrollView>

          <LinearGradient
            colors={['#ffffff', 'rgba(255,255,255,0)']}
            style={styles.topScrim}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', '#ffffff']}
            style={styles.bottomScrim}
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
        <TouchableOpacity style={styles.returnBtn} onPress={handleReturn}>
          <ReturnIcon size={32} color="#000" />
        </TouchableOpacity>

        {/* Pause / Play — always tappable for both pause and resume */}
        <TouchableOpacity style={styles.pauseBtn} onPress={handleTap}>
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
    </SafeAreaView>
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
    paddingHorizontal: 32,
    // READING_LINE (= SCREEN_HEIGHT / 2) as top/bottom padding places the
    // start pill at the screen centre when scrollY=0 and the end pill at
    // the screen centre when scrollY=maxScroll.
    paddingTop: READING_LINE,
    paddingBottom: READING_LINE,
  },

  startPill: {
    alignSelf: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 180,
  },
  startPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34c759',
  },

  scriptText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    lineHeight: 56,
  },

  endPill: {
    alignSelf: 'center',
    backgroundColor: '#f6f6f6',
    borderRadius: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 180,
  },
  endPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c56464',
  },

  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 154,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 410,
  },

  returnBtn: {
    position: 'absolute',
    bottom: 45,
    left: 54,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  pauseBtn: {
    position: 'absolute',
    bottom: 21,
    left: (SCREEN_WIDTH - PAUSE_BTN_SIZE) / 2,
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
});
