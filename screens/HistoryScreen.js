// screens/HistoryScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, query, doc, getDoc, limit } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
import GamificationWidget from '../components/GamificationWidget';

const screenWidth = Dimensions.get('window').width;

const HistoryScreen = () => {
  const [moods, setMoods] = useState([]);
  const [gratitudeEntries, setGratitudeEntries] = useState([]);
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('journey'); // journey, moods, gratitude
  const isFocused = useIsFocused();

  const moodValues = {
    Happy: 5,
    Okay: 4,
    Neutral: 3,
    Sad: 2,
    Angry: 1,
  };

  const valueToMood = {
    1: 'Angry',
    2: 'Sad',
    3: 'Neutral',
    4: 'Okay',
    5: 'Happy',
  };

  const fetchMoods = async () => {
    try {
      setLoading(true);
      
      // Fetch moods
      const moodsQuery = query(collection(db, 'moods'), orderBy('timestamp', 'desc'), limit(20));
      const moodsSnapshot = await getDocs(moodsQuery);
      
      const fetchedMoods = moodsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          type: 'mood',
        };
      });

      setMoods(fetchedMoods);

      // Fetch gratitude entries
      const gratitudeQuery = query(collection(db, 'gratitude'), orderBy('timestamp', 'desc'), limit(20));
      const gratitudeSnapshot = await getDocs(gratitudeQuery);
      
      const fetchedGratitude = gratitudeSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          type: 'gratitude',
        };
      });

      setGratitudeEntries(fetchedGratitude);

      // Fetch gamification data
      const gamificationDoc = await getDoc(doc(db, 'gamification', 'default_user'));
      if (gamificationDoc.exists()) {
        setGamificationData(gamificationDoc.data());
      }

    } catch (error) {
      console.error("Error fetching history: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchMoods();
    }
  }, [isFocused]);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

    const renderMoodItem = ({ item }) => (
    <View style={styles.moodItem}>
      <Text style={styles.moodEmoji}>{item.emoji}</Text>
      <View style={styles.moodInfo}>
        <Text style={styles.moodName}>{item.emotionName}</Text>
        <Text style={styles.moodTimestamp}>{item.timestamp.toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const renderGratitudeItem = ({ item }) => (
    <View style={styles.gratitudeItem}>
      <View style={styles.gratitudeHeader}>
        <Ionicons name="sparkles" size={24} color="#FFD700" />
        <Text style={styles.gratitudeTimestamp}>
          {item.timestamp.toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.gratitudeText}>{item.text}</Text>
    </View>
  );

  const getActivityIcon = (type) => {
    const icons = {
      mood: '😊',
      gratitude: '✨',
      breathing: '🌬️',
      checkin: '💙',
      timer: '⏱️',
      grounding: '🧘',
    };
    return icons[type] || '📝';
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderJourneyItem = (item, index) => {
    const isLastItem = index === combinedJourney.length - 1;
    
    return (
      <View key={item.id} style={styles.journeyItem}>
        <View style={styles.timeline}>
          <View style={styles.timelineDot} />
          {!isLastItem && <View style={styles.timelineLine} />}
        </View>
        <View style={styles.journeyContent}>
          <View style={styles.journeyHeader}>
            <Text style={styles.activityIcon}>{getActivityIcon(item.type)}</Text>
            <View style={styles.journeyHeaderText}>
              <Text style={styles.journeyType}>
                {item.type === 'mood' ? 'Mood Check-in' :
                 item.type === 'gratitude' ? 'Gratitude Entry' :
                 item.activityType || 'Activity'}
              </Text>
              <Text style={styles.journeyTime}>{formatRelativeTime(item.timestamp)}</Text>
            </View>
            {item.points && (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>+{item.points}</Text>
              </View>
            )}
          </View>
          {item.type === 'mood' && (
            <Text style={styles.journeyDetail}>
              {item.emoji} {item.emotionName}
            </Text>
          )}
          {item.type === 'gratitude' && (
            <Text style={styles.journeyDetail} numberOfLines={2}>
              "{item.text}"
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Combine all activities into a single timeline
  const combinedJourney = [
    ...moods.map(m => ({ ...m, type: 'mood' })),
    ...gratitudeEntries.map(g => ({ ...g, type: 'gratitude', points: 40 })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      );
    }

    if (activeTab === 'journey') {
      if (combinedJourney.length === 0) {
        return (
          <View style={styles.centerContent}>
            <Ionicons name="leaf-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No journey yet</Text>
            <Text style={styles.emptySubtext}>Start your wellness journey today</Text>
          </View>
        );
      }
      return (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.journeyContainer}>
            {combinedJourney.map((item, index) => renderJourneyItem(item, index))}
          </View>
        </ScrollView>
      );
    }

    if (activeTab === 'moods') {
      if (moods.length === 0) {
        return (
          <View style={styles.centerContent}>
            <Ionicons name="happy-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No mood history yet</Text>
            <Text style={styles.emptySubtext}>Complete a wellness check-in to start tracking</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={moods}
          renderItem={renderMoodItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      );
    }

    if (activeTab === 'gratitude') {
      if (gratitudeEntries.length === 0) {
        return (
          <View style={styles.centerContent}>
            <Ionicons name="sparkles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No gratitude entries yet</Text>
            <Text style={styles.emptySubtext}>Share what you're grateful for</Text>
          </View>
        );
      }
      return (
        <FlatList
          data={gratitudeEntries}
          renderItem={renderGratitudeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wellness Journey</Text>
        <GamificationWidget compact={true} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'journey' && styles.activeTab]}
          onPress={() => setActiveTab('journey')}
        >
          <Ionicons
            name="leaf"
            size={20}
            color={activeTab === 'journey' ? '#4CAF50' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'journey' && styles.activeTabText]}>
            Journey
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'moods' && styles.activeTab]}
          onPress={() => setActiveTab('moods')}
        >
          <Ionicons
            name="happy"
            size={20}
            color={activeTab === 'moods' ? '#4CAF50' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'moods' && styles.activeTabText]}>
            Moods
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'gratitude' && styles.activeTab]}
          onPress={() => setActiveTab('gratitude')}
        >
          <Ionicons
            name="sparkles"
            size={20}
            color={activeTab === 'gratitude' ? '#4CAF50' : '#999'}
          />
          <Text style={[styles.tabText, activeTab === 'gratitude' && styles.activeTabText]}>
            Gratitude
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BBB',
    marginTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  listContainer: {
    padding: 16,
  },
  journeyContainer: {
    paddingBottom: 20,
  },
  journeyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  journeyContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  journeyHeaderText: {
    flex: 1,
  },
  journeyType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  journeyTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  journeyDetail: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  moodEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  moodInfo: {
    flex: 1,
  },
  moodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  moodTimestamp: {
    fontSize: 14,
    color: '#999',
  },
  gratitudeItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gratitudeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gratitudeTimestamp: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
  },
  gratitudeText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HistoryScreen;