// components/MoodCheckModal.js

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Alert,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const emotions = [
  { emoji: '😊', name: 'Happy', color: '#4CAF50' },
  { emoji: '🙂', name: 'Okay', color: '#2196F3' },
  { emoji: '😐', name: 'Neutral', color: '#FF9800' },
  { emoji: '😔', name: 'Sad', color: '#9C27B0' },
  { emoji: '😠', name: 'Angry', color: '#F44336' },
];

const MoodCheckModal = ({ visible, onComplete }) => {
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectEmotion = (emotion) => {
    setSelectedEmotion(emotion);
  };

  const handleConfirm = async () => {
    if (!selectedEmotion) return;

    setIsLoading(true);
    
    try {
      await addDoc(collection(db, "moods"), {
        emotionName: selectedEmotion.name,
        emoji: selectedEmotion.emoji,
        timestamp: serverTimestamp(),
      });
      
      // Show success message briefly then navigate
      Alert.alert(
        "Thank you! 💝", 
        `Your ${selectedEmotion.name.toLowerCase()} mood has been saved. Let's chat with your Kintsugi companion!`,
        [
          {
            text: "Let's Go!",
            onPress: () => {
              setSelectedEmotion(null);
              onComplete(selectedEmotion);
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error saving mood:", error);
      Alert.alert("Oops!", "There was an issue saving your mood. Let's try again.");
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      "Skip mood check?",
      "Your emotional check-in helps your Kintsugi companion understand you better. Are you sure you want to skip?",
      [
        { text: "Go Back", style: "cancel" },
        { 
          text: "Skip for Now", 
          onPress: () => {
            setSelectedEmotion(null);
            onComplete(null);
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="heart" size={32} color="#FF6B6B" />
            </View>
            <Text style={styles.title}>How's your heart today?</Text>
            <Text style={styles.subtitle}>
              Your Kintsugi companion wants to understand your emotional space
            </Text>
          </View>

          {/* Emotions */}
          <View style={styles.emotionContainer}>
            {emotions.map((emotion) => (
              <TouchableOpacity
                key={emotion.name}
                style={[
                  styles.emotionButton,
                  selectedEmotion?.name === emotion.name && {
                    ...styles.selectedEmotionButton,
                    borderColor: emotion.color,
                    backgroundColor: emotion.color + '20'
                  },
                ]}
                onPress={() => handleSelectEmotion(emotion)}
                activeOpacity={0.7}
              >
                <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
                <Text style={[
                  styles.emotionName,
                  selectedEmotion?.name === emotion.name && { 
                    color: emotion.color,
                    fontWeight: 'bold'
                  }
                ]}>
                  {emotion.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            {selectedEmotion && (
              <TouchableOpacity 
                style={[styles.confirmButton, { backgroundColor: selectedEmotion.color }]} 
                onPress={handleConfirm}
                disabled={isLoading}
              >
                <Ionicons name="heart" size={20} color="white" style={styles.buttonIcon} />
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Saving...' : `Share My ${selectedEmotion.name} Feeling`}
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  emotionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  emotionButton: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedEmotionButton: {
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  emotionEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  emotionName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
  },
  confirmButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MoodCheckModal;