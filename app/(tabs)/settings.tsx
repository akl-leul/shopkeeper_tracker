import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { usePreferences } from '@/context/PreferencesContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Moon, Sun, Globe, ChevronRight, Bell, CircleHelp as HelpCircle, Info, Trash, Share2, Lock, Save, CloudOff } from 'lucide-react-native';
import { clearAllData } from '@/utils/storageUtils';
import { languages } from '@/data/languageData';

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { preferences, updatePreference } = usePreferences();
  const t = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);
  
  const handleClearData = () => {
    if (Platform.OS === 'web') {
      if (confirm(t('confirmClearData'))) {
        clearAllData();
        alert(t('dataCleared'));
      }
    } else {
      Alert.alert(
        t('clearAllData'),
        t('confirmClearData'),
        [
          {
            text: t('cancel'),
            style: 'cancel'
          },
          {
            text: t('yes'),
            onPress: () => {
              clearAllData();
              Alert.alert(t('success'), t('dataCleared'));
            }
          }
        ]
      );
    }
  };
  
  const toggleNotifications = (value: boolean) => {
    updatePreference('notifications', value);
  };
  
  const toggleOfflineMode = (value: boolean) => {
    updatePreference('offlineMode', value);
  };
  
  const toggleHighContrastMode = (value: boolean) => {
    updatePreference('highContrastMode', value);
  };
  
  const toggleDynamicFontSize = (value: boolean) => {
    updatePreference('dynamicFontSize', value);
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('appearance')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={toggleTheme}
          >
            <View style={styles.settingLeft}>
              {theme === 'dark' ? (
                <Moon size={20} color={colors.primary} />
              ) : (
                <Sun size={20} color={colors.primary} />
              )}
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('theme')}
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.text + '80' }]}>
                {theme === 'dark' ? t('dark') : t('light')}
              </Text>
              <ChevronRight size={20} color={colors.text + '60'} />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => setShowLanguages(!showLanguages)}
          >
            <View style={styles.settingLeft}>
              <Globe size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('language')}
              </Text>
            </View>
            <View style={styles.settingRight}>
              <Text style={[styles.settingValue, { color: colors.text + '80' }]}>
                {languages.find(lang => lang.code === language)?.name || 'English'}
              </Text>
              <ChevronRight 
                size={20} 
                color={colors.text + '60'}
                style={{ 
                  transform: [{ rotate: showLanguages ? '90deg' : '0deg' }] 
                }}
              />
            </View>
          </TouchableOpacity>
          
          {showLanguages && (
            <Animated.View 
              style={styles.languagesList}
              entering={FadeIn.duration(300)}
            >
              {languages.map((lang) => (
                <TouchableOpacity 
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    language === lang.code && { 
                      backgroundColor: colors.primary + '20' 
                    }
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguages(false);
                  }}
                >
                  <Text 
                    style={[
                      styles.languageName, 
                      { 
                        color: language === lang.code ? colors.primary : colors.text 
                      }
                    ]}
                  >
                    {lang.name}
                  </Text>
                  <Text style={[styles.languageNative, { color: colors.text + '60' }]}>
                    {lang.nativeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('accessibility')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Sun size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('highContrastMode')}
              </Text>
            </View>
            <Switch
              value={preferences.highContrastMode}
              onValueChange={toggleHighContrastMode}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.highContrastMode ? colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('dynamicFontSize')}
              </Text>
            </View>
            <Switch
              value={preferences.dynamicFontSize}
              onValueChange={toggleDynamicFontSize}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.dynamicFontSize ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('preferences')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('notifications')}
              </Text>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.notifications ? colors.primary : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <CloudOff size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('offlineMode')}
              </Text>
            </View>
            <Switch
              value={preferences.offlineMode}
              onValueChange={toggleOfflineMode}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.offlineMode ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('data')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Save size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('backup')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text + '60'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={handleClearData}
          >
            <View style={styles.settingLeft}>
              <Trash size={20} color={colors.error} />
              <Text style={[styles.settingText, { color: colors.error }]}>
                {t('clearAllData')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text + '60'} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('about')}
        </Text>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Info size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('version')}
              </Text>
            </View>
            <Text style={[styles.settingValue, { color: colors.text + '80' }]}>
              1.0.0
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('help')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text + '60'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('privacy')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text + '60'} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Share2 size={20} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>
                {t('share')}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.text + '60'} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  card: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginLeft: 15,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginRight: 10,
  },
  languagesList: {
    paddingHorizontal: 5,
    paddingBottom: 10,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageName: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  languageNative: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
});