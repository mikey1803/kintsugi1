// screens/MindfulActivitiesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import GamificationSystem from '../utils/GamificationSystem';
import GamificationWidget from '../components/GamificationWidget';

const MindfulActivitiesScreen = () => {
  const [currentMood, setCurrentMood] = useState(null);
  const [activeActivity, setActiveActivity] = useState(null);
  const [gratitudeText, setGratitudeText] = useState('');
  const [breathCount, setBreathCount] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [completedActivities, setCompletedActivities] = useState(new Set());
  const [gamificationKey, setGamificationKey] = useState(0);

  const moods = [
    { id: 'good', label: 'Good', emoji: '😊', color: '#4CAF50' },
    { id: 'okay', label: 'Okay', emoji: '🙂', color: '#2196F3' },
    { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#9E9E9E' },
    { id: 'sad', label: 'Sad', emoji: '😢', color: '#FF9800' },
    { id: 'angry', label: 'Angry', emoji: '😠', color: '#F44336' },
  ];

  const activities = {
    good: [
      { 
        id: 'gratitude', 
        title: 'Gratitude Journal', 
        emoji: '✨', 
        description: 'Write down 3 things you\'re grateful for today',
        color: '#FFD700'
      },
      { 
        id: 'positive-reflection', 
        title: 'Positive Reflection', 
        emoji: '🌟', 
        description: 'Reflect on something that made you smile today',
        color: '#FFA500'
      },
    ],
    okay: [
      { 
        id: 'motivational-quiz', 
        title: 'Motivational Quiz', 
        emoji: '💪', 
        description: 'Take a quick quiz to boost your confidence',
        color: '#9C27B0'
      },
      { 
        id: 'visualization', 
        title: 'Positive Visualization', 
        emoji: '🌈', 
        description: 'Imagine your best day - where are you? What are you doing?',
        color: '#E91E63'
      },
    ],
    neutral: [
      { 
        id: 'focus-puzzle', 
        title: 'Focus Challenge', 
        emoji: '🧩', 
        description: 'Count backwards from 100 by 7s to center yourself',
        color: '#607D8B'
      },
      { 
        id: 'mindfulness-timer', 
        title: 'Mindfulness Timer', 
        emoji: '⏱️', 
        description: 'Set a timer and practice being present',
        color: '#00BCD4'
      },
    ],
    sad: [
      { 
        id: 'uplifting-music', 
        title: 'Uplifting Music', 
        emoji: '🎵', 
        description: 'Listen to songs that lift your spirits',
        color: '#FF6B9D'
      },
      { 
        id: 'guided-relaxation', 
        title: 'Guided Relaxation', 
        emoji: '🧘', 
        description: 'Follow a calming relaxation exercise',
        color: '#9C27B0'
      },
    ],
    angry: [
      { 
        id: 'breathing-exercise', 
        title: 'Breathing Exercise', 
        emoji: '🌬️', 
        description: 'Practice 4-7-8 breathing to calm down',
        color: '#FF5722'
      },
      { 
        id: 'grounding-activity', 
        title: 'Grounding Activity', 
        emoji: '🌿', 
        description: 'Use the 5-4-3-2-1 technique to ground yourself',
        color: '#4CAF50'
      },
    ],
  };

  useEffect(() => {
    loadRecentMood();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const loadRecentMood = async () => {
    try {
      const moodsQuery = query(
        collection(db, 'moods'),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(moodsQuery);
      if (!snapshot.empty) {
        const recentMood = snapshot.docs[0].data().mood;
        const matchingMood = moods.find(m => m.label.toLowerCase() === recentMood.toLowerCase());
        if (matchingMood) {
          setCurrentMood(matchingMood.id);
        }
      }
    } catch (error) {
      console.log('Could not load recent mood:', error);
    }
  };

  const startBreathingAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleMoodSelect = (moodId) => {
    setCurrentMood(moodId);
    setActiveActivity(null);
  };

  const handleActivitySelect = (activity) => {
    setActiveActivity(activity);
    if (activity.id === 'breathing-exercise') {
      startBreathingAnimation();
    }
    // Points will be awarded on completion, not on selection
  };

  const awardActivityPoints = async (activityId, pointType) => {
    // Create unique key for this activity instance
    const activityKey = `${activityId}_${Date.now()}`;
    
    if (completedActivities.has(activityKey)) {
      return; // Already awarded
    }

    try {
      const reward = await GamificationSystem.awardPoints(pointType);
      setCompletedActivities(prev => new Set([...prev, activityKey]));
      setGamificationKey(prev => prev + 1); // Force widget refresh
      
      if (reward.pointsAwarded > 0) {
        let message = `+${reward.pointsAwarded} points earned!`;
        if (reward.streakBonus > 0) {
          message += `\n🔥 +${reward.streakBonus} streak bonus!`;
        }
        if (reward.newBadges && reward.newBadges.length > 0) {
          message += `\n\n🏆 New badge: ${reward.newBadges[0].emoji} ${reward.newBadges[0].name}!`;
        }
        if (reward.newLevel) {
          message += `\n\n⭐ Level ${reward.newLevel}!`;
        }
        Alert.alert('Great Job! ⭐', message);
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const saveGratitude = async () => {
    if (gratitudeText.trim()) {
      try {
        await addDoc(collection(db, 'gratitude'), {
          text: gratitudeText.trim(),
          timestamp: new Date(),
        });
        
        // Award points once
        await awardActivityPoints('gratitude_current', 'GRATITUDE_JOURNAL');
        
        setGratitudeText('');
      } catch (error) {
        Alert.alert('Saved Locally! 💾', 'Your gratitude is recorded in your heart.');
      }
    }
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSelector}>
      <Text style={styles.sectionTitle}>How are you feeling right now?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.id}
            style={[
              styles.moodButton,
              { borderColor: mood.color },
              currentMood === mood.id && { backgroundColor: mood.color, borderWidth: 3 }
            ]}
            onPress={() => handleMoodSelect(mood.id)}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={[
              styles.moodLabel,
              currentMood === mood.id && { color: '#FFF', fontWeight: 'bold' }
            ]}>
              {mood.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderActivityCards = () => {
    if (!currentMood) return null;

    return (
      <View style={styles.activitiesSection}>
        <Text style={styles.sectionTitle}>
          Activities for you right now 🌸
        </Text>
        {activities[currentMood].map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[styles.activityCard, { borderLeftColor: activity.color, borderLeftWidth: 5 }]}
            onPress={() => handleActivitySelect(activity)}
          >
            <View style={styles.activityHeader}>
              <Text style={styles.activityEmoji}>{activity.emoji}</Text>
              <Text style={styles.activityTitle}>{activity.title}</Text>
            </View>
            <Text style={styles.activityDescription}>{activity.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderGratitudeJournal = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>✨ Gratitude Journal</Text>
      <Text style={styles.activityContentText}>
        What are you grateful for today? Write it down:
      </Text>
      <TextInput
        style={styles.gratitudeInput}
        multiline
        numberOfLines={4}
        placeholder="I'm grateful for..."
        placeholderTextColor="#999"
        value={gratitudeText}
        onChangeText={setGratitudeText}
      />
      <TouchableOpacity style={styles.saveButton} onPress={saveGratitude}>
        <Text style={styles.saveButtonText}>Save Gratitude ✨</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderBreathingExercise = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🌬️ 4-7-8 Breathing</Text>
      <Text style={styles.activityContentText}>
        Follow this pattern to calm your mind:
      </Text>
      
      <View style={styles.breathingCircleContainer}>
        <Animated.View 
          style={[
            styles.breathingCircle,
            { transform: [{ scale: pulseAnim }] }
          ]}
        >
          <Text style={styles.breathingText}>Breathe</Text>
        </Animated.View>
      </View>

      <View style={styles.breathingSteps}>
        <View style={styles.breathingStep}>
          <Text style={styles.stepNumber}>1.</Text>
          <Text style={styles.stepText}>Breathe in through nose (4 seconds)</Text>
        </View>
        <View style={styles.breathingStep}>
          <Text style={styles.stepNumber}>2.</Text>
          <Text style={styles.stepText}>Hold your breath (7 seconds)</Text>
        </View>
        <View style={styles.breathingStep}>
          <Text style={styles.stepNumber}>3.</Text>
          <Text style={styles.stepText}>Exhale through mouth (8 seconds)</Text>
        </View>
      </View>

      <View style={styles.breathCounter}>
        <Text style={styles.breathCountText}>Breaths completed: {breathCount}</Text>
        <TouchableOpacity 
          style={styles.breathButton}
          onPress={async () => {
            const newCount = breathCount + 1;
            setBreathCount(newCount);
            
            // Award points after completing 3 breaths
            if (newCount === 3 && !completedActivities.has('breathing_current')) {
              await awardActivityPoints('breathing_current', 'BREATHING_EXERCISE');
            }
          }}
        >
          <Text style={styles.breathButtonText}>Complete Breath ✓</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMindfulnessTimer = () => {
    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    return (
      <View style={styles.activityContent}>
        <Text style={styles.activityContentTitle}>⏱️ Mindfulness Timer</Text>
        <Text style={styles.activityContentText}>
          Take a moment to be present. Focus on your breath.
        </Text>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>

        <View style={styles.timerControls}>
          <TouchableOpacity 
            style={[styles.timerButton, isTimerRunning && styles.timerButtonActive]}
            onPress={() => setIsTimerRunning(!isTimerRunning)}
          >
            <Text style={styles.timerButtonText}>
              {isTimerRunning ? '⏸ Pause' : '▶ Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.timerButton}
            onPress={() => {
              setIsTimerRunning(false);
              setTimerSeconds(0);
            }}
          >
            <Text style={styles.timerButtonText}>↻ Reset</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setActiveActivity(null)}
        >
          <Text style={styles.backButtonText}>← Back to Activities</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderGroundingActivity = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🌿 5-4-3-2-1 Grounding</Text>
      <Text style={styles.activityContentText}>
        Use your senses to ground yourself in the present moment:
      </Text>

      <View style={styles.groundingSteps}>
        <View style={styles.groundingStep}>
          <Text style={styles.groundingNumber}>5️⃣</Text>
          <Text style={styles.groundingText}>
            Name <Text style={styles.bold}>5 things</Text> you can see around you
          </Text>
        </View>
        <View style={styles.groundingStep}>
          <Text style={styles.groundingNumber}>4️⃣</Text>
          <Text style={styles.groundingText}>
            Name <Text style={styles.bold}>4 things</Text> you can touch
          </Text>
        </View>
        <View style={styles.groundingStep}>
          <Text style={styles.groundingNumber}>3️⃣</Text>
          <Text style={styles.groundingText}>
            Name <Text style={styles.bold}>3 things</Text> you can hear
          </Text>
        </View>
        <View style={styles.groundingStep}>
          <Text style={styles.groundingNumber}>2️⃣</Text>
          <Text style={styles.groundingText}>
            Name <Text style={styles.bold}>2 things</Text> you can smell
          </Text>
        </View>
        <View style={styles.groundingStep}>
          <Text style={styles.groundingNumber}>1️⃣</Text>
          <Text style={styles.groundingText}>
            Name <Text style={styles.bold}>1 thing</Text> you can taste
          </Text>
        </View>
      </View>

      <View style={styles.groundingNote}>
        <Text style={styles.groundingNoteText}>
          💡 This technique helps bring you back to the present when feeling overwhelmed
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMotivationalQuiz = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>💪 Motivational Quiz</Text>
      <Text style={styles.activityContentText}>
        Quick confidence boosters:
      </Text>

      <View style={styles.quizContainer}>
        <View style={styles.quizItem}>
          <Text style={styles.quizQuestion}>What's one thing you did well today?</Text>
          <TextInput
            style={styles.quizInput}
            placeholder="Type your answer..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.quizItem}>
          <Text style={styles.quizQuestion}>What skill are you proud of?</Text>
          <TextInput
            style={styles.quizInput}
            placeholder="Type your answer..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.quizItem}>
          <Text style={styles.quizQuestion}>What challenge have you overcome?</Text>
          <TextInput
            style={styles.quizInput}
            placeholder="Type your answer..."
            placeholderTextColor="#999"
            multiline
          />
        </View>

        <View style={styles.motivationalMessage}>
          <Text style={styles.motivationalText}>
            💫 You're stronger than you think! Every answer shows your resilience.
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVisualization = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🌈 Positive Visualization</Text>
      <Text style={styles.activityContentText}>
        Close your eyes and imagine your perfect day:
      </Text>

      <View style={styles.visualizationGuide}>
        <View style={styles.visualizationStep}>
          <Text style={styles.visualizationNumber}>☀️</Text>
          <Text style={styles.visualizationText}>
            <Text style={styles.bold}>Morning:</Text> Where do you wake up? How do you feel?
          </Text>
        </View>

        <View style={styles.visualizationStep}>
          <Text style={styles.visualizationNumber}>🌤️</Text>
          <Text style={styles.visualizationText}>
            <Text style={styles.bold}>Afternoon:</Text> What are you doing? Who are you with?
          </Text>
        </View>

        <View style={styles.visualizationStep}>
          <Text style={styles.visualizationNumber}>🌙</Text>
          <Text style={styles.visualizationText}>
            <Text style={styles.bold}>Evening:</Text> How does your day end? What made it perfect?
          </Text>
        </View>
      </View>

      <View style={styles.visualizationNote}>
        <Text style={styles.visualizationNoteText}>
          💭 Take 5 deep breaths while imagining this scene in vivid detail
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFocusPuzzle = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🧩 Focus Challenge</Text>
      <Text style={styles.activityContentText}>
        Let's center your mind with a simple exercise:
      </Text>

      <View style={styles.puzzleContainer}>
        <View style={styles.puzzleCard}>
          <Text style={styles.puzzleTitle}>Count Backwards Challenge</Text>
          <Text style={styles.puzzleInstruction}>
            Start at 100, count backwards by 7s
          </Text>
          <Text style={styles.puzzleExample}>
            100 → 93 → 86 → 79 → ...
          </Text>
          <Text style={styles.puzzleNote}>
            Focus completely on each number. If you lose track, start over!
          </Text>
        </View>

        <View style={styles.puzzleCard}>
          <Text style={styles.puzzleTitle}>Alphabet Game</Text>
          <Text style={styles.puzzleInstruction}>
            Name a fruit or vegetable for each letter A-Z
          </Text>
          <Text style={styles.puzzleExample}>
            Apple, Banana, Carrot, Date...
          </Text>
        </View>

        <View style={styles.puzzleCard}>
          <Text style={styles.puzzleTitle}>3-3-3 Rule</Text>
          <Text style={styles.puzzleInstruction}>
            Name 3 things you see, 3 sounds you hear, and move 3 body parts
          </Text>
          <Text style={styles.puzzleNote}>
            This helps bring you into the present moment
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderUpliftingMusic = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🎵 Uplifting Music</Text>
      <Text style={styles.activityContentText}>
        Music can shift your mood. Try these feel-good genres:
      </Text>

      <View style={styles.musicGenres}>
        <TouchableOpacity style={[styles.genreCard, { backgroundColor: '#FF6B9D' }]}>
          <Text style={styles.genreEmoji}>🎸</Text>
          <Text style={styles.genreText}>Upbeat Pop</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.genreCard, { backgroundColor: '#9C27B0' }]}>
          <Text style={styles.genreEmoji}>🎹</Text>
          <Text style={styles.genreText}>Feel-Good Classics</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.genreCard, { backgroundColor: '#2196F3' }]}>
          <Text style={styles.genreEmoji}>🎺</Text>
          <Text style={styles.genreText}>Jazzy & Smooth</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.genreCard, { backgroundColor: '#4CAF50' }]}>
          <Text style={styles.genreEmoji}>🎤</Text>
          <Text style={styles.genreText}>Motivational</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.musicTip}>
        <Text style={styles.musicTipText}>
          💡 Tip: Put on your favorite song and dance it out! Movement + music = mood boost
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGuidedRelaxation = () => (
    <View style={styles.activityContent}>
      <Text style={styles.activityContentTitle}>🧘 Guided Relaxation</Text>
      <Text style={styles.activityContentText}>
        Follow this simple body scan to release tension:
      </Text>

      <View style={styles.relaxationSteps}>
        <View style={styles.relaxationStep}>
          <Text style={styles.relaxationNumber}>1️⃣</Text>
          <View style={styles.relaxationContent}>
            <Text style={styles.relaxationTitle}>Find a comfortable position</Text>
            <Text style={styles.relaxationText}>Sit or lie down, close your eyes</Text>
          </View>
        </View>

        <View style={styles.relaxationStep}>
          <Text style={styles.relaxationNumber}>2️⃣</Text>
          <View style={styles.relaxationContent}>
            <Text style={styles.relaxationTitle}>Start with your toes</Text>
            <Text style={styles.relaxationText}>Tense them for 5 seconds, then release</Text>
          </View>
        </View>

        <View style={styles.relaxationStep}>
          <Text style={styles.relaxationNumber}>3️⃣</Text>
          <View style={styles.relaxationContent}>
            <Text style={styles.relaxationTitle}>Move upward</Text>
            <Text style={styles.relaxationText}>Calves → Thighs → Stomach → Chest</Text>
          </View>
        </View>

        <View style={styles.relaxationStep}>
          <Text style={styles.relaxationNumber}>4️⃣</Text>
          <View style={styles.relaxationContent}>
            <Text style={styles.relaxationTitle}>Arms and hands</Text>
            <Text style={styles.relaxationText}>Clench fists, hold, release</Text>
          </View>
        </View>

        <View style={styles.relaxationStep}>
          <Text style={styles.relaxationNumber}>5️⃣</Text>
          <View style={styles.relaxationContent}>
            <Text style={styles.relaxationTitle}>Face and jaw</Text>
            <Text style={styles.relaxationText}>Scrunch face, hold, let go completely</Text>
          </View>
        </View>
      </View>

      <View style={styles.relaxationNote}>
        <Text style={styles.relaxationNoteText}>
          🌸 Spend 5-10 minutes on this practice. Notice how relaxed you feel.
        </Text>
      </View>

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => setActiveActivity(null)}
      >
        <Text style={styles.backButtonText}>← Back to Activities</Text>
      </TouchableOpacity>
    </View>
  );

  const renderActiveActivity = () => {
    if (!activeActivity) return null;

    switch (activeActivity.id) {
      case 'gratitude':
      case 'positive-reflection':
        return renderGratitudeJournal();
      case 'motivational-quiz':
        return renderMotivationalQuiz();
      case 'visualization':
        return renderVisualization();
      case 'focus-puzzle':
        return renderFocusPuzzle();
      case 'mindfulness-timer':
        return renderMindfulnessTimer();
      case 'uplifting-music':
        return renderUpliftingMusic();
      case 'guided-relaxation':
        return renderGuidedRelaxation();
      case 'breathing-exercise':
        return renderBreathingExercise();
      case 'grounding-activity':
        return renderGroundingActivity();
      default:
        return (
          <View style={styles.activityContent}>
            <Text style={styles.activityContentTitle}>
              {activeActivity.emoji} {activeActivity.title}
            </Text>
            <Text style={styles.activityContentText}>
              {activeActivity.description}
            </Text>
            <Text style={styles.comingSoonText}>
              This activity is coming soon! 🌟
            </Text>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setActiveActivity(null)}
            >
              <Text style={styles.backButtonText}>← Back to Activities</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="leaf" size={32} color="#4CAF50" />
        <Text style={styles.headerTitle}>Mindful Activities</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gamification Widget */}
        <GamificationWidget key={gamificationKey} compact={true} />
        
        {!activeActivity ? (
          <>
            {renderMoodSelector()}
            {renderActivityCards()}
          </>
        ) : (
          renderActiveActivity()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
    marginTop: 8,
  },
  moodSelector: {
    marginBottom: 24,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  activitiesSection: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  activityContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  activityContentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
  activityContentText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 24,
  },
  gratitudeInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
  },
  breathingCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 20,
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FF5722',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  breathingText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  breathingSteps: {
    marginVertical: 20,
  },
  breathingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 8,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
    marginRight: 12,
    width: 24,
  },
  stepText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
  },
  breathCounter: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  breathCountText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 12,
  },
  breathButton: {
    backgroundColor: '#FF5722',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  breathButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 40,
    marginVertical: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timerButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  timerButtonActive: {
    backgroundColor: '#FF9800',
  },
  timerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  groundingSteps: {
    marginTop: 20,
  },
  groundingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  groundingNumber: {
    fontSize: 24,
    marginRight: 12,
  },
  groundingText: {
    fontSize: 16,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 24,
  },
  bold: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  groundingNote: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  groundingNoteText: {
    fontSize: 14,
    color: '#4CAF50',
    lineHeight: 20,
  },
  comingSoonText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  quizContainer: {
    marginTop: 10,
  },
  quizItem: {
    marginBottom: 20,
  },
  quizQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  quizInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#2C3E50',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 60,
  },
  motivationalMessage: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  motivationalText: {
    fontSize: 15,
    color: '#4CAF50',
    textAlign: 'center',
    lineHeight: 22,
  },
  visualizationGuide: {
    marginTop: 20,
  },
  visualizationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  visualizationNumber: {
    fontSize: 28,
    marginRight: 12,
  },
  visualizationText: {
    fontSize: 15,
    color: '#2C3E50',
    flex: 1,
    lineHeight: 22,
  },
  visualizationNote: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  visualizationNoteText: {
    fontSize: 14,
    color: '#FF9800',
    textAlign: 'center',
    lineHeight: 20,
  },
  puzzleContainer: {
    marginTop: 20,
  },
  puzzleCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  puzzleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  puzzleInstruction: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    lineHeight: 22,
  },
  puzzleExample: {
    fontSize: 14,
    color: '#2196F3',
    fontStyle: 'italic',
    marginTop: 4,
  },
  puzzleNote: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  musicGenres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  genreCard: {
    width: '48%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  genreEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  musicTip: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  musicTipText: {
    fontSize: 14,
    color: '#F57C00',
    lineHeight: 20,
  },
  relaxationSteps: {
    marginTop: 20,
  },
  relaxationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  relaxationNumber: {
    fontSize: 24,
    marginRight: 12,
  },
  relaxationContent: {
    flex: 1,
  },
  relaxationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  relaxationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  relaxationNote: {
    backgroundColor: '#F3E5F5',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  relaxationNoteText: {
    fontSize: 14,
    color: '#9C27B0',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MindfulActivitiesScreen;
