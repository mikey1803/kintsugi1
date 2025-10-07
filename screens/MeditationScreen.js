// screens/MeditationScreen.js
// Guided Meditations, Breathing Exercises & Sleep Tools

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const MeditationScreen = () => {
  const [activeTab, setActiveTab] = useState('meditate'); // meditate, breathe, sleep
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const breathAnimation = useRef(new Animated.Value(1)).current;
  const [breathPhase, setBreathPhase] = useState('ready');
  const [breathCount, setBreathCount] = useState(0);

  const meditations = [
    {
      id: 1,
      title: 'Morning Mindfulness',
      duration: '10 min',
      description: 'Start your day with clarity and calm',
      icon: '🌅',
      color: '#FFD700',
      benefits: ['Reduces stress', 'Improves focus', 'Boosts mood']
    },
    {
      id: 2,
      title: 'Anxiety Relief',
      duration: '15 min',
      description: 'Calm your mind and ease anxiety',
      icon: '🧘',
      color: '#87CEEB',
      benefits: ['Calms nerves', 'Reduces worry', 'Promotes peace']
    },
    {
      id: 3,
      title: 'Body Scan',
      duration: '20 min',
      description: 'Release tension from head to toe',
      icon: '💆',
      color: '#98FB98',
      benefits: ['Releases tension', 'Body awareness', 'Deep relaxation']
    },
    {
      id: 4,
      title: 'Loving Kindness',
      duration: '12 min',
      description: 'Cultivate compassion and self-love',
      icon: '💝',
      color: '#FF69B4',
      benefits: ['Increases compassion', 'Improves relationships', 'Self-love']
    },
    {
      id: 5,
      title: 'Sleep Preparation',
      duration: '25 min',
      description: 'Wind down for restful sleep',
      icon: '🌙',
      color: '#9C27B0',
      benefits: ['Better sleep', 'Reduces insomnia', 'Peaceful mind']
    },
    {
      id: 6,
      title: 'Quick Reset',
      duration: '5 min',
      description: 'Fast energy and clarity boost',
      icon: '⚡',
      color: '#FF6B6B',
      benefits: ['Quick refresh', 'Instant calm', 'Energy boost']
    }
  ];

  const breathingExercises = [
    {
      id: 1,
      title: 'Box Breathing',
      description: 'Inhale 4, Hold 4, Exhale 4, Hold 4',
      icon: '📦',
      pattern: [
        { phase: 'Inhale', duration: 4000 },
        { phase: 'Hold', duration: 4000 },
        { phase: 'Exhale', duration: 4000 },
        { phase: 'Hold', duration: 4000 }
      ],
      benefits: 'Used by Navy SEALs, reduces stress and improves focus'
    },
    {
      id: 2,
      title: '4-7-8 Breathing',
      description: 'Inhale 4, Hold 7, Exhale 8',
      icon: '💨',
      pattern: [
        { phase: 'Inhale', duration: 4000 },
        { phase: 'Hold', duration: 7000 },
        { phase: 'Exhale', duration: 8000 }
      ],
      benefits: 'Promotes sleep, reduces anxiety, calms nervous system'
    },
    {
      id: 3,
      title: 'Coherent Breathing',
      description: 'Inhale 5, Exhale 5',
      icon: '🌊',
      pattern: [
        { phase: 'Inhale', duration: 5000 },
        { phase: 'Exhale', duration: 5000 }
      ],
      benefits: 'Balances heart rate, reduces stress hormones'
    }
  ];

  const sleepSounds = [
    { id: 1, title: 'Rain & Thunder', icon: '🌧️', color: '#708090' },
    { id: 2, title: 'Ocean Waves', icon: '🌊', color: '#4682B4' },
    { id: 3, title: 'Forest Birds', icon: '🌲', color: '#228B22' },
    { id: 4, title: 'White Noise', icon: '📻', color: '#A9A9A9' },
    { id: 5, title: 'Campfire', icon: '🔥', color: '#FF4500' },
    { id: 6, title: 'Wind Chimes', icon: '🎐', color: '#DDA0DD' }
  ];

  const sleepRoutines = [
    { id: 1, title: 'Digital Detox', time: '30 min before bed', icon: '📵' },
    { id: 2, title: 'Herbal Tea', time: '1 hour before bed', icon: '🍵' },
    { id: 3, title: 'Reading', time: '20 minutes', icon: '📖' },
    { id: 4, title: 'Stretching', time: '10 minutes', icon: '🧘' },
    { id: 5, title: 'Journaling', time: '15 minutes', icon: '📓' },
    { id: 6, title: 'Cool Room', time: 'Set to 65-68°F', icon: '❄️' }
  ];

  const startBreathingExercise = (exercise) => {
    setSelectedSession(exercise);
    setBreathPhase('ready');
    setBreathCount(0);
    setIsPlaying(true);

    setTimeout(() => runBreathingCycle(exercise.pattern, 0), 2000);
  };

  const runBreathingCycle = (pattern, index) => {
    if (index >= pattern.length) {
      setBreathCount(prev => prev + 1);
      setTimeout(() => runBreathingCycle(pattern, 0), 1000);
      return;
    }

    const currentPhase = pattern[index];
    setBreathPhase(currentPhase.phase);

    const scale = currentPhase.phase === 'Inhale' ? 1.5 : 1;
    
    Animated.timing(breathAnimation, {
      toValue: scale,
      duration: currentPhase.duration,
      useNativeDriver: true,
    }).start(() => {
      if (isPlaying) {
        setTimeout(() => runBreathingCycle(pattern, index + 1), 500);
      }
    });
  };

  const stopSession = () => {
    setIsPlaying(false);
    setBreathPhase('ready');
    breathAnimation.setValue(1);
    Alert.alert('Session Complete! 🌟', `Great job! You completed ${breathCount} breathing cycles.`);
  };

  const startMeditation = (meditation) => {
    setSelectedSession(meditation);
    setIsPlaying(true);
    Alert.alert(
      meditation.title,
      `Starting ${meditation.duration} meditation session.\n\nFind a comfortable position and close your eyes when ready.`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setIsPlaying(false) },
        { text: 'Begin', onPress: () => console.log('Meditation started') }
      ]
    );
  };

  const playSleepSound = (sound) => {
    Alert.alert(
      sound.title,
      'This sound will help you relax and fall asleep.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Play', onPress: () => console.log(`Playing ${sound.title}`) }
      ]
    );
  };

  const renderMeditationTab = () => (
    <View>
      <Text style={styles.tabDescription}>
        Guided meditation sessions to reduce stress and find inner peace
      </Text>
      {meditations.map(meditation => (
        <View key={meditation.id} style={[styles.sessionCard, { borderLeftColor: meditation.color }]}>
          <View style={styles.sessionHeader}>
            <View style={[styles.sessionIcon, { backgroundColor: meditation.color + '20' }]}>
              <Text style={styles.sessionEmoji}>{meditation.icon}</Text>
            </View>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>{meditation.title}</Text>
              <Text style={styles.sessionDuration}>⏱️ {meditation.duration}</Text>
            </View>
          </View>
          <Text style={styles.sessionDescription}>{meditation.description}</Text>
          <View style={styles.benefitsContainer}>
            {meditation.benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitTag}>
                <Text style={styles.benefitText}>✓ {benefit}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: meditation.color }]}
            onPress={() => startMeditation(meditation)}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderBreathingTab = () => (
    <View>
      <Text style={styles.tabDescription}>
        Scientifically-proven breathing techniques to calm your mind and body
      </Text>
      
      {!isPlaying ? (
        breathingExercises.map(exercise => (
          <View key={exercise.id} style={styles.breathingCard}>
            <View style={styles.breathingHeader}>
              <Text style={styles.breathingIcon}>{exercise.icon}</Text>
              <View style={styles.breathingInfo}>
                <Text style={styles.breathingTitle}>{exercise.title}</Text>
                <Text style={styles.breathingPattern}>{exercise.description}</Text>
              </View>
            </View>
            <Text style={styles.breathingBenefits}>{exercise.benefits}</Text>
            <TouchableOpacity
              style={styles.breathingButton}
              onPress={() => startBreathingExercise(exercise)}
            >
              <Text style={styles.breathingButtonText}>Start Exercise</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.breathingActive}>
          <Text style={styles.activeTitle}>{selectedSession?.title}</Text>
          <Text style={styles.cycleCount}>Cycle {breathCount + 1}</Text>
          
          <Animated.View
            style={[
              styles.breathCircle,
              { transform: [{ scale: breathAnimation }] }
            ]}
          >
            <Text style={styles.breathPhaseText}>{breathPhase}</Text>
          </Animated.View>

          <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
            <Text style={styles.stopButtonText}>Complete Session</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderSleepTab = () => (
    <View>
      <Text style={styles.tabDescription}>
        Improve your sleep quality with calming sounds and healthy routines
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sleep Sounds 🎵</Text>
        <View style={styles.soundsGrid}>
          {sleepSounds.map(sound => (
            <TouchableOpacity
              key={sound.id}
              style={[styles.soundCard, { backgroundColor: sound.color + '20' }]}
              onPress={() => playSleepSound(sound)}
            >
              <Text style={styles.soundIcon}>{sound.icon}</Text>
              <Text style={styles.soundTitle}>{sound.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Bedtime Routine Checklist 📋</Text>
        <Text style={styles.routineDescription}>
          Build a consistent sleep routine for better rest
        </Text>
        {sleepRoutines.map(routine => (
          <View key={routine.id} style={styles.routineCard}>
            <Text style={styles.routineIcon}>{routine.icon}</Text>
            <View style={styles.routineInfo}>
              <Text style={styles.routineTitle}>{routine.title}</Text>
              <Text style={styles.routineTime}>{routine.time}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wellness Studio 🧘</Text>
        <Text style={styles.headerSubtitle}>Meditate, Breathe, Sleep Better</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meditate' && styles.activeTab]}
          onPress={() => setActiveTab('meditate')}
        >
          <Text style={[styles.tabText, activeTab === 'meditate' && styles.activeTabText]}>
            Meditate
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'breathe' && styles.activeTab]}
          onPress={() => setActiveTab('breathe')}
        >
          <Text style={[styles.tabText, activeTab === 'breathe' && styles.activeTabText]}>
            Breathe
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sleep' && styles.activeTab]}
          onPress={() => setActiveTab('sleep')}
        >
          <Text style={[styles.tabText, activeTab === 'sleep' && styles.activeTabText]}>
            Sleep
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'meditate' && renderMeditationTab()}
        {activeTab === 'breathe' && renderBreathingTab()}
        {activeTab === 'sleep' && renderSleepTab()}
        <View style={styles.bottomPadding} />
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
    padding: 20,
    backgroundColor: '#9C27B0',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: '#9C27B0',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  tabDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  sessionCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  sessionEmoji: {
    fontSize: 28,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#666',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  benefitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  benefitTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 12,
    color: '#4CAF50',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  breathingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  breathingHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  breathingIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  breathingInfo: {
    flex: 1,
  },
  breathingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  breathingPattern: {
    fontSize: 14,
    color: '#666',
  },
  breathingBenefits: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 15,
    lineHeight: 18,
  },
  breathingButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  breathingButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  breathingActive: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 400,
    justifyContent: 'space-around',
  },
  activeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 10,
  },
  cycleCount: {
    fontSize: 16,
    color: '#666',
  },
  breathCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  breathPhaseText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  soundsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  soundCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  soundIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  soundTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  routineDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  routineCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routineIcon: {
    fontSize: 30,
    marginRight: 15,
  },
  routineInfo: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  routineTime: {
    fontSize: 13,
    color: '#666',
  },
  bottomPadding: {
    height: 30,
  },
});

export default MeditationScreen;
