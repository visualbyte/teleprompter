import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {
  Button,
  Text,
  Card,
  Slider,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

interface EditorScreenProps {
  script: string;
  onScriptChange: (script: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  onPlay: () => void;
}

export function EditorScreen({
  script,
  onScriptChange,
  fontSize,
  onFontSizeChange,
  speed,
  onSpeedChange,
  onPlay,
}: EditorScreenProps) {
  const textInputRef = useRef<TextInput>(null);

  const handleImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/plain',
      });

      if (result.type === 'success') {
        const fileUri = result.uri;
        const fileContent = await fetch(fileUri).then(res => res.text());
        onScriptChange(fileContent);
      }
    } catch (error) {
      console.error('Error importing file:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.title}>
            Teleprompter
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Write your script, then hit Play
          </Text>
        </View>

        {/* Script Input Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Your Script
            </Text>
            <View style={styles.buttonRow}>
              <Button
                icon="folder-open"
                mode="outlined"
                onPress={handleImportFile}
                style={styles.importButton}
              >
                Import
              </Button>
              <Button
                icon="trash-can"
                mode="outlined"
                onPress={() => onScriptChange('')}
                style={styles.clearButton}
              >
                Clear
              </Button>
            </View>

            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder="Paste or type your script here..."
              placeholderTextColor="#999"
              value={script}
              onChangeText={onScriptChange}
              multiline
              scrollEnabled
              textAlignVertical="top"
            />
          </Card.Content>
        </Card>

        {/* Font Size Control */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.controlLabel}>
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
            <View style={styles.previewBox}>
              <Text style={{ fontSize: fontSize * 0.3 }}>Preview</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Speed Control */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.controlLabel}>
              Scroll Speed: {Math.round(speed)} px/s
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={300}
              step={10}
              value={speed}
              onValueChange={onSpeedChange}
            />
          </Card.Content>
        </Card>

        {/* Play Button */}
        <Button
          mode="contained"
          size="large"
          disabled={!script.trim()}
          onPress={onPlay}
          style={styles.playButton}
          labelStyle={styles.playButtonLabel}
        >
          ▶ PLAY
        </Button>

        {/* Tips */}
        <Card style={[styles.card, styles.tipsCard]}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.tipTitle}>
              💡 Tips:
            </Text>
            <Text variant="bodySmall" style={styles.tipText}>
              • Adjust text size for readability{'\n'}
              • Set scroll speed to your preference{'\n'}
              • Tap PLAY to start full-screen mode
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    marginTop: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  controlLabel: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  importButton: {
    flex: 1,
  },
  clearButton: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 200,
    color: '#000',
    backgroundColor: '#fff',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  playButton: {
    marginVertical: 24,
    paddingVertical: 8,
  },
  playButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsCard: {
    backgroundColor: '#e3f2fd',
    marginBottom: 32,
  },
  tipTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1565c0',
  },
  tipText: {
    color: '#1565c0',
    lineHeight: 20,
  },
});
