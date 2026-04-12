import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export function useToast() {
  const [toast, setToast] = useState({ message: '', id: 0 });
  const show = (message: string) =>
    setToast((prev) => ({ message, id: prev.id + 1 }));
  return { toast, show };
}

export function Toast({ message, id }: { message: string; id: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    scale.setValue(0.92);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.92, duration: 280, useNativeDriver: true }),
      ]).start();
    }, 2000);

    return () => clearTimeout(timer);
  }, [id]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { opacity, transform: [{ scale }] }]}
    >
      <View style={styles.pill}>
        <Text style={styles.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pill: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingHorizontal: 28,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#383838',
  },
});
