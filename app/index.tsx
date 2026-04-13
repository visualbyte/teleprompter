import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Toast, useToast } from '../components/Toast';
import { OptionsMenu } from '../components/OptionsMenu';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { ArrowDownIcon, ArrowUpIcon, DialArch, FileTrayIcon, OptionsIcon, PlayIcon, ResetIcon } from '../components/icons';
import { store } from './store';

type ScrollSpeed = 0.5 | 1 | 2 | 5;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Speed dial arc positions from Figma (within 134x134 container)
const SPEED_OPTIONS: { value: ScrollSpeed; label: string; left: number; top: number; rotate: string }[] = [
  { value: 0.5, label: '.5x', left: 12, top: 12, rotate: '-42deg' },
  { value: 1,   label: '1x',  left: 36, top: 0,  rotate: '-15deg' },
  { value: 2,   label: '2x',  left: 74, top: 0,  rotate: '15deg'  },
  { value: 5,   label: '5x',  left: 95, top: 12, rotate: '41deg'  },
];

function SpeedDial({
  speed,
  onSpeedChange,
  fg,
  archFill,
}: {
  speed: ScrollSpeed;
  onSpeedChange: (s: ScrollSpeed) => void;
  fg: string;
  archFill: string;
}) {
  return (
    <View style={styles.dialContainer}>
      {/* arch background */}
      <View style={styles.dialBg}>
        <DialArch fill={archFill} />
      </View>
      {SPEED_OPTIONS.map((opt) => {
        const selected = speed === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => { Haptics.selectionAsync(); onSpeedChange(opt.value); }}
            style={[
              styles.dialLabel,
              { left: opt.left, top: opt.top, transform: [{ rotate: opt.rotate }] },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.dialPill, selected && styles.dialPillSelected]}>
              <Text style={[styles.dialPillText, { color: fg }, selected && styles.dialPillTextSelected]}>
                {opt.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ScrollButton({ onPress, children, style, borderColor }: { onPress: () => void; children: React.ReactNode; style: object; borderColor: string }) {
  return (
    <View style={[styles.scrollBtnShadow, style]}>
      {/* Clip fills the full 48×48 — no border here so BlurView has no gap */}
      <TouchableOpacity onPress={onPress} style={styles.scrollBtnClip} activeOpacity={0.8}>
        <BlurView intensity={20} tint="light" style={styles.scrollBtnBlur}>
          {children}
        </BlurView>
      </TouchableOpacity>
      {/* Border rendered on top as a separate overlay so it doesn't shrink the BlurView */}
      <View style={[styles.scrollBtnBorder, { borderColor }]} pointerEvents="none" />
    </View>
  );
}

export default function EditorScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [speed, setSpeed] = useState<ScrollSpeed>(1);
  const [scriptText, setScriptText] = useState(store.DEFAULT_SCRIPT);
  const [isEditing, setIsEditing] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [optionsAnchorY, setOptionsAnchorY] = useState(0);
  const optionsBtnRef = useRef<View>(null);
  const [darkMode, setDarkMode] = useState(store.getDarkMode());
  const [autoRotate, setAutoRotate] = useState(store.getAutoRotate());

  const handleDarkModeChange = (v: boolean) => {
    store.setDarkMode(v);
    setDarkMode(v);
  };

  const handleAutoRotateChange = (v: boolean) => {
    store.setAutoRotate(v);
    setAutoRotate(v);
  };

  // Theme values derived from darkMode
  const bg           = darkMode ? '#000' : '#fff';
  const fg           = darkMode ? '#fff' : '#000';
  const icon         = darkMode ? '#fff' : '#333';
  const scrim        = darkMode ? '#000000' : '#ffffff';
  const scrimClear   = darkMode ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)';
  const archFill     = darkMode ? '#2C2C2E' : '#F4F4F4';
  const borderColor  = darkMode ? 'rgba(255,255,255,0.14)' : '#DADADA';
  const pillBg       = darkMode ? 'rgba(50,50,50,0.5)' : 'rgba(237,237,237,0.5)';
  const activeBg     = darkMode ? 'rgba(50,50,50,1)' : 'rgba(237,237,237,1)';

  const { toast, show } = useToast();
  const appBarAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const [scrollY, setScrollY] = useState(0);
  const [scrollContentH, setScrollContentH] = useState(0);
  const [scrollViewH, setScrollViewH] = useState(0);

  const showGoToTop = !isEditing && scrollY > 80;
  const showGoToBottom = !isEditing && scrollContentH - scrollViewH - scrollY > 80;

  const handleScrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });
  const handleScrollToBottom = () => scrollRef.current?.scrollToEnd({ animated: true });
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Crossfade app bar between view and edit mode
  useEffect(() => {
    Animated.timing(appBarAnim, {
      toValue: isEditing ? 1 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isEditing]);

  // Show "That's a wrap" when returning from a completed run
  useFocusEffect(
    useCallback(() => {
      if (store.takeCompletedRun()) show("That's a wrap");
    }, [])
  );

  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', (e: KeyboardEvent) => {
      setKeyboardHeight(e.endCoordinates.height - insets.bottom);
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, [insets.bottom]);

  // When keyboard appears in edit mode, scroll to end so cursor is visible
  useEffect(() => {
    if (isEditing && keyboardHeight > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [keyboardHeight, isEditing]);

  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const readTimeSec = Math.ceil((wordCount / 140) * 60);
  const readTimeLabel =
    readTimeSec < 60
      ? `~${readTimeSec} seconds read time`
      : `~${Math.ceil(readTimeSec / 60)} min read time`;

  const handlePlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    store.setScript(scriptText);
    store.setSpeed(speed);
    router.push('/player');
  };

  const handleReset = () => {
    Alert.alert('Reset Script', 'Reset to the default script?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setScriptText(store.DEFAULT_SCRIPT);
          show('Script reset to default');
        },
      },
    ]);
  };

  const handleImport = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'text/plain',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const text = await fetch(uri).then((r) => r.text());
    if (text.trim()) { setScriptText(text.trim()); show('Script imported'); }
  };

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsEditing(false);
  };

  const titleColor = darkMode ? '#8E8E93' : '#8E8E93';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} backgroundColor={bg} />
      <Toast message={toast.message} id={toast.id} />

      {/* App Bar — absolute, extends behind status bar like iOS nav bars */}
      <View style={[styles.appBar, { height: 80 + insets.top, zIndex: 10 }]} pointerEvents="box-none">
        <BlurView
          intensity={60}
          tint={darkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {/* Hairline bottom border */}
        <View style={[styles.appBarBorder, { backgroundColor: borderColor }]} pointerEvents="none" />

        {/* View mode: "Orra." + import — fades out on edit */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.appBarRow, { paddingTop: insets.top, opacity: appBarAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [1, 0, 0] }) }]}
          pointerEvents={isEditing ? 'none' : 'auto'}
        >
          <Text style={[styles.appBarTitle, { color: titleColor }]}>Orra.</Text>
          <TouchableOpacity style={styles.appBarIcon} onPress={handleImport}>
            <FileTrayIcon size={32} color={icon} />
          </TouchableOpacity>
        </Animated.View>

        {/* Edit mode: "Edit." — fades in on edit */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.appBarRow, { paddingTop: insets.top, opacity: appBarAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] }) }]}
          pointerEvents={isEditing ? 'auto' : 'none'}
        >
          <Text style={[styles.appBarTitle, { color: titleColor }]}>Edit.</Text>
        </Animated.View>
      </View>

      {/* Script content */}
      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={[
            styles.scrollView,
            isEditing && keyboardHeight > 0 && { marginBottom: keyboardHeight },
          ]}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 96 },
            isEditing && { paddingBottom: 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
            setScrollY(e.nativeEvent.contentOffset.y)
          }
          onContentSizeChange={(_, h) => setScrollContentH(h)}
          onLayout={(e) => setScrollViewH(e.nativeEvent.layout.height)}
        >
          {isEditing ? (
            <TextInput
              value={scriptText}
              onChangeText={setScriptText}
              multiline
              autoFocus
              style={[styles.scriptInput, { color: fg }]}
              textAlignVertical="top"
              keyboardAppearance={darkMode ? 'dark' : 'light'}
            />
          ) : (
            <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
              <Text style={[styles.scriptText, { color: fg }]}>{scriptText}</Text>
            </TouchableWithoutFeedback>
          )}
        </ScrollView>

        {/* Bottom scrim — fades up from bg over controls */}
        <LinearGradient
          colors={[scrimClear, scrim]}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        {/* Go-to-top button */}
        {showGoToTop && (
          <ScrollButton onPress={handleScrollToTop} style={styles.goTopBtn} borderColor={borderColor}>
            <ArrowUpIcon color={icon} />
          </ScrollButton>
        )}

        {/* Go-to-bottom button */}
        {showGoToBottom && (
          <ScrollButton onPress={handleScrollToBottom} style={styles.goBottomBtn} borderColor={borderColor}>
            <ArrowDownIcon color={icon} />
          </ScrollButton>
        )}

        {/* Done button — sits just above the keyboard */}
        {isEditing && (
          <View style={[styles.doneBtnShadow, { bottom: keyboardHeight + 16 }]}>
            <TouchableOpacity style={styles.doneBtnClip} onPress={handleDone} activeOpacity={0.8}>
              <BlurView intensity={20} tint="light" style={styles.doneBtnBlur}>
                <Text style={[styles.doneBtnText, { color: fg }]}>Done</Text>
              </BlurView>
            </TouchableOpacity>
            {/* Border rendered on top as overlay — doesn't shrink BlurView content */}
            <View style={[styles.doneBtnBorder, { borderColor }]} pointerEvents="none" />
          </View>
        )}

        {/* Controls overlay */}
        {!isEditing && (
          <View style={styles.controls} pointerEvents="box-none">
            {/* Speed dial */}
            <View style={styles.dialWrapper}>
              <SpeedDial speed={speed} onSpeedChange={setSpeed} fg={fg} archFill={archFill} />
            </View>

            {/* Options */}
            <Pressable
              ref={optionsBtnRef}
              style={styles.optionsBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                optionsBtnRef.current?.measureInWindow((_x, y) => {
                  setOptionsAnchorY(y);
                  setOptionsOpen(true);
                });
              }}
            >
              {({ pressed }) => (
                <View style={[styles.iconPill, { backgroundColor: (pressed || optionsOpen) ? activeBg : pillBg }]}>
                  <OptionsIcon size={32} color={icon} />
                </View>
              )}
            </Pressable>

            {/* Play button */}
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
              <View style={styles.playBtnCircle}>
                <PlayIcon size={32} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Reset */}
            <Pressable style={styles.resetBtn} onPress={handleReset}>
              {({ pressed }) => (
                <View style={[styles.iconPill, { backgroundColor: pressed ? activeBg : pillBg }]}>
                  <ResetIcon size={32} color={icon} />
                </View>
              )}
            </Pressable>

            {/* Read time */}
            <Text style={styles.readTime}>{readTimeLabel}</Text>
          </View>
        )}
      </View>
      <OptionsMenu
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        anchorY={optionsAnchorY}
        darkMode={darkMode}
        onDarkModeChange={handleDarkModeChange}
        autoRotate={autoRotate}
        onAutoRotateChange={handleAutoRotateChange}
      />
    </SafeAreaView>
  );
}

