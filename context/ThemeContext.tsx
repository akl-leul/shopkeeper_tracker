import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/utils/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightColors,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const colorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>(colorScheme === 'dark' ? 'dark' : 'light');
  
  // Load theme from storage or use system default
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('studenthub_theme');
        if (savedTheme) {
          setThemeState(savedTheme as ThemeType);
        } else if (colorScheme) {
          setThemeState(colorScheme as ThemeType);
        }
      } catch (error) {
        console.error('Error loading theme', error);
      }
    };
    
    loadTheme();
  }, [colorScheme]);
  
  // Save theme to storage
  const setTheme = async (newTheme: ThemeType) => {
    try {
      await AsyncStorage.setItem('studenthub_theme', newTheme);
      setThemeState(newTheme);
    } catch (error) {
      console.error('Error saving theme', error);
    }
  };
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };
  
  const colors = theme === 'light' ? lightColors : darkColors;
  
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};