import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function TabsLayout() {
  const { theme } = useSettingsStore();
  const isLight = theme === 'light';

  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: isLight ? '#FFFFFF' : '#282828', 
          borderTopColor: isLight ? '#EBE5DB' : '#3C3836',
          elevation: 0,
          shadowOpacity: 0.05,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isLight ? '#C39738' : '#D79921',
        tabBarInactiveTintColor: isLight ? '#8C8681' : '#A89984',
        tabBarLabelStyle: { fontFamily: 'Inter', fontSize: 12 },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Library',
          tabBarIcon: ({ color }) => <Feather name="book" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="highlights" 
        options={{ 
          title: 'Highlights',
          tabBarIcon: ({ color }) => <Feather name="bookmark" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="goals" 
        options={{ 
          title: 'Goals',
          tabBarIcon: ({ color }) => <Feather name="target" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
