import { useState, useCallback } from 'react';
import { TextEditor } from './components/TextEditor';
import { TeleprompterDisplay } from './components/TeleprompterDisplay';
import { Controls } from './components/Controls';
import { useScroll } from './hooks/useScroll';
import { useLocalStorage } from './hooks/useLocalStorage';
import './App.css';

type Tab = 'editor' | 'teleprompter';

function App() {
  const [script, setScript] = useLocalStorage<string>('teleprompter_script', '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useLocalStorage<number>('teleprompter_speed', 100);
  const [fontSize, setFontSize] = useLocalStorage<number>('teleprompter_fontSize', 48);
  const [maxScroll, setMaxScroll] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('teleprompter');

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

  return (
    <div className="h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Desktop: Left side - Text Editor (always visible) */}
      <div className="hidden md:flex md:w-1/3 flex-col bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile: Tab navigation */}
        <div className="md:hidden flex bg-white border-b border-gray-200">
          <button
            onClick={() => setActiveTab('teleprompter')}
            className={`flex-1 py-3 font-semibold text-center transition-colors ${
              activeTab === 'teleprompter'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 border-b-2 border-transparent'
            }`}
          >
            Teleprompter
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex-1 py-3 font-semibold text-center transition-colors ${
              activeTab === 'editor'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 border-b-2 border-transparent'
            }`}
          >
            Script
          </button>
        </div>

        {/* Mobile: Editor tab */}
        {activeTab === 'editor' && (
          <div className="md:hidden flex-1 flex flex-col overflow-hidden">
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
        )}

        {/* Desktop: Display area + Controls */}
        {/* Mobile: Teleprompter tab */}
        {(activeTab === 'teleprompter' || window.innerWidth >= 768) && (
          <>
            <div className="flex-1 flex overflow-hidden">
              <TeleprompterDisplay
                content={script}
                fontSize={fontSize}
                scrollPosition={scrollPosition}
                onMaxScroll={setMaxScroll}
              />
            </div>

            {/* Controls */}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
