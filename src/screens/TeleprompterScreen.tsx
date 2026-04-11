import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Button, Slider } from 'react-native-paper';
import * as ScreenOrientation from 'expo-screen-orientation';

interface TeleprompterScreenProps {
  script: string;
  fontSize: number;
  speed: number;
  onFontSizeChange: (size: number) => void;
  onSpeedChange: (speed: number) => void;
  onExit: () => void;
}

export function TeleprompterScreen({
  script,
  fontSize,
  speed,
  onFontSizeChange,
  onSpeedChange,
  onExit,
}: TeleprompterScreenProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const scrollAnimationRef = useRef(new Animated.Value(0)).current;
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Lock orientation to landscape on mount
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_LEFT);
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
  }, []);

  // Scroll animation
  useEffect(() => {
    if (!isPlaying) {
      Animated.timing(scrollAnimationRef).stop();
      return;
    }

    const screenHeight = Dimensions.get('window').height;
    const contentHeight = script.split('\n').length * fontSize * 1.8;
    const totalDistance = contentHeight + screenHeight;

    Animated.timing(scrollAnimationRef, {
      toValue: totalDistance,
      duration: (totalDistance / speed) * 1000,
      useNativeDriver: false,
    }).start();
  }, [isPlaying, script, fontSize, speed]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [showControls]);

  const handleDisplayTap = () => {
    setShowControls(!showControls);
  };

  const handleReset = () => {
    scrollAnimationRef.setValue(0);
    setIsPlaying(true);
  };

  return (
    <View style={styles.container}>
      {/* Main Display */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.displayArea}
        onPress={handleDisplayTap}
      >
        <Animated.View
          style={[
            styles.textContainer,
            {
              transform: [{ translateY: Animated.multiply(scrollAnimationRef, -1) }],
            },
          ]}
        >
          <Text style={[styles.scriptText, { fontSize }]}>
            {script}
          </Text>
        </Animated.View>

        {/* Tap hint */}
        {!showControls && (
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to show controls</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Controls Overlay */}
      {showControls && (
        <SafeAreaView style={styles.controlsContainer}>
          {/* Top controls */}
          <View style={styles.topControls}>
            <Button
              mode="contained"
              onPress={() => setIsPlaying(!isPlaying)}
              style={[
                styles.controlButton,
                { backgroundColor: isPlaying ? '#d32f2f' : '#388e3c' },
              ]}
              labelStyle={styles.buttonLabel}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </Button>

            <Button
              mode="contained"
              onPress={handleReset}
              style={[styles.controlButton, { backgroundColor: '#1976d2' }]}
              labelStyle={styles.buttonLabel}
            >
              ↑ Top
            </Button>

            <Button
              mode="contained"
              onPress={onExit}
              style={[styles.controlButton, { backgroundColor: '#f57c00' }]}
              labelStyle={styles.buttonLabel}
            >
              ✕ Exit
            </Button>
          </View>

          {/* Font size control */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>
              Text Size: {fontSize}px
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={24}
              maximumValue={120}
              step={4}
              value={fontSize}
              onValueChange={onFontSizeChange}
            />
          </View>

          {/* Speed control */}
          <View style={styles.controlSection}>
            <Text style={styles.controlLabel}>
              Speed: {Math.round(speed)} px/s
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={300}
              step={10}
              value={speed}
              onValueChange={onSpeedChange}
            />
          </View>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  displayArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  textContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
  },
  scriptText: {
    color: '#fff',
    textAlign: 'center',
    lineHeight: 1.8,
  },
  tapHint: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  tapHintText: {
    color: '#666',
    fontSize: 14,
  },
  controlsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#444',
  },
  topControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  controlButton: {
    flex: 1,
    borderRadius: 8,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlSection: {
    marginVertical: 8,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  slider: {
    width: '100%',
    height: 30,
  },
});
