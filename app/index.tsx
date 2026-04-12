import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

type ScrollSpeed = 0.5 | 1 | 2 | 5;

export default function EditorScreen() {
  const router = useRouter();
  const [speed, setSpeed] = useState<ScrollSpeed>(1);
  const [scriptText, setScriptText] = useState(
    'Good evening, world. Tonight we rewrite history—or at least, tonight\'s dinner order. Stay with me'
  );
  const [isEditing, setIsEditing] = useState(false);

  const handlePlay = () => {
    router.push({
      pathname: '/player',
      params: { text: scriptText, speed: speed.toString() },
    });
  };

  const handleReset = () => {
    setScriptText(
      'Good evening, world. Tonight we rewrite history—or at least, tonight\'s dinner order. Stay with me'
    );
  };

  const readTimeSeconds = Math.ceil(scriptText.split(' ').length / 140);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header */}
      <View style={{ height: 80, justifyContent: 'center', paddingHorizontal: 20 }}>
        <Text style={{ fontSize: 32, fontWeight: '600', color: '#b7b7b7' }}>
          Orra.
        </Text>
      </View>

      {/* Script Text Area */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: 20, marginBottom: 200 }}
        scrollEnabled={!isEditing}
      >
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: '600',
                color: '#000',
                lineHeight: 42,
              }}
            >
              {scriptText}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            value={scriptText}
            onChangeText={setScriptText}
            multiline
            autoFocus
            style={{
              fontSize: 32,
              fontWeight: '600',
              color: '#000',
              lineHeight: 42,
              padding: 10,
              borderWidth: 1,
              borderColor: '#ddd',
              borderRadius: 8,
            }}
          />
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          paddingVertical: 20,
          paddingHorizontal: 20,
        }}
      >
        {/* Speed Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {([0.5, 1, 2, 5] as ScrollSpeed[]).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setSpeed(s)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: speed === s ? '#34c759' : '#f0f0f0',
              }}
            >
              <Text
                style={{
                  color: speed === s ? '#fff' : '#000',
                  fontWeight: '600',
                }}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Read Time */}
        <Text
          style={{
            textAlign: 'center',
            color: '#999',
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          ~{readTimeSeconds} seconds read time
        </Text>

        {/* Buttons Row */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Reset Button */}
          <TouchableOpacity
            onPress={handleReset}
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>↻</Text>
          </TouchableOpacity>

          {/* Play Button */}
          <TouchableOpacity
            onPress={handlePlay}
            style={{
              width: 70,
              height: 70,
              borderRadius: 35,
              backgroundColor: '#34c759',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 32, color: '#fff' }}>▶</Text>
          </TouchableOpacity>

          {/* Options Button */}
          <TouchableOpacity
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: '#f0f0f0',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 20 }}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Done Editing Button (if editing) */}
        {isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(false)}
            style={{
              marginTop: 16,
              paddingVertical: 12,
              backgroundColor: '#007AFF',
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
              Done Editing
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
