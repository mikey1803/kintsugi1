// screens/HistoryScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { useIsFocused } from '@react-navigation/native';
// Temporarily commented out to fix Worklets error
// import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const HistoryScreen = () => {
  const [moods, setMoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
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
      const moodsQuery = query(collection(db, 'moods'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(moodsQuery);
      
      const fetchedMoods = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        };
      });

      setMoods(fetchedMoods.map(mood => ({...mood, timestamp: mood.timestamp.toLocaleDateString()})));

      if (fetchedMoods.length >= 2) {
        const recentMoods = fetchedMoods.reverse().slice(-7);

        setChartData({
          labels: recentMoods.map(mood => {
            const date = mood.timestamp;
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }),
          datasets: [
            {
              data: recentMoods.map(mood => moodValues[mood.emotionName] || 3),
            },
          ],
        });
      } else {
        setChartData(null);
      }

    } catch (error) {
      console.error("Error fetching moods: ", error);
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

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.moodName}>{item.emotionName}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <Text style={styles.title}>Your Mood History</Text>
      
      {/* Simple mood trend display instead of chart */}
      {moods.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Recent Mood Trend</Text>
          <Text style={styles.chartPlaceholder}>
            📊 Total moods logged: {moods.length}{'\n'}
            Keep tracking your wellness journey!
          </Text>
        </View>
      )}

      {moods.length === 0 ? (
        <Text style={styles.emptyText}>No moods saved yet.</Text>
      ) : (
        <FlatList
          data={moods}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    // Styles are unchanged
    wrapper: { flex: 1, backgroundColor: '#F5F5F5' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 20, color: '#333' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chartContainer: { alignItems: 'center', marginVertical: 10 },
    chartTitle: { fontSize: 16, color: '#333', marginBottom: 5 },
    chartPlaceholder: { fontSize: 14, color: '#666', textAlign: 'center', padding: 20, backgroundColor: '#E8F4F8', borderRadius: 10, margin: 10 },
    list: { paddingHorizontal: 20, paddingTop: 10 },
    itemContainer: { backgroundColor: '#FFFFFF', flexDirection: 'row', padding: 15, borderRadius: 10, marginBottom: 10, alignItems: 'center', elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22 },
    emoji: { fontSize: 30, marginRight: 15 },
    textContainer: { flex: 1 },
    moodName: { fontSize: 18, fontWeight: '500' },
    timestamp: { fontSize: 14, color: '#666', marginTop: 4 },
    emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
});

export default HistoryScreen;