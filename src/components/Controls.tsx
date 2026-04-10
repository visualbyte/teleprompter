interface ControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
}

export function Controls({
  isPlaying,
  onPlay,
  onPause,
  onReset,
  speed,
  onSpeedChange,
  fontSize,
  onFontSizeChange,
}: ControlsProps) {
  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Play/Pause/Reset buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onReset}
            className="flex-1 px-4 py-3 rounded-lg font-semibold bg-gray-200 hover:bg-gray-300 text-gray-900 transition-colors"
          >
            Reset
          </button>
        </div>

        {/* Speed control */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Scroll Speed: <span className="font-bold text-blue-600">{Math.round(speed)} px/s</span>
          </label>
          <input
            type="range"
            min="20"
            max="300"
            step="10"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Font size control */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Font Size: <span className="font-bold text-blue-600">{fontSize}px</span>
          </label>
          <input
            type="range"
            min="16"
            max="120"
            step="2"
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>
      </div>
    </div>
  );
}
