import { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { X, RotateCcw, Calendar, Clock, ArrowLeft } from 'lucide-react-native';
import { calculatorButtons } from '@/data/calculatorData';
import { evaluateExpression, formatExpression } from '@/utils/calculatorUtils';

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const t = useTranslation();
  const [displayValue, setDisplayValue] = useState('0');
  const [formula, setFormula] = useState('');
  const [history, setHistory] = useState<{ formula: string; result: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const historyAnimation = useSharedValue(0);
  
  const historyStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: withSpring(historyAnimation.value) }],
    };
  });

  const toggleHistory = () => {
    historyAnimation.value = showHistory ? 0 : -300;
    setShowHistory(!showHistory);
  };

  const handleButtonPress = (value: string) => {
    switch (value) {
      case 'C':
        setDisplayValue('0');
        setFormula('');
        break;
      case '←':
        if (displayValue.length === 1) {
          setDisplayValue('0');
        } else {
          setDisplayValue(displayValue.slice(0, -1));
        }
        break;
      case '=':
        try {
          const result = evaluateExpression(displayValue);
          const newHistoryItem = { formula: displayValue, result: result.toString() };
          setHistory([newHistoryItem, ...history]);
          setFormula(displayValue);
          setDisplayValue(result.toString());
        } catch (error) {
          setDisplayValue('Error');
        }
        break;
      default:
        if (displayValue === '0' || displayValue === 'Error') {
          setDisplayValue(value);
        } else {
          setDisplayValue(displayValue + value);
        }
    }
    
    // Scroll to the end of the display
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  const useHistoryItem = (item: { formula: string; result: string }) => {
    setDisplayValue(item.result);
    setFormula(item.formula);
    toggleHistory();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View 
        style={[
          styles.historyPanel, 
          historyStyle, 
          { backgroundColor: colors.card }
        ]}
      >
        <View style={styles.historyHeader}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>{t('history')}</Text>
          <TouchableOpacity style={styles.clearButton} onPress={clearHistory}>
            <RotateCcw size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={toggleHistory}>
            <ArrowLeft size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.historyList}>
          {history.length === 0 ? (
            <Text style={[styles.noHistory, { color: colors.text }]}>
              {t('noHistory')}
            </Text>
          ) : (
            history.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={[styles.historyItem, { borderBottomColor: colors.border }]}
                onPress={() => useHistoryItem(item)}
              >
                <Text style={[styles.historyFormula, { color: colors.text }]}>{formatExpression(item.formula)}</Text>
                <Text style={[styles.historyResult, { color: colors.primary }]}>{item.result}</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </Animated.View>
      
      <View style={styles.displayContainer}>
        {formula !== '' && (
          <Text style={[styles.formula, { color: colors.text + '80' }]}>
            {formatExpression(formula)}
          </Text>
        )}
        <ScrollView 
          ref={scrollViewRef}
          horizontal 
          style={styles.displayScrollView}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.displayScrollContent}
        >
          <Text style={[styles.display, { color: colors.text }]}>
            {formatExpression(displayValue)}
          </Text>
        </ScrollView>
      </View>

      <View style={styles.buttonsContainer}>
        <View style={styles.topRow}>
          <TouchableOpacity 
            style={[styles.historyButton, { backgroundColor: colors.card }]} 
            onPress={toggleHistory}
          >
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.historyButtonText, { color: colors.primary }]}>
              {t('history')}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.keypad}>
          {calculatorButtons.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((button) => {
                const isOperator = ['+', '-', '×', '÷', '='].includes(button.value);
                const isFunction = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'π', 'e', '^'].includes(button.value);
                const isControl = ['C', '←'].includes(button.value);
                
                let buttonStyle: any = [
                  styles.button,
                  { 
                    backgroundColor: isOperator 
                      ? colors.primary 
                      : isFunction 
                        ? colors.secondary 
                        : isControl 
                          ? colors.error 
                          : colors.card 
                  }
                ];
                
                if (button.span) {
                  buttonStyle.push({ flex: button.span });
                }
                
                return (
                  <TouchableOpacity
                    key={button.value}
                    style={buttonStyle}
                    onPress={() => handleButtonPress(button.value)}
                  >
                    <Text 
                      style={[
                        styles.buttonText, 
                        { 
                          color: isOperator || isControl 
                            ? '#fff' 
                            : isFunction 
                              ? '#fff' 
                              : colors.text 
                        }
                      ]}
                    >
                      {button.display || button.value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 🛠️ Replace your existing StyleSheet.create({ ... }) with this:
const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  historyPanel: {
    position: 'absolute',
    width: 300,
    height: '100%',
    left: 0,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  historyTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    flex: 1,
  },
  clearButton: {
    padding: 10,
  },
  closeButton: {
    padding: 10,
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 10,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyFormula: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  historyResult: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  noHistory: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    opacity: 0.6,
  },
  displayContainer: {
    padding: 24,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    minHeight: 160,
  },
  formula: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    marginBottom: 4,
    opacity: 0.6,
  },
  displayScrollView: {
    alignSelf: 'stretch',
  },
  displayScrollContent: {
    alignItems: 'flex-end',
    flexGrow: 1,
  },
  display: {
    fontFamily: 'Poppins-Bold',
    fontSize: 42,
  },
  buttonsContainer: {
    flex: 1,
    padding: 10,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
  },
  historyButtonText: {
    marginLeft: 6,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  keypad: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    margin: 5,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 1, height: 1 },
  },
  buttonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
  },
});

