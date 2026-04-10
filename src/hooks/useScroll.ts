import { useState, useEffect, useCallback, useRef } from 'react';

interface UseScrollProps {
  isPlaying: boolean;
  speed: number; // pixels per second
  maxScroll: number; // max scroll position in pixels
}

export function useScroll({ isPlaying, speed, maxScroll }: UseScrollProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = Date.now();
      return;
    }

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000; // convert to seconds
      lastTimeRef.current = now;

      setScrollPosition((prev) => {
        const newPosition = prev + speed * deltaTime;

        // Stop at the end
        if (newPosition >= maxScroll) {
          return maxScroll;
        }

        return newPosition;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, speed, maxScroll]);

  const reset = useCallback(() => {
    setScrollPosition(0);
    lastTimeRef.current = Date.now();
  }, []);

  return { scrollPosition, reset };
}
