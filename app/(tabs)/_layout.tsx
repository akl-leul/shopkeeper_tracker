import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import { StyleSheet, View } from 'react-native';
import { Calculator, Pencil, Music, Lightbulb, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const t = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text + '80',
        tabBarLabelStyle: {
          fontFamily: 'Poppins-Medium',
          fontSize: 12,
        },
        headerTitleStyle: {
          fontFamily: 'Poppins-Bold',
          fontSize: 18,
          color: colors.text,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="calculator"
        options={{
          title: t('calculator'),
          tabBarIcon: ({ color, size }) => <Calculator size={size} color={color} />,
          headerTitle: t('calculator'),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: t('notes'),
          tabBarIcon: ({ color, size }) => <Pencil size={size} color={color} />,
          headerTitle: t('notes'),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="media"
        options={{
          title: t('media'),
          tabBarIcon: ({ color, size }) => <Music size={size} color={color} />,
          headerTitle: t('media'),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="motivation"
        options={{
          title: t('motivation'),
          tabBarIcon: ({ color, size }) => <Lightbulb size={size} color={color} />,
          headerTitle: t('motivation'),
          headerShown: true,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
          headerTitle: t('settings'),
          headerShown: true,
        }}
      />
    </Tabs>
  );
}