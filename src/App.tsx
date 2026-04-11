import { useState, useCallback } from 'react';
import { FullScreenMode } from './components/FullScreenMode';
import { useScroll } from './hooks/useScroll';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

function App() {
  const [script, setScript] = useLocalStorage<string>('teleprompter_script', '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useLocalStorage<number>('teleprompter_speed', 100);
  const [fontSize, setFontSize] = useLocalStorage<number>('teleprompter_fontSize', 48);
  const [maxScroll, setMaxScroll] = useState(0);

  const { scrollPosition, reset: resetScroll } = useScroll({
    isPlaying,
    speed,
    maxScroll,
  });

  const handleFileImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setScript(content);
      resetScroll();
    };
    reader.readAsText(file);
  }, [setScript, resetScroll]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    resetScroll();
  }, [resetScroll]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    resetScroll();
  }, [resetScroll]);

  // Full screen mode active
  if (isPlaying) {
    return (
      <FullScreenMode
        script={script}
        fontSize={fontSize}
        scrollPosition={scrollPosition}
        maxScroll={maxScroll}
        onMaxScroll={setMaxScroll}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={handleReset}
        speed={speed}
        onSpeedChange={setSpeed}
        onFontSizeChange={setFontSize}
        onExit={() => setIsPlaying(false)}
      />
    );
  }

  // Editor screen
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-4 md:p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Teleprompter</h1>
        <p className="text-gray-600 mt-1">Write or paste your script, then hit Play</p>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0 md:gap-6 p-4 md:p-6">
        {/* Script editor section */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Your Script</h2>
            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileImport(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  📁 Import File
                </button>
              </label>
              <button
                onClick={() => {
                  setScript('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Text area */}
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste or type your script here..."
            className="flex-1 p-4 md:p-6 border-none focus:ring-0 resize-none font-serif text-gray-700 text-base md:text-lg placeholder-gray-400"
          />
        </div>

        {/* Settings section */}
        <div className="w-full md:w-72 flex flex-col gap-4">
          {/* Font size control */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Text Size
            </label>
            <input
              type="range"
              min="24"
              max="120"
              step="4"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
            />
            <div className="text-center text-lg font-bold text-blue-600">{fontSize}px</div>
            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
              <div className="text-center" style={{ fontSize: `${Math.min(fontSize * 0.4, 24)}px` }}>
                Preview
              </div>
            </div>
          </div>

          {/* Speed control */}
          <div className="bg-white rounded-lg shadow-md p-4 md:p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Scroll Speed
            </label>
            <input
              type="range"
              min="30"
              max="300"
              step="10"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500 mb-2"
            />
            <div className="text-center text-lg font-bold text-blue-600">{Math.round(speed)} px/s</div>
          </div>

          {/* Play button */}
          <button
            onClick={handlePlay}
            disabled={!script.trim()}
            className={`w-full py-4 md:py-6 rounded-lg font-bold text-xl text-white transition-all transform hover:scale-105 ${
              script.trim()
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            ▶ PLAY
          </button>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="text-xs space-y-1">
              <li>• Adjust text size before playing</li>
              <li>• Set scroll speed to your preference</li>
              <li>• Tap Play to start full-screen mode</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
