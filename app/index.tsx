import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  KeyboardEvent,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import { FileTrayIcon, OptionsIcon, PlayIcon, ResetIcon } from '../components/icons';
import { store } from './store';

type ScrollSpeed = 0.5 | 1 | 2 | 5;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Speed dial arc positions from Figma (within 134x134 container)
const SPEED_OPTIONS: { value: ScrollSpeed; label: string; left: number; top: number; rotate: string }[] = [
  { value: 0.5, label: '.5x', left: 12, top: 12, rotate: '-42deg' },
  { value: 1,   label: '1x',  left: 36, top: 0,  rotate: '-15deg' },
  { value: 2,   label: '2x',  left: 67, top: 1,  rotate: '15deg'  },
  { value: 5,   label: '5x',  left: 92, top: 11, rotate: '41deg'  },
];

function SpeedDial({
  speed,
  onSpeedChange,
}: {
  speed: ScrollSpeed;
  onSpeedChange: (s: ScrollSpeed) => void;
}) {
  return (
    <View style={styles.dialContainer}>
      {/* knob background — simple circle, matches Figma silver dial */}
      <View style={styles.dialBg} />
      {SPEED_OPTIONS.map((opt) => {
        const selected = speed === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onSpeedChange(opt.value)}
            style={[
              styles.dialLabel,
              { left: opt.left, top: opt.top, transform: [{ rotate: opt.rotate }] },
            ]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.dialPill, selected && styles.dialPillSelected]}>
              <Text style={[styles.dialPillText, selected && styles.dialPillTextSelected]}>
                {opt.label}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function EditorScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [speed, setSpeed] = useState<ScrollSpeed>(1);
  const [scriptText, setScriptText] = useState(store.DEFAULT_SCRIPT);
  const [isEditing, setIsEditing] = useState(false);

  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
        onPress: () => setScriptText(store.DEFAULT_SCRIPT),
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
    if (text.trim()) setScriptText(text.trim());
  };

  const handleDone = () => {
    setIsEditing(false);
  };

  const handleScrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>{isEditing ? 'Edit.' : 'Orra.'}</Text>
        {!isEditing && (
          <TouchableOpacity style={styles.appBarIcon} onPress={handleImport}>
            <FileTrayIcon size={32} color="#333" />
          </TouchableOpacity>
        )}
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
            isEditing && { paddingBottom: 80 },
          ]}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          {isEditing ? (
            <TextInput
              value={scriptText}
              onChangeText={setScriptText}
              multiline
              autoFocus
              style={styles.scriptInput}
              textAlignVertical="top"
            />
          ) : (
            <TouchableWithoutFeedback onPress={() => setIsEditing(true)}>
              <Text style={styles.scriptText}>{scriptText}</Text>
            </TouchableWithoutFeedback>
          )}
        </ScrollView>

        {/* Top scrim — fades from white into script */}
        <LinearGradient
          colors={['#ffffff', 'rgba(255,255,255,0)']}
          style={styles.topScrim}
          pointerEvents="none"
        />

        {/* Bottom scrim — fades up from white over controls */}
        <LinearGradient
          colors={['rgba(255,255,255,0)', '#ffffff']}
          style={styles.bottomScrim}
          pointerEvents="none"
        />

        {/* Go-bottom button — above scrim */}
        {!isEditing && (
          <TouchableOpacity style={styles.goBottomBtn} onPress={handleScrollToBottom}>
            <Text style={styles.goBottomText}>↓</Text>
          </TouchableOpacity>
        )}

        {/* Done button — sits just above the keyboard */}
        {isEditing && (
          <TouchableOpacity
            style={[styles.doneBtn, { bottom: keyboardHeight + 16 }]}
            onPress={handleDone}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        )}

        {/* Controls overlay */}
        {!isEditing && (
          <View style={styles.controls} pointerEvents="box-none">
            {/* Speed dial */}
            <View style={styles.dialWrapper}>
              <SpeedDial speed={speed} onSpeedChange={setSpeed} />
            </View>

            {/* Options */}
            <TouchableOpacity style={styles.optionsBtn}>
              <OptionsIcon size={32} color="#333" />
            </TouchableOpacity>

            {/* Play button */}
            <TouchableOpacity style={styles.playBtn} onPress={handlePlay}>
              <View style={styles.playBtnCircle}>
                <PlayIcon size={32} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* Reset */}
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <ResetIcon size={32} color="#333" />
            </TouchableOpacity>

            {/* Read time */}
            <Text style={styles.readTime}>{readTimeLabel}</Text>
          </View>
        )}
      </View>
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
    height: 80,
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
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  bottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    pointerEvents: 'none',
  },

  // Go-bottom button
  goBottomBtn: {
    position: 'absolute',
    bottom: 165,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  goBottomText: {
    fontSize: 16,
    color: '#383838',
    fontWeight: '600',
  },

  // Done button (edit mode) — bottom is set dynamically based on keyboard height
  doneBtn: {
    position: 'absolute',
    right: 32,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: '#dadada',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
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
    left: 12,
    right: 12,
    top: 0,
    height: 68,
    borderRadius: 60,
    backgroundColor: '#e0e0e0',
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
    bottom: 45,
    left: 54,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
    bottom: 45,
    right: 54,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
