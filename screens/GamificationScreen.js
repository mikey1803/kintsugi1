// screens/GamificationScreen.js
// Gamification & Progress Tracking Screen

import React, { useState, useEffect } from 'react';
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
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

const GamificationScreen = () => {
  const [userPoints, setUserPoints] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [level, setLevel] = useState(1);

  const dailyChallenges = [
    {
      id: 1,
      title: '5-Minute Meditation',
      description: 'Complete a 5-minute guided meditation',
      points: 50,
      icon: '🧘',
      type: 'meditation'
    },
    {
      id: 2,
      title: 'Gratitude Journal',
      description: 'Write 3 things you\'re grateful for today',
      points: 30,
      icon: '📝',
      type: 'journal'
    },
    {
      id: 3,
      title: 'Mood Check-In',
      description: 'Complete your daily mood check-in',
      points: 20,
      icon: '💙',
      type: 'mood'
    },
    {
      id: 4,
      title: 'Breathing Exercise',
      description: 'Practice box breathing for 3 minutes',
      points: 40,
      icon: '🌬️',
      type: 'breathing'
    },
    {
      id: 5,
      title: 'Self-Care Activity',
      description: 'Do something kind for yourself',
      points: 35,
      icon: '🌸',
      type: 'selfcare'
    },
    {
      id: 6,
      title: 'Connect with Someone',
      description: 'Have a meaningful conversation',
      points: 45,
      icon: '💬',
      type: 'social'
    }
  ];

  const achievementsList = [
    { id: 1, title: 'First Steps', description: 'Complete your first challenge', icon: '🌟', requirement: 1, unlocked: false },
    { id: 2, title: 'Mindful Warrior', description: 'Complete 7 meditation sessions', icon: '🧘', requirement: 7, unlocked: false },
    { id: 3, title: 'Consistency King', description: 'Maintain a 7-day streak', icon: '🔥', requirement: 7, unlocked: false },
    { id: 4, title: 'Point Master', description: 'Earn 1000 points', icon: '💎', requirement: 1000, unlocked: false },
    { id: 5, title: 'Self-Care Champion', description: 'Complete 30 self-care activities', icon: '💪', requirement: 30, unlocked: false },
    { id: 6, title: 'Wellness Guru', description: 'Reach Level 10', icon: '👑', requirement: 10, unlocked: false }
  ];

  useEffect(() => {
    loadUserProgress();
  }, []);

  const loadUserProgress = async () => {
    try {
      // Load user's gamification data from Firebase
      const progressQuery = query(
        collection(db, 'userProgress'),
        orderBy('timestamp', 'desc')
      );
      const progressSnapshot = await getDocs(progressQuery);
      
      if (!progressSnapshot.empty) {
        const latestProgress = progressSnapshot.docs[0].data();
        setUserPoints(latestProgress.points || 0);
        setCurrentStreak(latestProgress.streak || 0);
        setLevel(latestProgress.level || 1);
        setCompletedChallenges(latestProgress.completedChallenges || []);
        setAchievements(latestProgress.achievements || []);
      }
    } catch (error) {
      console.log('Error loading progress:', error);
    }
  };

  const completeChallenge = async (challenge) => {
    // Check if already completed today
    const today = new Date().toDateString();
    const alreadyCompleted = completedChallenges.some(
      c => c.id === challenge.id && new Date(c.completedAt).toDateString() === today
    );

    if (alreadyCompleted) {
      Alert.alert('Already Completed! 🎉', 'You\'ve already completed this challenge today. Come back tomorrow!');
      return;
    }

    const newPoints = userPoints + challenge.points;
    const newLevel = Math.floor(newPoints / 500) + 1;
    const newCompletedChallenges = [
      ...completedChallenges,
      { ...challenge, completedAt: new Date().toISOString() }
    ];

    setUserPoints(newPoints);
    setLevel(newLevel);
    setCompletedChallenges(newCompletedChallenges);

    // Save to Firebase
    try {
      await addDoc(collection(db, 'userProgress'), {
        points: newPoints,
        level: newLevel,
        streak: currentStreak,
        completedChallenges: newCompletedChallenges,
        achievements: achievements,
        timestamp: new Date().toISOString()
      });

      Alert.alert(
        '🎉 Challenge Completed!',
        `You earned ${challenge.points} points!\n\nTotal Points: ${newPoints}\nLevel: ${newLevel}`,
        [{ text: 'Awesome!', style: 'default' }]
      );
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const calculateProgress = () => {
    const pointsForNextLevel = (level * 500);
    const currentLevelPoints = userPoints - ((level - 1) * 500);
    return (currentLevelPoints / 500) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Wellness Journey 🌟</Text>
          <Text style={styles.headerSubtitle}>Build healthy habits, earn rewards!</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.levelContainer}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelText}>Level {level} Wellness Warrior</Text>
              <Text style={styles.pointsText}>{userPoints} points</Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${calculateProgress()}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.floor(calculateProgress())}% to Level {level + 1}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🔥</Text>
              <Text style={styles.statNumber}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{completedChallenges.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>🏆</Text>
              <Text style={styles.statNumber}>{achievements.length}</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Daily Challenges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Challenges 🎯</Text>
          {dailyChallenges.map((challenge) => {
            const isCompleted = completedChallenges.some(
              c => c.id === challenge.id && 
              new Date(c.completedAt).toDateString() === new Date().toDateString()
            );

            return (
              <TouchableOpacity
                key={challenge.id}
                style={[styles.challengeCard, isCompleted && styles.challengeCompleted]}
                onPress={() => !isCompleted && completeChallenge(challenge)}
                disabled={isCompleted}
              >
                <View style={styles.challengeIcon}>
                  <Text style={styles.challengeEmoji}>{challenge.icon}</Text>
                </View>
                <View style={styles.challengeContent}>
                  <Text style={[styles.challengeTitle, isCompleted && styles.completedText]}>
                    {challenge.title}
                  </Text>
                  <Text style={styles.challengeDescription}>{challenge.description}</Text>
                  <View style={styles.challengeFooter}>
                    <Text style={styles.challengePoints}>+{challenge.points} points</Text>
                    {isCompleted && <Text style={styles.completedBadge}>✓ Completed</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements 🏆</Text>
          <View style={styles.achievementsGrid}>
            {achievementsList.map((achievement) => {
              const isUnlocked = achievements.includes(achievement.id);
              return (
                <View
                  key={achievement.id}
                  style={[styles.achievementCard, !isUnlocked && styles.achievementLocked]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={[styles.achievementTitle, !isUnlocked && styles.lockedText]}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  {!isUnlocked && <Text style={styles.lockedBadge}>🔒 Locked</Text>}
                </View>
              );
            })}
          </View>
        </View>

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
    backgroundColor: '#FF6B9D',
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
  progressCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6B9D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 5,
  },
  pointsText: {
    fontSize: 16,
    color: '#666',
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B9D',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  challengeCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeCompleted: {
    backgroundColor: '#E8F5E9',
    opacity: 0.7,
  },
  challengeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  challengeEmoji: {
    fontSize: 28,
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  challengeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  challengePoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
  },
  completedBadge: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementLocked: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedText: {
    color: '#999',
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedBadge: {
    fontSize: 10,
    color: '#999',
  },
  bottomPadding: {
    height: 30,
  },
});

export default GamificationScreen;
