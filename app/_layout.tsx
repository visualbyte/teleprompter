import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="player"
          options={{
            animationEnabled: false,
          }}
        />
      </Stack>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
    </>
  );
}
