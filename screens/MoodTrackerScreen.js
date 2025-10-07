// screens/MoodTrackerScreen.js
// Enhanced Mood Tracking with Visualization

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const MoodTrackerScreen = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodNote, setMoodNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState({});

  const moods = [
    { id: 1, emoji: '😊', name: 'Happy', color: '#FFD700', value: 5 },
    { id: 2, emoji: '😌', name: 'Calm', color: '#87CEEB', value: 4 },
    { id: 3, emoji: '😐', name: 'Neutral', color: '#FFA500', value: 3 },
    { id: 4, emoji: '😔', name: 'Sad', color: '#9C27B0', value: 2 },
    { id: 5, emoji: '😰', name: 'Anxious', color: '#FF6B6B', value: 1 },
    { id: 6, emoji: '😤', name: 'Angry', color: '#DC143C', value: 2 },
    { id: 7, emoji: '😫', name: 'Tired', color: '#708090', value: 2 },
    { id: 8, emoji: '🤗', name: 'Grateful', color: '#98FB98', value: 5 },
  ];

  const activities = [
    { id: 1, icon: '💼', label: 'Work' },
    { id: 2, icon: '🏃', label: 'Exercise' },
    { id: 3, icon: '🍽️', label: 'Food' },
    { id: 4, icon: '👨‍👩‍👧', label: 'Family' },
    { id: 5, icon: '🎮', label: 'Hobby' },
    { id: 6, icon: '😴', label: 'Sleep' },
    { id: 7, icon: '🧘', label: 'Meditation' },
    { id: 8, icon: '📚', label: 'Learning' },
  ];

  const [selectedActivities, setSelectedActivities] = useState([]);

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const moodsQuery = query(
        collection(db, 'moods'),
        orderBy('timestamp', 'desc'),
        limit(30)
      );
      const querySnapshot = await getDocs(moodsQuery);
      const moods = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMoodHistory(moods);
      calculateWeeklyStats(moods);
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const calculateWeeklyStats = (moods) => {
    const last7Days = moods.filter(mood => {
      const moodDate = new Date(mood.timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - moodDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    });

    const stats = {
      totalEntries: last7Days.length,
      averageMood: last7Days.reduce((acc, mood) => acc + (mood.moodValue || 3), 0) / last7Days.length || 3,
      mostCommonMood: getMostCommonMood(last7Days),
      bestDay: getBestDay(last7Days),
    };

    setWeeklyStats(stats);
  };

  const getMostCommonMood = (moods) => {
    if (moods.length === 0) return 'Neutral';
    const moodCounts = {};
    moods.forEach(mood => {
      moodCounts[mood.emotionName] = (moodCounts[mood.emotionName] || 0) + 1;
    });
    return Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);
  };

  const getBestDay = (moods) => {
    if (moods.length === 0) return 'N/A';
    const best = moods.reduce((prev, current) => 
      (current.moodValue > prev.moodValue) ? current : prev
    );
    return new Date(best.timestamp).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const saveMoodEntry = async () => {
    if (!selectedMood) {
      Alert.alert('Select a Mood', 'Please select how you\'re feeling');
      return;
    }

    try {
      await addDoc(collection(db, 'moods'), {
        emotionName: selectedMood.name,
        emotionEmoji: selectedMood.emoji,
        color: selectedMood.color,
        moodValue: selectedMood.value,
        note: moodNote,
        activities: selectedActivities,
        timestamp: new Date().toISOString(),
      });

      Alert.alert('Mood Saved! 💙', 'Thank you for tracking your mood today');
      setSelectedMood(null);
      setMoodNote('');
      setSelectedActivities([]);
      loadMoodHistory();
    } catch (error) {
      console.error('Error saving mood:', error);
      Alert.alert('Error', 'Could not save mood entry');
    }
  };

  const toggleActivity = (activity) => {
    setSelectedActivities(prev => {
      if (prev.find(a => a.id === activity.id)) {
        return prev.filter(a => a.id !== activity.id);
      } else {
        return [...prev, activity];
      }
    });
  };

  const renderMoodChart = () => {
    const last7Days = moodHistory.slice(0, 7).reverse();
    const maxHeight = 100;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This Week's Mood Trend 📊</Text>
        <View style={styles.chart}>
          {last7Days.map((mood, index) => {
            const height = (mood.moodValue / 5) * maxHeight;
            const date = new Date(mood.timestamp);
            return (
              <View key={index} style={styles.chartBar}>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { height, backgroundColor: mood.color }]} />
                </View>
                <Text style={styles.barLabel}>{mood.emotionEmoji}</Text>
                <Text style={styles.barDate}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mood Tracker 💙</Text>
          <Text style={styles.headerSubtitle}>How are you feeling today?</Text>
        </View>

        {/* Weekly Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>This Week's Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.totalEntries || 0}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {weeklyStats.averageMood ? Math.round(weeklyStats.averageMood * 10) / 10 : 'N/A'}/5
              </Text>
              <Text style={styles.statLabel}>Avg Mood</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.mostCommonMood || 'N/A'}</Text>
              <Text style={styles.statLabel}>Most Common</Text>
            </View>
          </View>
        </View>

        {/* Mood Chart */}
        {moodHistory.length > 0 && renderMoodChart()}

        {/* Mood Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Your Mood</Text>
          <View style={styles.moodGrid}>
            {moods.map(mood => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodButton,
                  selectedMood?.id === mood.id && { 
                    backgroundColor: mood.color,
                    transform: [{ scale: 1.1 }]
                  }
                ]}
                onPress={() => setSelectedMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodName,
                  selectedMood?.id === mood.id && styles.selectedMoodName
                ]}>
                  {mood.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What influenced your mood?</Text>
          <View style={styles.activitiesGrid}>
            {activities.map(activity => {
              const isSelected = selectedActivities.find(a => a.id === activity.id);
              return (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.activityButton, isSelected && styles.activitySelected]}
                  onPress={() => toggleActivity(activity)}
                >
                  <Text style={styles.activityIcon}>{activity.icon}</Text>
                  <Text style={styles.activityLabel}>{activity.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Note (Optional)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="What's on your mind? Share your thoughts..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={moodNote}
            onChangeText={setMoodNote}
            textAlignVertical="top"
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={saveMoodEntry}>
          <Text style={styles.saveButtonText}>Save Mood Entry</Text>
        </TouchableOpacity>

        {/* Recent Entries */}
        {moodHistory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Entries 📝</Text>
            {moodHistory.slice(0, 5).map((mood, index) => (
              <View key={index} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyEmoji}>{mood.emotionEmoji}</Text>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyMood}>{mood.emotionName}</Text>
                    <Text style={styles.historyDate}>
                      {new Date(mood.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                </View>
                {mood.note && <Text style={styles.historyNote}>{mood.note}</Text>}
                {mood.activities && mood.activities.length > 0 && (
                  <View style={styles.historyActivities}>
                    {mood.activities.map((activity, idx) => (
                      <Text key={idx} style={styles.historyActivity}>{activity.icon}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

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
  statsCard: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B9D',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 150,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    height: 100,
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  bar: {
    width: 30,
    borderRadius: 5,
  },
  barLabel: {
    fontSize: 20,
    marginBottom: 3,
  },
  barDate: {
    fontSize: 10,
    color: '#666',
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  moodName: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  selectedMoodName: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityButton: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  activitySelected: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  activityIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  activityLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    fontSize: 15,
    color: '#1A1A1A',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: '#FF6B9D',
    marginHorizontal: 20,
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 25,
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  historyCard: {
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
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyMood: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 3,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  historyNote: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  historyActivities: {
    flexDirection: 'row',
    gap: 8,
  },
  historyActivity: {
    fontSize: 18,
  },
  bottomPadding: {
    height: 30,
  },
});

export default MoodTrackerScreen;
