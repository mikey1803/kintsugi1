// screens/JournalScreen.js

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const journalPrompts = [
  "What is one thing you are grateful for today?",
  "Describe a small victory or accomplishment you had recently.",
  "What is a simple pleasure you enjoyed this week?",
  "Write down a thought that has been bothering you, and then write a kinder alternative.",
  "What is one thing you are looking forward to?",
  "How did you show kindness to yourself or someone else today?",
];

const JournalScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [entry, setEntry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Select a random prompt when the screen loads
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * journalPrompts.length);
    setPrompt(journalPrompts[randomIndex]);
  }, []);

  const handleSaveEntry = async () => {
    if (entry.trim() === '') {
      Alert.alert("Empty Entry", "Please write something before saving.");
      return;
    }

    setIsLoading(true);
    try {
      await addDoc(collection(db, "journalEntries"), {
        prompt: prompt,
        entry: entry,
        timestamp: serverTimestamp(),
      });
      Alert.alert("Success!", "Your journal entry has been saved.");
      setEntry(''); // Clear the input field after saving
    } catch (error) {
      console.error("Error saving journal entry: ", error);
      Alert.alert("Error", "Could not save your entry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Guided Journal</Text>
          
          <View style={styles.promptCard}>
            <Ionicons name="bulb-outline" size={24} color="#666" />
            <Text style={styles.promptText}>{prompt}</Text>
          </View>

          <TextInput
            style={styles.textInput}
            value={entry}
            onChangeText={setEntry}
            placeholder="Write your thoughts here..."
            multiline={true}
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.disabledButton]} 
            onPress={handleSaveEntry}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  promptText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 200,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top', // For Android
    borderColor: '#DDD',
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A9A9A9',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default JournalScreen;