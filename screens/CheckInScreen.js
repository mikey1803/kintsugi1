// screens/CheckInScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { db } from '../firebaseConfig'; // We are importing 'db' here
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const emotions = [
  { emoji: '😊', name: 'Happy' },
  { emoji: '🙂', name: 'Okay' },
  { emoji: '😐', name: 'Neutral' },
  { emoji: '😔', name: 'Sad' },
  { emoji: '😠', name: 'Angry' },
];

const CheckInScreen = () => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);

  const handleSelectEmotion = (emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleConfirm = async () => {
    // NEW: Let's log the db object to see what it is
    console.log("Inspecting the 'db' object:", db);

    if (selectedEmotion) {
      try {
        await addDoc(collection(db, "moods"), {
          emotionName: selectedEmotion.name,
          emoji: selectedEmotion.emoji,
          timestamp: serverTimestamp(),
        });
        Alert.alert("Success!", "Your mood has been saved.");
        setSelectedEmotion(null); 
      } catch (error) {
        console.error("Error adding document: ", error);
        Alert.alert("Error", "There was an issue saving your mood.");
      }
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>How are you feeling today?</Text>
        <View style={styles.emotionContainer}>
          {emotions.map((emotion) => (
            <TouchableOpacity
              key={emotion.name}
              style={[
                styles.emotionButton,
                selectedEmotion?.name === emotion.name && styles.selectedEmotionButton,
              ]}
              onPress={() => handleSelectEmotion(emotion)}
            >
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={styles.emotionName}>{emotion.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedEmotion && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Save Mood</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 40,
  },
  emotionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  emotionButton: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 15,
  },
  selectedEmotionButton: {
    backgroundColor: '#DDEEFF',
    transform: [{ scale: 1.1 }],
  },
  emotionEmoji: {
    fontSize: 40,
  },
  emotionName: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CheckInScreen;