import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';
import { Plus, Folder, Search, X, Save, Mic, FileText, MoveVertical as MoreVertical, CreditCard as Edit, Trash } from 'lucide-react-native';
import { getNotes, saveNote, deleteNote } from '@/utils/storageUtils';
import { Note } from '@/types';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function NotesScreen() {
  const { colors } = useTheme();
  const t = useTranslation();
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);

  // Animation values
  const searchBarWidth = useSharedValue(0);
  const fabScale = useSharedValue(1);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (searchQuery === '') {
      setFilteredNotes(notes);
    } else {
      const filtered = notes.filter(
        note =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  }, [searchQuery, notes]);

  const loadNotes = async () => {
    const savedNotes = await getNotes();
    setNotes(savedNotes);
    setFilteredNotes(savedNotes);
  };

  const toggleSearch = () => {
    if (showSearch) {
      searchBarWidth.value = withSpring(0);
      setSearchQuery('');
    } else {
      searchBarWidth.value = withSpring(1);
    }
    setShowSearch(!showSearch);
  };

  const onFabPress = () => {
    fabScale.value = withSpring(1.1, {}, () => {
      fabScale.value = withSpring(1);
    });
    setCurrentNote(null);
    setNoteTitle('');
    setNoteContent('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const handleSaveNote = async () => {
    if (noteTitle.trim() === '') {
      // Optionally, show an alert to the user
      return;
    }

    const newNote: Note = {
      id: currentNote?.id || Date.now().toString(),
      title: noteTitle,
      content: noteContent,
      createdAt: currentNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: currentNote?.tags || [] // Preserve tags if editing
    };

    await saveNote(newNote);
    await loadNotes();
    setModalVisible(false);
  };

  const handleDeleteNote = async (id: string) => {
    await deleteNote(id);
    await loadNotes();
    setOptionsModalVisible(false);
    setSelectedNoteId(null); // Clear selected note
  };

  const openNote = (note: Note) => {
    setCurrentNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setModalVisible(true);
  };

  const openOptionsModal = (id: string) => {
    setSelectedNoteId(id);
    setOptionsModalVisible(true);
  };

  const closeOptionsModal = () => {
    setOptionsModalVisible(false);
    setSelectedNoteId(null); // Clear selected note
  };

  const editNote = () => {
    if (selectedNoteId) {
      const note = notes.find(n => n.id === selectedNoteId);
      if (note) {
        openNote(note);
      }
    }
    setOptionsModalVisible(false);
  };

  // Animated styles
  const searchBarStyle = useAnimatedStyle(() => {
    return {
      width: `${searchBarWidth.value * 100}%`,
      opacity: searchBarWidth.value,
      overflow: 'hidden',
    };
  });

  const fabStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: fabScale.value }],
    };
  });

  const renderNoteItem = ({ item }: { item: Note }) => {
    const date = new Date(item.updatedAt);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    return (
      <AnimatedTouchable
        style={[
          styles.noteItem,
          { backgroundColor: colors.card }
        ]}
        onPress={() => openNote(item)}
        entering={FadeIn}
        exiting={FadeOut}
      >
        <View style={styles.noteHeader}>
          <View style={styles.noteIcon}>
            <FileText size={20} color={colors.primary} />
          </View>
          <Text
            style={[styles.noteTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(event) => {
              event.stopPropagation(); // Prevent triggering openNote
              openOptionsModal(item.id);
            }}
          >
            <MoreVertical size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text
          style={[styles.notePreview, { color: colors.text + '80' }]}
          numberOfLines={2}
        >
          {item.content}
        </Text>
        <Text style={[styles.noteDate, { color: colors.text + '60' }]}>
          {formattedDate}
        </Text>
      </AnimatedTouchable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Animated.View style={[styles.searchBarContainer, searchBarStyle]}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder={t('searchNotes')}
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchCloseButton} onPress={toggleSearch}>
            <X size={20} color={colors.text} />
          </TouchableOpacity>
        </Animated.View>

        {!showSearch && (
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
            <Search size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {filteredNotes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color={colors.text + '40'} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            {searchQuery ? t('noSearchResults') : t('noNotes')}
          </Text>
          {searchQuery ? (
            <TouchableOpacity
              style={[styles.clearSearchButton, { backgroundColor: colors.primary }]}
              onPress={() => setSearchQuery('')}
            >
              <Text style={[styles.clearSearchButtonText, { color: colors.buttonText }]}>
                {t('clearSearch')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.createFirstButton, { backgroundColor: colors.primary }]}
              onPress={onFabPress}
            >
              <Text style={[styles.createFirstButtonText, { color: colors.buttonText }]}>
                {t('createFirstNote')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notesList}
        />
      )}

      {!showSearch && (
        <AnimatedTouchable
          style={[
            styles.fab,
            fabStyle,
            { backgroundColor: colors.primary }
          ]}
          onPress={onFabPress}
        >
          <Plus size={24} color={colors.buttonText} />
        </AnimatedTouchable>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true} // Keep true, as modalContent will provide the background
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer} // This style will no longer have a semi-transparent background
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Use 'height' for Android
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveNote}
              >
                <Save size={20} color={colors.buttonText} />
                <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>{t('save')}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TextInput
                style={[styles.titleInput, { color: colors.text, borderBottomColor: colors.border }]}
                placeholder={t('noteTitle')}
                placeholderTextColor={colors.text + '60'}
                value={noteTitle}
                onChangeText={setNoteTitle}
              />

              <ScrollView 
                style={styles.contentScrollView}
                keyboardShouldPersistTaps="handled" // Good for text inputs in scrollviews
              >
                <TextInput
                  style={[styles.contentInput, { color: colors.text }]}
                  placeholder={t('startWriting')}
                  placeholderTextColor={colors.text + '60'}
                  value={noteContent}
                  onChangeText={setNoteContent}
                  multiline
                  textAlignVertical="top" // Ensures text starts from top in Android
                />
              </ScrollView>
            </View>

            {/* Removed editorToolbar for simplicity, can be re-added if features are implemented */}
            {/* <View style={[styles.editorToolbar, { borderTopColor: colors.border }]}>
              <TouchableOpacity style={styles.toolbarButton}>
                <Mic size={20} color={colors.text} />
              </TouchableOpacity>
            </View> */}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={optionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeOptionsModal}
      >
        <TouchableOpacity
          style={styles.optionsModalOverlay}
          activeOpacity={1}
          onPress={closeOptionsModal} // Close when tapping outside
        >
          <TouchableOpacity activeOpacity={1} onPress={() => { /* Prevent closing when tapping inside content */ }}>
            <View style={[styles.optionsModalContent, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.optionItem}
                onPress={editNote}
              >
                <Edit size={20} color={colors.text} />
                <Text style={[styles.optionText, { color: colors.text }]}>{t('edit')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => selectedNoteId && handleDeleteNote(selectedNoteId)}
              >
                <Trash size={20} color={colors.error} />
                <Text style={[styles.optionText, { color: colors.error }]}>{t('delete')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10, // Adjusted padding
    // paddingTop: 0, // Removed as paddingVertical handles it
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    fontFamily: 'Poppins-Regular',
    fontSize: 14, // Standardized font size
  },
  searchCloseButton: {
    position: 'absolute', // Keeps it correctly positioned
    right: 0, // Align to the right of the input field
    height: 40, // Match input height
    width: 40, // Make it a square tappable area
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButton: {
    padding: 8, // Slightly more padding for easier tap
    marginLeft: 10, // Space from where search bar would be
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  clearSearchButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearSearchButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  createFirstButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createFirstButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  notesList: {
    paddingHorizontal: 15,
    paddingBottom: 80, // Ensure space for FAB
  },
  noteItem: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000', // Basic shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  noteIcon: {
    marginRight: 10,
  },
  noteTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 17, // Slightly larger title
    flex: 1,
  },
  moreButton: {
    padding: 5, // Ensure tappable area
    marginLeft: 10,
  },
  notePreview: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20, // Improved readability
    marginBottom: 8,
  },
  noteDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  fab: {
    position: 'absolute',
    bottom: 25, // Standard FAB position
    right: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6, // Standard elevation for FAB
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContainer: {
    flex: 1,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)', // REMOVED for full screen effect
    // The modalContent will provide the background color from the theme
  },
  modalContent: {
    flex: 1,
    // paddingTop: Platform.OS === 'ios' ? 40 : 20, // Add padding for status bar if needed, or use SafeAreaView
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    // borderBottomWidth: 1, // Optional: add a separator
    // borderBottomColor: '#eee',
  },
  modalCloseButton: {
    padding: 8, // Larger tappable area
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  saveButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginLeft: 8, // Space between icon and text
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10, // Add some top padding
    paddingBottom: 15,
  },
  titleInput: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    paddingBottom: 10, // Space below title
    marginBottom: 10, // Space before content
    borderBottomWidth: 1,
    // borderBottomColor: '#eee', // Use theme color
  },
  contentScrollView: {
    flex: 1,
  },
  contentInput: {
    flex: 1, // Allow it to grow within ScrollView
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200, // Ensure a decent minimum height
    textAlignVertical: 'top', // Important for Android multiline
  },
  editorToolbar: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    // borderTopColor: '#eee', // Use theme color
  },
  toolbarButton: {
    padding: 10,
    marginRight: 10,
  },
  optionsModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  optionsModalContent: {
    width: 250, // Slightly wider for better text fit
    borderRadius: 10,
    paddingVertical: 5, // Add some vertical padding
    // backgroundColor: defined by theme
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // More vertical padding
    paddingHorizontal: 15,
  },
  optionText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginLeft: 15, // More space from icon
  },
});