const DIAL_SIZE = 134;
const PLAY_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // App bar
  appBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    overflow: 'hidden',
  },
  appBarBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  appBarTitle: {
    fontSize: 34,
    fontWeight: '500',
    color: '#b7b7b7',
  },
  appBarIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Script area
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 240,
  },
  scriptText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    lineHeight: 56,
  },
  scriptInput: {
    fontSize: 48,
    fontWeight: '600',
    color: '#000',
    lineHeight: 56,
    padding: 0,
    minHeight: 200,
  },

  // Scrims
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    pointerEvents: 'none',
  },

  // Scroll buttons (go-to-top / go-to-bottom)
  scrollBtnShadow: {
    position: 'absolute',
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    // tiny bg required for iOS shadow to render
    backgroundColor: 'rgba(255,255,255,0.001)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 11,
    elevation: 5,
  },
  scrollBtnClip: {
    // fills full 24×24 so BlurView has no gap — border is a separate overlay
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: 'hidden',
  },
  scrollBtnBlur: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  scrollBtnBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
  },
  goTopBtn: {
    top: 16,
  },
  goBottomBtn: {
    bottom: 165,
  },

  // Done button (edit mode) — bottom is set dynamically based on keyboard height
  doneBtnShadow: {
    position: 'absolute',
    right: 32,
    backgroundColor: 'rgba(255,255,255,0.001)',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 11,
    elevation: 5,
  },
  doneBtnClip: {
    // no border — border is a separate overlay so BlurView fills fully
    borderRadius: 24,
    overflow: 'hidden',
  },
  doneBtnBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
  },
  doneBtnBlur: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  doneBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#383838',
  },

  // Controls overlay
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 175,
  },

  // Speed dial
  dialWrapper: {
    position: 'absolute',
    bottom: 1,
    left: (SCREEN_WIDTH - DIAL_SIZE) / 2,
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
  },
  dialBg: {
    position: 'absolute',
    left: 12,  // (134 - 109) / 2 = 12.5 → centres the 109px arch in the 134px container
    top: 0,
  },
  dialLabel: {
    position: 'absolute',
  },
  dialPill: {
    minWidth: 24,
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  dialPillSelected: {
    backgroundColor: '#34c759',
  },
  dialPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  dialPillTextSelected: {
    color: '#fff',
  },

  // Options button (left)
  optionsBtn: {
    position: 'absolute',
    bottom: 37,
    left: 46,
  },

  // Play button (center)
  playBtn: {
    position: 'absolute',
    bottom: 21,
    left: (SCREEN_WIDTH - PLAY_SIZE) / 2,
  },
  playBtnCircle: {
    width: PLAY_SIZE,
    height: PLAY_SIZE,
    borderRadius: PLAY_SIZE / 2,
    backgroundColor: '#34c759',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Reset button (right)
  resetBtn: {
    position: 'absolute',
    bottom: 37,
    right: 46,
  },

  // Shared pill background for icon buttons (options, reset)
  iconPill: {
    width: 48,
    height: 48,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Read time
  readTime: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#979797',
  },

});
