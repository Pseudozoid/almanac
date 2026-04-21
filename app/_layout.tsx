import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { EBGaramond_400Regular, EBGaramond_700Bold } from '@expo-google-fonts/eb-garamond';
import { useSettingsStore } from '../src/store/settingsStore';
import { useColorScheme } from 'nativewind';
import '../global.css';

export default function Layout() {
  const { theme } = useSettingsStore();
  const { setColorScheme } = useColorScheme();
  
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    EBGaramond_400Regular,
    EBGaramond_700Bold,
  });

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  if (!fontsLoaded) {
    return null;
  }

  // Determine the background color based on the theme to pass to contentStyle
  const bgColor = theme === 'dark' ? '#1D2021' : '#FDFBF7';

  return (
    <Stack 
      screenOptions={{ 
        headerShown: false, 
        contentStyle: { backgroundColor: bgColor } 
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="reader/[id]" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}
