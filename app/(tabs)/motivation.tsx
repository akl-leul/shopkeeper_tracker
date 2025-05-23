import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Platform
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  withRepeat,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { Clock, Target, Award, Plus, X, Play, Pause, RotateCcw, ChevronRight, CreditCard as Edit, Check, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  saveGoal, 
  getGoals, 
  updateGoal, 
  deleteGoal,
  saveAchievement,
  getAchievements
} from '@/utils/storageUtils';
import { Goal, Achievement } from '@/types';
import { quotes } from '@/data/quotesData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.8;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function MotivationScreen() {
  const { colors, theme } = useTheme();
  const t = useTranslation();
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [timerActive, setTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [studyTime, setStudyTime] = useState(25 * 60); // 25 minutes in seconds
  const [breakTime, setBreakTime] = useState(5 * 60); // 5 minutes in seconds
  const [timeRemaining, setTimeRemaining] = useState(studyTime);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  
  // Animation values
  const quoteOpacity = useSharedValue(0);
  const timerScale = useSharedValue(1);
  const timerRotation = useSharedValue(0);
  const progressValue = useSharedValue(0);
  
  // Timer interval ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load data on component mount
  useEffect(() => {
    loadRandomQuote();
    loadGoals();
    loadAchievements();
    
    // Start quote rotation
    const quoteInterval = setInterval(loadRandomQuote, 60000); // Change quote every minute
    
    return () => {
      clearInterval(quoteInterval);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);
  
  // Update progress animation when timer changes
  useEffect(() => {
    const totalTime = timerMode === 'study' ? studyTime : breakTime;
    progressValue.value = withTiming(1 - (timeRemaining / totalTime), { duration: 300 });
  }, [timeRemaining, timerMode]);
  
  const loadRandomQuote = () => {
    quoteOpacity.value = withTiming(0, { duration: 500 }, () => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[randomIndex]);
      quoteOpacity.value = withTiming(1, { duration: 500 });
    });
  };
  
  const loadGoals = async () => {
    const savedGoals = await getGoals();
    setGoals(savedGoals);
  };
  
  const loadAchievements = async () => {
    const savedAchievements = await getAchievements();
    setAchievements(savedAchievements);
  };
  
  const toggleTimer = () => {
    if (timerActive) {
      // Stop timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimerActive(false);
      timerScale.value = withSpring(1);
      timerRotation.value = 0;
    } else {
      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Timer finished
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
            
            // Switch timer mode
            const newMode = timerMode === 'study' ? 'break' : 'study';
            setTimerMode(newMode);
            const newTime = newMode === 'study' ? studyTime : breakTime;
            
            // Create achievement when completing a study session
            if (timerMode === 'study') {
              const newAchievement: Achievement = {
                id: Date.now().toString(),
                title: t('completedStudySession'),
                description: t('studySessionMinutes', { minutes: Math.floor(studyTime / 60) }),
                date: new Date().toISOString(),
                type: 'study'
              };
              saveAchievement(newAchievement);
              loadAchievements();
            }
            
            // Reset timer
            setTimeout(() => {
              setTimeRemaining(newTime);
              setTimerActive(false);
              timerScale.value = withSpring(1);
              timerRotation.value = 0;
            }, 500);
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimerActive(true);
      timerScale.value = withRepeat(
        withTiming(1.05, { duration: 1000, easing: Easing.ease }),
        -1,
        true
      );
      timerRotation.value = withRepeat(
        withTiming(360, { duration: 60000, easing: Easing.linear }),
        -1,
        false
      );
    }
  };
  
  const resetTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeRemaining(timerMode === 'study' ? studyTime : breakTime);
    setTimerActive(false);
    timerScale.value = withSpring(1);
    timerRotation.value = 0;
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleAddGoal = async () => {
    if (newGoalTitle.trim() === '') {
      return;
    }
    
    if (editingGoalId) {
      // Update existing goal
      const updatedGoal: Goal = {
        id: editingGoalId,
        title: newGoalTitle,
        deadline: newGoalDeadline,
        completed: goals.find(g => g.id === editingGoalId)?.completed || false,
        createdAt: goals.find(g => g.id === editingGoalId)?.createdAt || new Date().toISOString()
      };
      
      await updateGoal(updatedGoal);
    } else {
      // Create new goal
      const newGoal: Goal = {
        id: Date.now().toString(),
        title: newGoalTitle,
        deadline: newGoalDeadline,
        completed: false,
        createdAt: new Date().toISOString()
      };
      
      await saveGoal(newGoal);
    }
    
    await loadGoals();
    setNewGoalTitle('');
    setNewGoalDeadline('');
    setEditingGoalId(null);
    setShowGoalModal(false);
  };
  
  const handleEditGoal = (goal: Goal) => {
    setNewGoalTitle(goal.title);
    setNewGoalDeadline(goal.deadline || '');
    setEditingGoalId(goal.id);
    setShowGoalModal(true);
  };
  
  const handleToggleGoalCompletion = async (goal: Goal) => {
    const updatedGoal: Goal = {
      ...goal,
      completed: !goal.completed
    };
    
    await updateGoal(updatedGoal);
    
    // If completing a goal, add an achievement
    if (!goal.completed) {
      const newAchievement: Achievement = {
        id: Date.now().toString(),
        title: t('completedGoal'),
        description: goal.title,
        date: new Date().toISOString(),
        type: 'goal'
      };
      await saveAchievement(newAchievement);
      await loadAchievements();
    }
    
    await loadGoals();
  };
  
  const handleDeleteGoal = async (id: string) => {
    await deleteGoal(id);
    await loadGoals();
  };
  
  // Animation styles
  const quoteAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: quoteOpacity.value,
    };
  });
  
  const timerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: timerScale.value },
        { rotate: `${timerRotation.value}deg` }
      ],
    };
  });
  
  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${(1 - progressValue.value) * 100}%`,
    };
  });
  
  const renderGoalItem = ({ item }: { item: Goal }) => {
    return (
      <View 
        style={[
          styles.goalItem, 
          { 
            backgroundColor: colors.card,
            opacity: item.completed ? 0.7 : 1,
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.goalCheckbox,
            {
              backgroundColor: item.completed ? colors.primary : 'transparent',
              borderColor: colors.primary
            }
          ]}
          onPress={() => handleToggleGoalCompletion(item)}
        >
          {item.completed && <Check size={16} color="#fff" />}
        </TouchableOpacity>
        
        <View style={styles.goalInfo}>
          <Text 
            style={[
              styles.goalTitle, 
              { 
                color: colors.text,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              }
            ]}
          >
            {item.title}
          </Text>
          
          {item.deadline && (
            <Text style={[styles.goalDeadline, { color: colors.text + '60' }]}>
              {t('deadline')}: {item.deadline}
            </Text>
          )}
        </View>
        
        <View style={styles.goalActions}>
          {!item.completed && (
            <TouchableOpacity
              style={styles.goalActionButton}
              onPress={() => handleEditGoal(item)}
            >
              <Edit size={16} color={colors.text} />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.goalActionButton}
            onPress={() => handleDeleteGoal(item.id)}
          >
            <X size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const renderAchievementItem = ({ item, index }: { item: Achievement, index: number }) => {
    const isFirst = index === 0;
    
    return (
      <View 
        style={[
          styles.achievementCard, 
          { 
            backgroundColor: item.type === 'study' ? colors.secondary : colors.primary,
            marginLeft: isFirst ? 0 : 10,
            marginRight: 10
          }
        ]}
      >
        <Award size={40} color="#fff" style={styles.achievementIcon} />
        <Text style={styles.achievementTitle}>{item.title}</Text>
        <Text style={styles.achievementDesc}>{item.description}</Text>
        <Text style={styles.achievementDate}>
          {new Date(item.date).toLocaleDateString()}
        </Text>
      </View>
    );
  };
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Quote Section */}
      <Animated.View 
        style={[styles.quoteContainer, quoteAnimatedStyle]}
      >
        <Text style={[styles.quoteText, { color: colors.text }]}>"{quote.text}"</Text>
        <Text style={[styles.quoteAuthor, { color: colors.text + '80' }]}>— {quote.author}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadRandomQuote}>
          <RefreshCw size={20} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Timer Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Clock size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('studyTimer')}
          </Text>
        </View>
        
        <View style={[styles.timerContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.timerLabel, { color: colors.text + '80' }]}>
            {timerMode === 'study' ? t('studySession') : t('breakTime')}
          </Text>
          
          <Animated.View style={[styles.timerCircle, timerAnimatedStyle]}>
            <AnimatedLinearGradient
              colors={
                timerMode === 'study' 
                  ? ['#4f46e5', '#8b5cf6'] 
                  : ['#10b981', '#34d399']
              }
              style={styles.timerBackground}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.timerValue}>{formatTime(timeRemaining)}</Text>
            </AnimatedLinearGradient>
          </Animated.View>
          
          <View style={styles.timerControls}>
            <TouchableOpacity 
              style={[styles.timerButton, { backgroundColor: colors.card }]}
              onPress={resetTimer}
            >
              <RotateCcw size={24} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.timerPlayButton, 
                { backgroundColor: timerActive ? colors.error : colors.primary }
              ]}
              onPress={toggleTimer}
            >
              {timerActive ? (
                <Pause size={24} color="#fff" />
              ) : (
                <Play size={24} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <Animated.View 
              style={[
                styles.progressFill, 
                progressAnimatedStyle,
                { 
                  backgroundColor: timerMode === 'study' ? '#4f46e5' : '#10b981' 
                }
              ]}
            />
          </View>
        </View>
      </View>
      
      {/* Goals Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Target size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('goals')}
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setNewGoalTitle('');
              setNewGoalDeadline('');
              setEditingGoalId(null);
              setShowGoalModal(true);
            }}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {goals.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Target size={40} color={colors.text + '40'} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t('noGoals')}
            </Text>
            <TouchableOpacity 
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowGoalModal(true)}
            >
              <Text style={styles.emptyButtonText}>
                {t('createFirstGoal')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <View key={goal.id}>
                {renderGoalItem({ item: goal })}
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* Achievements Section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Award size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('achievements')}
          </Text>
          <TouchableOpacity 
            style={[styles.viewAllButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.viewAllText, { color: colors.text }]}>
              {t('viewAll')}
            </Text>
            <ChevronRight size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
        
        {achievements.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Award size={40} color={colors.text + '40'} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              {t('noAchievements')}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text + '80' }]}>
              {t('completeGoalsForAchievements')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={achievements}
            renderItem={renderAchievementItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsContainer}
          />
        )}
      </View>
      
      {/* Add Goal Modal */}
      <Modal
        visible={showGoalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingGoalId ? t('editGoal') : t('addNewGoal')}
              </Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowGoalModal(false)}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('goalTitle')}
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder={t('enterGoalTitle')}
                placeholderTextColor={colors.text + '60'}
                value={newGoalTitle}
                onChangeText={setNewGoalTitle}
              />
              
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                {t('deadline')} ({t('optional')})
              </Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder={t('enterDeadline')}
                placeholderTextColor={colors.text + '60'}
                value={newGoalDeadline}
                onChangeText={setNewGoalDeadline}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[
                  styles.cancelButton, 
                  { 
                    backgroundColor: 'transparent',
                    borderColor: colors.border
                  }
                ]}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  { 
                    backgroundColor: colors.primary,
                    opacity: newGoalTitle.trim() === '' ? 0.7 : 1
                  }
                ]}
                onPress={handleAddGoal}
                disabled={newGoalTitle.trim() === ''}
              >
                <Text style={styles.saveButtonText}>
                  {editingGoalId ? t('update') : t('add')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  quoteContainer: {
    backgroundColor: 'transparent',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    position: 'relative',
  },
  quoteText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    lineHeight: 26,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  quoteAuthor: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'right',
  },
  refreshButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginLeft: 10,
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  viewAllText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    marginRight: 5,
  },
  timerContainer: {
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  timerLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginBottom: 20,
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  timerBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 40,
    color: '#fff',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  timerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  timerPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  emptyContainer: {
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  emptyButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#fff',
  },
  goalsList: {
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  goalCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginBottom: 5,
  },
  goalDeadline: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  goalActions: {
    flexDirection: 'row',
  },
  goalActionButton: {
    padding: 5,
    marginLeft: 10,
  },
  achievementsContainer: {
    paddingVertical: 5,
  },
  achievementCard: {
    width: CARD_WIDTH,
    borderRadius: 15,
    padding: 20,
  },
  achievementIcon: {
    marginBottom: 15,
  },
  achievementTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#fff',
    marginBottom: 5,
  },
  achievementDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 15,
  },
  achievementDate: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginBottom: 10,
  },
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  saveButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#fff',
  },
});