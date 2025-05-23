import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, Goal, Achievement } from '@/types';

// Notes Storage
export const getNotes = async (): Promise<Note[]> => {
  try {
    const notesData = await AsyncStorage.getItem('studenthub_notes');
    return notesData ? JSON.parse(notesData) : [];
  } catch (error) {
    console.error('Error getting notes', error);
    return [];
  }
};

export const saveNote = async (note: Note): Promise<void> => {
  try {
    const notes = await getNotes();
    const noteIndex = notes.findIndex(n => n.id === note.id);
    
    if (noteIndex !== -1) {
      // Update existing note
      notes[noteIndex] = note;
    } else {
      // Add new note
      notes.push(note);
    }
    
    await AsyncStorage.setItem('studenthub_notes', JSON.stringify(notes));
  } catch (error) {
    console.error('Error saving note', error);
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const notes = await getNotes();
    const updatedNotes = notes.filter(note => note.id !== id);
    await AsyncStorage.setItem('studenthub_notes', JSON.stringify(updatedNotes));
  } catch (error) {
    console.error('Error deleting note', error);
  }
};

// Goals Storage
export const getGoals = async (): Promise<Goal[]> => {
  try {
    const goalsData = await AsyncStorage.getItem('studenthub_goals');
    return goalsData ? JSON.parse(goalsData) : [];
  } catch (error) {
    console.error('Error getting goals', error);
    return [];
  }
};

export const saveGoal = async (goal: Goal): Promise<void> => {
  try {
    const goals = await getGoals();
    goals.push(goal);
    await AsyncStorage.setItem('studenthub_goals', JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goal', error);
  }
};

export const updateGoal = async (goal: Goal): Promise<void> => {
  try {
    const goals = await getGoals();
    const goalIndex = goals.findIndex(g => g.id === goal.id);
    
    if (goalIndex !== -1) {
      goals[goalIndex] = goal;
      await AsyncStorage.setItem('studenthub_goals', JSON.stringify(goals));
    }
  } catch (error) {
    console.error('Error updating goal', error);
  }
};

export const deleteGoal = async (id: string): Promise<void> => {
  try {
    const goals = await getGoals();
    const updatedGoals = goals.filter(goal => goal.id !== id);
    await AsyncStorage.setItem('studenthub_goals', JSON.stringify(updatedGoals));
  } catch (error) {
    console.error('Error deleting goal', error);
  }
};

// Achievements Storage
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const achievementsData = await AsyncStorage.getItem('studenthub_achievements');
    return achievementsData ? JSON.parse(achievementsData) : [];
  } catch (error) {
    console.error('Error getting achievements', error);
    return [];
  }
};

export const saveAchievement = async (achievement: Achievement): Promise<void> => {
  try {
    const achievements = await getAchievements();
    achievements.push(achievement);
    await AsyncStorage.setItem('studenthub_achievements', JSON.stringify(achievements));
  } catch (error) {
    console.error('Error saving achievement', error);
  }
};

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    const keys = [
      'studenthub_notes',
      'studenthub_goals',
      'studenthub_achievements'
    ];
    
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Error clearing data', error);
  }
};