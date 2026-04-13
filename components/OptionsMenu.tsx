import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';

// iOS 26+ uses Liquid Glass — systemMaterial maps to the native menu material.
// On older iOS and Android we fall back to our manual glass style.
const IOS_VERSION = Platform.OS === 'ios' ? parseInt(Platform.Version as string, 10) : 0;
const USE_SYSTEM_MATERIAL = Platform.OS === 'ios' && IOS_VERSION >= 18;

interface Props {
  visible: boolean;
  onClose: () => void;
  anchorY: number;
  darkMode: boolean;
  onDarkModeChange: (v: boolean) => void;
}

function FullDivider() {
  return <View style={styles.fullDivider} />;
}

function InsetDivider() {
  return <View style={styles.insetDivider} />;
}

function SectionHeader({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function OptionRow({ label, right, color }: { label: string; right: React.ReactNode; color: string }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color }]} numberOfLines={1}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );
}

function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: '#E5E5EA', true: '#34c759' }}
      ios_backgroundColor="#E5E5EA"
    />
  );
}

const CARD_WIDTH = 290;
const SCALE_START = 0.88;
const SCALE_DELTA = 1 - SCALE_START;
const CARD_HEIGHT = 189;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OptionsMenu({ visible, onClose, anchorY, darkMode, onDarkModeChange }: Props) {
  const anim = useRef(new Animated.Value(0)).current;
  const [isRendered, setIsRendered] = useState(false);

  const fg          = darkMode ? '#fff' : '#000';
  const blurTint    = USE_SYSTEM_MATERIAL ? (darkMode ? 'systemMaterialDark' : 'systemMaterial') : (darkMode ? 'dark' : 'light');
  const blurBg      = USE_SYSTEM_MATERIAL ? 'transparent' : (darkMode ? 'rgba(30,30,32,0.82)' : 'rgba(255,255,255,0.20)');
  const borderColor = darkMode ? 'rgba(255,255,255,0.12)' : '#DADADA';
  const labelColor  = darkMode ? '#98989D' : '#8E8E93';

  const [autoRotate, setAutoRotate] = useState(false);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [keepAwake, setKeepAwake] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.spring(anim, {
        toValue: 1,
        tension: 600,
        friction: 38,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => setIsRendered(false));
    }
  }, [visible]);

  const cardStyle = {
    opacity: anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 1] }),
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-(CARD_WIDTH / 2) * SCALE_DELTA, 0],
        }),
      },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [(CARD_HEIGHT / 2) * SCALE_DELTA, 0],
        }),
      },
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [SCALE_START, 1],
        }),
      },
    ],
  };

  // Card bottom sits 12pt above the tapped button's top edge.
  // anchorY is from screen top; bottom is from screen bottom.
  const cardBottom = SCREEN_HEIGHT - anchorY + 12;

  return (
    <Modal visible={isRendered} transparent animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>

        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: anim }]}
          pointerEvents="none"
        />

        <Animated.View style={[styles.card, { bottom: cardBottom }, cardStyle]}>
          <View style={styles.cardShadow}>
            <View style={styles.cardClip}>
              <BlurView
                intensity={USE_SYSTEM_MATERIAL ? 100 : 20}
                tint={blurTint}
                style={[styles.blur, { backgroundColor: blurBg }]}
              >

                <OptionRow
                  label="Dark Mode"
                  color={fg}
                  right={<ToggleSwitch value={darkMode} onChange={onDarkModeChange} />}
                />
                <FullDivider />
                <SectionHeader label="Player Options" color={labelColor} />
                <OptionRow
                  label="Auto-rotate"
                  color={fg}
                  right={<ToggleSwitch value={autoRotate} onChange={setAutoRotate} />}
                />
                <InsetDivider />
                <OptionRow
                  label="Mirror Mode"
                  color={fg}
                  right={<ToggleSwitch value={mirrorMode} onChange={setMirrorMode} />}
                />
                <InsetDivider />
                <OptionRow
                  label="Keep Screen Awake"
                  color={fg}
                  right={<ToggleSwitch value={keepAwake} onChange={setKeepAwake} />}
                />
                <InsetDivider />
                <OptionRow
                  label="Font Size"
                  color={fg}
                  right={<Text style={styles.chevron}>›</Text>}
                />

              </BlurView>
            </View>
            {/* Border overlay — keeps BlurView gap-free */}
            <View style={[styles.cardBorder, { borderColor }]} pointerEvents="none" />
          </View>
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  card: {
    position: 'absolute',
    left: 24,
    width: CARD_WIDTH,
  },
  cardShadow: {
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.01)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 11,
    elevation: 5,
  },
  cardClip: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
  },
  blur: {
    // backgroundColor applied inline so it can respond to darkMode
  },
  fullDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.14)',
  },
  insetDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.10)',
    marginLeft: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 10,
    minHeight: 44,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    lineHeight: 20,
  },
  rowRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    color: '#C7C7CC',
    paddingRight: 2,
  },
});
