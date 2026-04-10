import { useState, useCallback } from 'react';
import { TextEditor } from './components/TextEditor';
import { TeleprompterDisplay } from './components/TeleprompterDisplay';
import { Controls } from './components/Controls';
import { useScroll } from './hooks/useScroll';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

function App() {
  const [script, setScript] = useLocalStorage<string>('teleprompter_script', '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useLocalStorage<number>('teleprompter_speed', 100);
  const [fontSize, setFontSize] = useLocalStorage<number>('teleprompter_fontSize', 48);
  const [maxScroll, setMaxScroll] = useState(0);
  const [layout, setLayout] = useState<'split' | 'full'>('split');

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

  if (layout === 'full') {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Full screen display */}
        <div className="flex-1">
          <TeleprompterDisplay
            content={script}
            fontSize={fontSize}
            scrollPosition={scrollPosition}
            onMaxScroll={setMaxScroll}
          />
        </div>

        {/* Minimal controls at bottom */}
        <div className="bg-black border-t border-gray-700 p-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
                isPlaying
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              Reset
            </button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-white text-sm font-semibold">Speed:</span>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-white text-sm min-w-12">{Math.round(speed)}</span>
            </div>
            <button
              onClick={() => setLayout('split')}
              className="px-4 py-2 rounded font-semibold text-sm bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              Exit Full Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left side - Text Editor */}
      <div className="w-1/3 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Teleprompter</h1>
        </div>
        <TextEditor
          content={script}
          onChange={setScript}
          onImport={handleFileImport}
          onClear={() => {
            setScript('');
            setIsPlaying(false);
            resetScroll();
          }}
        />
      </div>

      {/* Right side - Display and Controls */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex">
          <TeleprompterDisplay
            content={script}
            fontSize={fontSize}
            scrollPosition={scrollPosition}
            onMaxScroll={setMaxScroll}
          />
        </div>
        <div className="bg-white border-t border-gray-200">
          <Controls
            isPlaying={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
          />
          <div className="px-4 pb-4 text-center">
            <button
              onClick={() => setLayout('full')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Enter Full Screen Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
