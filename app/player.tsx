import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedRef,
  useSharedValue,
  useAnimatedStyle,
  scrollTo,
  useAnimatedReaction,
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
// Using a static Dimensions value avoids a circular layout dependency
// (scrollViewHeight → halfH → contentHeight → scrollViewHeight …).
const READING_LINE = SCREEN_HEIGHT / 2;

export default function PlayerScreen() {
  const router = useRouter();
  const text = store.getScript();
  const speed = store.getSpeed();

  const [state, setState] = useState<PlayerState>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  const scrollY = useSharedValue(0);
  const animScrollRef = useAnimatedRef<Animated.ScrollView>();

  const screenOpacity = useSharedValue(1);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  // Mirror scrollY → ScrollView on the UI thread at 60 fps.
  // onScrollEndDrag / onMomentumScrollEnd sync scrollY after a manual drag
  // (single event at end of gesture) so there is no feedback loop.
  useAnimatedReaction(
    () => scrollY.value,
    (y) => { scrollTo(animScrollRef, 0, y, false); }
  );

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

  // Drive scroll animation. Reads scrollY.value so resuming after a manual
  // drag picks up from wherever the user left off.
  useEffect(() => {
    if (state === 'playing' && contentHeight > 0 && scrollViewHeight > 0) {
      const maxScroll = Math.max(0, contentHeight - scrollViewHeight);
      const remaining = maxScroll - scrollY.value;
      if (remaining <= 0) { setState('ended'); return; }

      const durationMs = (remaining / (80 * speed)) * 1000;
      scrollY.value = withTiming(maxScroll, {
        duration: durationMs,
        easing: Easing.linear,
      }, (finished) => {
        if (finished) runOnJS(setState)('ended');
      });
    } else {
      cancelAnimation(scrollY);
    }
  }, [state, contentHeight, scrollViewHeight, speed]);

  // Ended: brief pause → fade to white → go back
  useEffect(() => {
    if (state !== 'ended') return;
    screenOpacity.value = withDelay(
      600,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) }, (finished) => {
        if (finished) runOnJS(router.back)();
      })
    );
  }, [state]);

  const handleTap = () => {
    if (state === 'countdown' || state === 'ended') return;
    setState(state === 'playing' ? 'paused' : 'playing');
  };

  const handleReturn = () => {
    cancelAnimation(scrollY);
    cancelAnimation(screenOpacity);
    router.back();
  };

  // After a manual drag while paused, sync scrollY so the animation resumes
  // from the user's chosen position, not the pre-drag position.
  const handleManualScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = e.nativeEvent.contentOffset.y;
  };

  // Countdown — full screen, nothing else visible
  if (state === 'countdown') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.countdownScreen}>
          <Text style={styles.countdownNumber}>{countdown}</Text>
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
          <Animated.ScrollView
            ref={animScrollRef}
            scrollEnabled={state === 'paused'}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setScrollViewHeight(e.nativeEvent.layout.height)}
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
          </Animated.ScrollView>

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
    // the screen centre when scrollY=maxScroll. Static value — no re-render loop.
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
