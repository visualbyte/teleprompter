import { useRef, useEffect, useState } from 'react';

interface FullScreenModeProps {
  script: string;
  fontSize: number;
  scrollPosition: number;
  maxScroll: number;
  onMaxScroll: (max: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  onExit: () => void;
}

export function FullScreenMode({
  script,
  fontSize,
  scrollPosition,
  onMaxScroll,
  isPlaying,
  onPlayPause,
  onReset,
  speed,
  onSpeedChange,
  onFontSizeChange,
  onExit,
}: FullScreenModeProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const touchStartRef = useRef({ y: 0, time: 0 });

  // Request fullscreen on mount (desktop only)
  useEffect(() => {
    const container = containerRef.current;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (container && !isMobile && document.fullscreenEnabled) {
      container.requestFullscreen().catch(() => {
        console.log('Fullscreen not available');
      });
    }

    // Handle fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [onExit]);

  // Update max scroll when content changes
  useEffect(() => {
    if (contentRef.current) {
      const maxScroll = contentRef.current.scrollHeight - contentRef.current.clientHeight;
      onMaxScroll(Math.max(maxScroll, 0));
    }
  }, [script, fontSize, onMaxScroll]);

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

  // Handle keyboard shortcuts (ESC to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
      if (e.key === ' ') {
        e.preventDefault();
        onPlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, onPlayPause]);

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  // Handle touch end (swipe detection)
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartRef.current.y - touchEndY;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Detect swipe (more than 50px in less than 500ms)
    if (Math.abs(deltaY) > 50 && deltaTime < 500) {
      if (deltaY > 0) {
        // Swipe up - skip forward
        onPlayPause();
      } else {
        // Swipe down - pause
        if (isPlaying) {
          onPlayPause();
        }
      }
    }
  };

  // Tap to toggle controls
  const handleDisplayTap = () => {
    setShowControls(!showControls);
  };

  return (
    <div
      ref={containerRef}
      className="h-screen bg-black flex flex-col overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Main display area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative"
        onClick={handleDisplayTap}
      >
        {/* Scroll container */}
        <div
          ref={contentRef}
          className="w-full h-full px-4 md:px-8 py-12 text-white text-center overflow-hidden flex items-center justify-center"
          style={{
            transform: `translateY(-${scrollPosition}px)`,
            fontSize: `${fontSize}px`,
            lineHeight: '1.8',
            transition: isPlaying ? 'none' : 'transform 0.1s linear',
          }}
        >
          {script ? (
            <div className="whitespace-pre-wrap break-words">
              {script}
            </div>
          ) : (
            <div className="text-gray-500 text-4xl">
              No script loaded
            </div>
          )}
        </div>

        {/* Fade overlays */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none" />

        {/* Center tap hint */}
        {!showControls && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-600 text-sm animate-pulse">
              Tap to show controls
            </div>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div
        className={`bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-20'
        }`}
      >
        <div className="px-4 md:px-6 py-4 md:py-6 space-y-3 md:space-y-4">
          {/* Play/Pause and Reset buttons */}
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={onPlayPause}
              className={`flex-1 px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base transition-colors ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              ↑ Top
            </button>
            <button
              onClick={onExit}
              className="px-4 py-2 md:py-3 rounded-lg font-bold text-sm md:text-base bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              ✕ Exit
            </button>
          </div>

          {/* Font size control */}
          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-300 block mb-1">
              Text Size: {fontSize}px
            </label>
            <input
              type="range"
              min="24"
              max="120"
              step="4"
              value={fontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Speed control */}
          <div>
            <label className="text-xs md:text-sm font-semibold text-gray-300 block mb-1">
              Speed: {Math.round(speed)} px/s
            </label>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={speed}
              onChange={(e) => onSpeedChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Gesture hints */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
            Swipe up to toggle • Tap to hide controls
          </div>
        </div>
      </div>
    </div>
  );
}
