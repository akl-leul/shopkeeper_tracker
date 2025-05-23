import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';
import { languages } from '@/data/languageData';

// Get device language
const getDeviceLanguage = (): string => {
  let deviceLanguage = 'en';
  
  if (Platform.OS === 'ios') {
    deviceLanguage = NativeModules.LanguageManager.language.split('-')[0];
  } else if (Platform.OS === 'android') {
    deviceLanguage = NativeModules.I18nManager.localeIdentifier.split('_')[0];
  } else if (Platform.OS === 'web') {
    deviceLanguage = navigator.language.split('-')[0];
  }
  
  // Check if the device language is supported
  const isSupported = languages.some(lang => lang.code === deviceLanguage);
  return isSupported ? deviceLanguage : 'en';
};

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('en');
  
  // Load language from storage or use device language
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('studenthub_language');
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        } else {
          const deviceLanguage = getDeviceLanguage();
          setLanguageState(deviceLanguage);
        }
      } catch (error) {
        console.error('Error loading language', error);
      }
    };
    
    loadLanguage();
  }, []);
  
  // Save language to storage
  const setLanguage = async (code: string) => {
    try {
      await AsyncStorage.setItem('studenthub_language', code);
      setLanguageState(code);
    } catch (error) {
      console.error('Error saving language', error);
    }
  };
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};