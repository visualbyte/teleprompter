import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { EditorScreen } from './src/screens/EditorScreen';
import { TeleprompterScreen } from './src/screens/TeleprompterScreen';

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [script, setScript] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [speed, setSpeed] = useState(100);

  const handlePlay = useCallback(() => {
    if (script.trim()) {
      setIsPlaying(true);
    }
  }, [script]);

  const handleExit = useCallback(() => {
    setIsPlaying(false);
  }, []);

  return (
    <PaperProvider>
      <View style={styles.container}>
        {isPlaying ? (
          <TeleprompterScreen
            script={script}
            fontSize={fontSize}
            speed={speed}
            onFontSizeChange={setFontSize}
            onSpeedChange={setSpeed}
            onExit={handleExit}
          />
        ) : (
          <EditorScreen
            script={script}
            onScriptChange={setScript}
            fontSize={fontSize}
            onFontSizeChange={setFontSize}
            speed={speed}
            onSpeedChange={setSpeed}
            onPlay={handlePlay}
          />
        )}
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
