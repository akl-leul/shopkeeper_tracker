import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
  Platform // Added Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate } from 'react-native-reanimated';
import { Play, Pause, SkipBack, SkipForward, Music, Video, X, Volume2, List } from 'lucide-react-native'; // Removed Plus, MoreVertical as they are not used
import { LinearGradient } from 'expo-linear-gradient';
import { sampleMediaData } from '@/data/mediaData';
import { getThumbnailForVideo } from '@/utils/mediaUtils';
import { Audio } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window'); // Added SCREEN_HEIGHT

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export default function MediaScreen() {
  const { colors, theme } = useTheme();
  const t = useTranslation();
  const [activeTab, setActiveTab] = useState<'audio' | 'video'>('audio');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayerModal, setShowPlayerModal] = useState(false); // For audio player
  const [showVideoModal, setShowVideoModal] = useState(false); // For video player
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  // Animation values
  const playerPosition = useSharedValue(0); // For mini audio player
  // const miniPlayerHeight = 60; // Defined in styles
  const playerModalAnimation = useSharedValue(0); // For full audio player modal

  // Audio player reference
  const soundRef = useRef<Audio.Sound | null>(null);

  // Cleanup sound object on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Handle audio loading and playback based on selectedMedia and activeTab
  useEffect(() => {
    const loadAudio = async () => {
      // Check if selectedMedia is an audio item (has 'artist' property as a heuristic) and audio tab is active
      if (selectedMedia && activeTab === 'audio' && typeof selectedMedia.artist !== 'undefined') {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          setPlaybackTime(0);
          setPlaybackDuration(0);
          // isPlaying will be updated by onPlaybackStatusUpdate or explicitly
        }

        try {
          console.log(`Loading audio: ${selectedMedia.title} from ${selectedMedia.url}`);
          const { sound, status } = await Audio.Sound.createAsync(
            { uri: selectedMedia.url },
            { shouldPlay: true }, // Start playing immediately
            onPlaybackStatusUpdate
          );

          soundRef.current = sound;
          // @ts-ignore
          if (status.isLoaded) {
            // @ts-ignore
            setIsPlaying(status.isPlaying);
            // @ts-ignore
            setPlaybackDuration(status.durationMillis || 0);
          } else {
            setIsPlaying(true); // Fallback if status doesn't immediately confirm
          }
          playerPosition.value = withSpring(1); // Show mini player
        } catch (error) {
          console.error('Error loading audio:', error);
          setIsPlaying(false);
          playerPosition.value = withSpring(0); // Hide mini player on error
        }
      } else if (activeTab !== 'audio' && soundRef.current && isPlaying) {
        // If not on audio tab but audio is playing, pause it (also handled in tab change, but good for safety)
        await soundRef.current.pauseAsync();
      }
    };

    loadAudio();
  }, [selectedMedia, activeTab]); // Rerun when selectedMedia or activeTab changes

  const onPlaybackStatusUpdate = (status: Audio.AVPlaybackStatus) => {
    if (status.isLoaded) {
      setPlaybackTime(status.positionMillis);
      setPlaybackDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackTime(0);
        if (soundRef.current) {
          soundRef.current.setPositionAsync(0);
          soundRef.current.pauseAsync(); // Ensure it's paused
        }
      }
    } else {
      // Handle errors like playback becoming impossible
      if (status.error) {
        console.error(`Playback Error: ${status.error}`);
        setIsPlaying(false);
        // Optionally close the player or show an error message
        if (playerPosition.value === 1 && activeTab === 'audio') { // If mini player was visible for audio
            closePlayer(); // Fully close the audio player
        }
      }
    }
  };

  const togglePlay = async () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const formatTime = (millis: number) => {
    if (isNaN(millis) || millis < 0) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleTabChange = (newTab: 'audio' | 'video') => {
    if (newTab === 'video') { // Switching TO video tab
      if (soundRef.current) {
        closePlayer(); // Stop and unload audio, hide mini-player
      }
    } else { // Switching TO audio tab
      if (showVideoModal) {
        closeVideoModal(); // Close video player modal
      }
    }
    setActiveTab(newTab);
  };

  const selectAudioItem = (item: any) => {
    if (showVideoModal) closeVideoModal(); // Close video if it was open
    setSelectedMedia(item); // useEffect will handle loading
    // Mini player will appear via playerPosition.value update in useEffect
  };

  const selectVideoItem = (item: any) => {
    if (soundRef.current) closePlayer(); // Stop audio if it was playing
    setSelectedMedia(item);
    setShowVideoModal(true);
  };

  const closePlayer = async () => { // For audio mini-player
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    // setSelectedMedia(null); // Clearing this might be too aggressive if user just wants to pause/hide
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    playerPosition.value = withSpring(0); // Hide mini-player
    if (showPlayerModal) { // If full player modal was open, close it too
        closePlayerModal();
    }
  };
  
  const closeVideoModal = () => {
    setShowVideoModal(false);
    // setSelectedMedia(null); // Optional: clear media selection when video modal closes
  };

  const openPlayerModal = () => { // Open full audio player
    playerModalAnimation.value = withSpring(1);
    setShowPlayerModal(true);
  };

  const closePlayerModal = () => { // Close full audio player
    playerModalAnimation.value = withSpring(0);
    setTimeout(() => setShowPlayerModal(false), 300); // Allow animation to finish
  };

  const playerAnimatedStyle = useAnimatedStyle(() => { // For mini audio player
    return {
      transform: [{ translateY: interpolate(playerPosition.value, [0, 1], [100, 0]) }],
      opacity: playerPosition.value,
      height: playerPosition.value === 0 ? 0 : styles.miniPlayer.height, // Collapse height when hidden
      overflow: 'hidden',
    };
  });

  const modalAnimatedStyle = useAnimatedStyle(() => { // For full audio player modal
    return {
      transform: [{
        translateY: interpolate(playerModalAnimation.value, [0, 1], [SCREEN_HEIGHT, 0]) // Corrected to SCREEN_HEIGHT
      }],
    };
  });

  const renderAudioItem = ({ item }: { item: any }) => {
    const isActive = selectedMedia && selectedMedia.id === item.id && activeTab === 'audio';
    return (
      <TouchableOpacity
        style={[styles.mediaItem, { backgroundColor: colors.card }]}
        onPress={() => selectAudioItem(item)}
      >
        <View
          style={[
            styles.audioImageContainer,
            {
              backgroundColor: isActive ? colors.primary + '20' : colors.card,
              borderColor: isActive ? colors.primary : colors.border
            }
          ]}
        >
          <Music size={24} color={isActive ? colors.primary : colors.text} />
        </View>
        <View style={styles.mediaInfo}>
          <Text style={[styles.mediaTitle, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.mediaArtist, { color: colors.text + '80' }]} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>
        <Text style={[styles.mediaDuration, { color: colors.text + '60' }]}>
          {item.duration}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderVideoItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles.videoItemContainer} // Use a container for better structure
        onPress={() => selectVideoItem(item)}
      >
        <Image
          source={{ uri: getThumbnailForVideo(item.url) }}
          style={styles.videoThumbnail}
          resizeMode="cover"
        />
        <View style={[styles.videoInfo, {backgroundColor: colors.card + 'B3'}]}> {/* Semi-transparent overlay */}
          <Text style={[styles.videoTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.videoDuration, { color: colors.text + '80' }]}>
            {item.duration}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        {/* Tabs ... */}
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'audio' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('audio')}
        >
          <Music size={20} color={activeTab === 'audio' ? colors.primary : colors.text} />
          <Text style={[styles.tabText, { color: activeTab === 'audio' ? colors.primary : colors.text }]}>
            {t('audio')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'video' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }
          ]}
          onPress={() => handleTabChange('video')}
        >
          <Video size={20} color={activeTab === 'video' ? colors.primary : colors.text} />
          <Text style={[styles.tabText, { color: activeTab === 'video' ? colors.primary : colors.text }]}>
            {t('video')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'audio' ? (
          <FlatList
            data={sampleMediaData.audio}
            renderItem={renderAudioItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <FlatList
            data={sampleMediaData.video}
            renderItem={renderVideoItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.gridContent}
            numColumns={2}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Mini Audio Player */}
      {selectedMedia && activeTab === 'audio' && typeof selectedMedia.artist !== 'undefined' && ( // Ensure it's an audio item
        <Animated.View
          style={[
            styles.miniPlayer,
            playerAnimatedStyle,
            { backgroundColor: colors.card, borderTopColor: colors.border }
          ]}
        >
          <TouchableOpacity style={styles.miniPlayerContent} onPress={openPlayerModal}>
            <View style={styles.miniPlayerInfo}>
              <Text style={[styles.miniPlayerTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedMedia.title}
              </Text>
              <Text style={[styles.miniPlayerArtist, { color: colors.text + '80' }]} numberOfLines={1}>
                {selectedMedia.artist}
              </Text>
            </View>
            <View style={styles.miniPlayerControls}>
              <TouchableOpacity style={styles.miniPlayerButton} onPress={togglePlay}>
                {isPlaying ? <Pause size={24} color={colors.primary} /> : <Play size={24} color={colors.primary} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniPlayerButton} onPress={closePlayer}>
                <X size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
          <View style={[styles.progressBarContainer, { backgroundColor: colors.border }]}>
            <View style={[styles.progressBar, { width: `${playbackDuration ? (playbackTime / playbackDuration) * 100 : 0}%`, backgroundColor: colors.primary }]} />
          </View>
        </Animated.View>
      )}
      
      {/* Video Player Modal */}
      <Modal
        visible={showVideoModal && selectedMedia && activeTab === 'video'}
        transparent={false} // Opaque full-screen modal
        animationType="slide"
        onRequestClose={closeVideoModal}
      >
        <View style={[styles.videoModalContainer, { backgroundColor: '#000' }]}>
           <View style={[styles.videoModalHeader, { backgroundColor: colors.background } ]}>
            <Text style={[styles.videoModalTitle, { color: colors.text }]} numberOfLines={1}>
              {selectedMedia?.title}
            </Text>
            <TouchableOpacity onPress={closeVideoModal} style={styles.closeModalButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <WebView
            style={styles.videoPlayerWebView}
            source={{ uri: selectedMedia?.url }}
            allowsFullscreenVideo={true}
            // For some video embeds, these might be useful:
            // javaScriptEnabled={true}
            // domStorageEnabled={true}
          />
        </View>
      </Modal>

      {/* Full Audio Player Modal */}
      <Modal
        visible={showPlayerModal}
        transparent={true} // Modal itself is transparent, content provides background
        animationType="none" // Using reanimated for animation
        onRequestClose={closePlayerModal}
      >
        <Animated.View style={[styles.playerModalBase, modalAnimatedStyle]}>
          <AnimatedLinearGradient
            colors={theme === 'dark' ? ['#1a1a1a', '#000000'] : ['#f5f5f5', '#e0e0e0']}
            style={styles.playerBackground}
          >
            {/* Header */}
            <View style={styles.playerHeader}>
              <TouchableOpacity style={styles.closeModalButton} onPress={closePlayerModal}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.playerNowPlaying, {color: colors.text}]}>{t('nowPlaying')}</Text>
              <TouchableOpacity style={styles.playlistButton}>
                <List size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Album Art */}
            <View style={styles.albumArtContainer}>
              <View style={[styles.albumArt, { backgroundColor: colors.primary + '20' }]}>
                <Music size={80} color={colors.primary} />
              </View>
            </View>

            {/* Track Info */}
            <View style={styles.trackInfoContainer}>
              <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={2}>
                {selectedMedia?.title}
              </Text>
              <Text style={[styles.trackArtist, { color: colors.text + '80' }]}>
                {selectedMedia?.artist}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainerModal}>
              <View style={styles.timeInfo}>
                <Text style={[styles.timeText, { color: colors.text + '80' }]}>{formatTime(playbackTime)}</Text>
                <Text style={[styles.timeText, { color: colors.text + '80' }]}>{formatTime(playbackDuration)}</Text>
              </View>
              <View style={[styles.seekBar, { backgroundColor: colors.border + '80' }]}>
                <View style={[styles.seekBarProgress, { width: `${playbackDuration ? (playbackTime / playbackDuration) * 100 : 0}%`, backgroundColor: colors.primary }]}/>
                {/* Simple thumb, draggable seek bar is more complex */}
                <View style={[styles.seekBarThumb, { left: `${playbackDuration ? (playbackTime / playbackDuration) * 100 : 0}%`, backgroundColor: colors.primary }]}/>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.controlButton}>
                <SkipBack size={30} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.playPauseButton, { backgroundColor: colors.primary }]} onPress={togglePlay}>
                {isPlaying ? <Pause size={30} color={theme === 'dark' ? '#000' : '#fff'} /> : <Play size={30} color={theme === 'dark' ? '#000' : '#fff'} />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlButton}>
                <SkipForward size={30} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Volume (Conceptual, actual volume control needs more) */}
            <View style={styles.volumeContainer}>
              <Volume2 size={20} color={colors.text + 'A0'} />
              <View style={[styles.volumeBar, { backgroundColor: colors.border + '80' }]}>
                <View style={[styles.volumeLevel, { width: '70%', backgroundColor: colors.primary }]} />
              </View>
            </View>
          </AnimatedLinearGradient>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    // borderBottomColor set by theme
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  tabText: {
    marginLeft: 8,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 60, // Space for mini-player if it appears
  },
  listContent: {
    padding: 15,
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  mediaItem: { // For Audio List
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  audioImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8, // Slightly squarer
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  mediaInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  mediaTitle: {
    fontFamily: 'Poppins-SemiBold', // Bolder
    fontSize: 16,
  },
  mediaArtist: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  mediaDuration: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    marginLeft: 10,
  },
  videoItemContainer: { // For Video Grid
    flex: 1/2, // For 2 columns
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 16 / 9, // Maintain aspect ratio for the container
    position: 'relative', // For overlaying info
  },
  videoThumbnail: {
    ...StyleSheet.absoluteFillObject, // Fill the container
    width: undefined, // Required for absoluteFillObject with Image
    height: undefined, // Required for absoluteFillObject with Image
  },
  videoInfo: { // Overlay on video thumbnail
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    // backgroundColor: 'rgba(0,0,0,0.5)', // Or use theme color with opacity
  },
  videoTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    marginBottom: 2,
  },
  videoDuration: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
  },
  miniPlayer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Fixed height
    borderTopWidth: 1,
    // borderTopColor set by theme
    // backgroundColor set by theme
  },
  miniPlayerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  miniPlayerInfo: {
    flex: 1,
    marginRight: 10,
  },
  miniPlayerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  miniPlayerArtist: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  miniPlayerControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniPlayerButton: {
    padding: 8,
    marginLeft: 8,
  },
  progressBarContainer: {
    height: 2,
    width: '100%',
  },
  progressBar: {
    height: '100%',
  },
  // Video Modal Styles
  videoModalContainer: {
    flex: 1,
    // backgroundColor: '#000', // Set inline
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: Platform.OS === 'ios' ? 44 : 10, // Basic status bar handling
    // backgroundColor: set by theme
  },
  videoModalTitle: {
    flex: 1,
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    marginRight: 10,
  },
  videoPlayerWebView: {
    flex: 1,
    backgroundColor: '#000', // Fallback background for WebView area
  },
  // Full Audio Player Modal Styles
  playerModalBase: { // Outer container for Animated.View
    flex: 1,
    // This view will be translated by modalAnimatedStyle
  },
  playerBackground: { // The LinearGradient
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // More top padding for status bar + header
    paddingHorizontal: 20,
    paddingBottom: 20, // Padding at the bottom
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30, // Space below header
  },
  playerNowPlaying: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  closeModalButton: { // Reusable for both modals
    padding: 8,
  },
  playlistButton: {
    padding: 8,
  },
  albumArtContainer: { 
    marginVertical: 20, // Dynamic spacing
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
     width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    borderRadius: 12, // Rectangular album art is common
    justifyContent: 'center',
    alignItems: 'centerr',
  },
  albumArt: {
    width: SCREEN_WIDTH * 0.65,
    height: SCREEN_WIDTH * 0.65,
    borderRadius: 12, // Rectangular album art is common
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor set by theme
  },
  trackInfoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  trackTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  trackArtist: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainerModal: { // Renamed to avoid conflict
    marginVertical: 20,
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
  },
  seekBar: {
    height: 6, // Thicker seek bar
    borderRadius: 3,
    // backgroundColor set by theme
    justifyContent: 'center', // For thumb alignment
  },
  seekBarProgress: {
    height: '100%',
    borderRadius: 3,
  },
  seekBarThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    // backgroundColor set by theme
    position: 'absolute',
    // left is set by inline style based on progress
    marginLeft: -7, // Half of width to center
    elevation: 2, // Little shadow for thumb
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Better spacing for 3 buttons
    alignItems: 'center',
    marginVertical: 20,
  },
  controlButton: { // For skip back/forward
    padding: 21,
  },
  playPauseButton: { // For main play/pause
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor set by theme
    elevation: 5,
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10, // Space from controls
    opacity: 0.8, // Volume is often less prominent
  },
  volumeBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    marginLeft: 10,
    // backgroundColor set by theme
  },
  volumeLevel: {
    height: '100%',
    borderRadius: 2,
    // backgroundColor set by theme
  },
});