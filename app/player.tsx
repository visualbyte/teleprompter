import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type PlayerState = 'countdown' | 'playing' | 'paused' | 'ended';

export default function PlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const text = (params.text as string) || '';
  const speed = parseFloat((params.speed as string) || '1');

  const [state, setState] = useState<PlayerState>('countdown');
  const [countdownValue, setCountdownValue] = useState(3);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollPosRef = useRef(0);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contentHeightRef = useRef(0);

  // Countdown logic
  useEffect(() => {
    if (state !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setState('playing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [state]);

  // Auto-scroll logic
  useEffect(() => {
    if (state === 'playing') {
      // Start scrolling: ~80 pixels per second at 1x speed
      const scrollSpeed = 80 * speed;
      const updateInterval = 50; // ms

      scrollIntervalRef.current = setInterval(() => {
        const increment = (scrollSpeed * updateInterval) / 1000;
        scrollPosRef.current += increment;

        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({
            y: scrollPosRef.current,
            animated: false,
          });
        }
      }, updateInterval);
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, [state, speed]);

  const handlePlayPause = () => {
    setState((prev) => (prev === 'playing' ? 'paused' : 'playing'));
  };

  const handleReturn = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }
    scrollPosRef.current = 0;
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* App Bar */}
      <View
        style={{
          height: 154,
          justifyContent: 'flex-end',
          paddingHorizontal: 32,
          paddingBottom: 16,
          backgroundColor: '#000',
        }}
      >
        <Text style={{ fontSize: 34, fontWeight: '500', color: '#fff' }}>
          teleprompter
        </Text>
      </View>

      {/* Top Scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,1)', 'rgba(0,0,0,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          top: 154,
          left: 0,
          right: 0,
          height: 154,
          zIndex: 10,
        }}
      />

      {/* Countdown Overlay */}
      {state === 'countdown' && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.95)',
              zIndex: 100,
            },
          ]}
        >
          <Text
            style={{
              fontSize: 120,
              fontWeight: '700',
              color: '#fff',
            }}
          >
            {countdownValue}
          </Text>
        </View>
      )}

      {/* Script Text */}
      <ScrollView
        ref={scrollViewRef}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          paddingHorizontal: 32,
          paddingTop: 100,
          paddingBottom: 160,
          backgroundColor: '#000',
        }}
      >
        <Text
          style={{
            fontSize: 48,
            fontWeight: '600',
            color: '#fff',
            lineHeight: 56,
          }}
        >
          {text}
        </Text>
        <View
          style={{
            backgroundColor: '#333',
            borderRadius: 40,
            paddingHorizontal: 16,
            paddingVertical: 8,
            alignSelf: 'center',
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          <Text style={{ color: '#888', fontSize: 16, fontWeight: '600' }}>
            end of the script...
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Scrim */}
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 221,
          zIndex: 10,
        }}
      />

      {/* Bottom Controls */}
      {state !== 'countdown' && (
        <View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            height: 80,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          {/* Return Button */}
          <TouchableOpacity
            onPress={handleReturn}
            style={{
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 24, color: '#fff' }}>←</Text>
          </TouchableOpacity>

          {/* Play/Pause Button */}
          <TouchableOpacity
            onPress={handlePlayPause}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: state === 'playing' ? '#ff4444' : '#34c759',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, color: '#fff' }}>
              {state === 'playing' ? '||' : '▶'}
            </Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ width: 32, height: 32 }} />
        </View>
      )}
    </SafeAreaView>
  );
}
