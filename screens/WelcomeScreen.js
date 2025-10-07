import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ onGetStarted }) => {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B6B" />
      
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart" size={60} color="white" />
        </View>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>Kintsugi</Text>
        <Text style={styles.subtitle}>
          Your empathetic AI companion for emotional wellness
        </Text>
      </View>

      <View style={styles.featuresContainer}>
        <View style={styles.feature}>
          <Ionicons name="chatbubbles" size={32} color="#FF6B6B" />
          <Text style={styles.featureTitle}>Compassionate Conversations</Text>
          <Text style={styles.featureDescription}>
            Talk to an AI that truly understands and cares about your feelings
          </Text>
        </View>

        <View style={styles.feature}>
          <Ionicons name="trending-up" size={32} color="#4CAF50" />
          <Text style={styles.featureTitle}>Mood Tracking</Text>
          <Text style={styles.featureDescription}>
            Monitor your emotional journey with gentle daily check-ins
          </Text>
        </View>

        <View style={styles.feature}>
          <Ionicons name="leaf" size={32} color="#2196F3" />
          <Text style={styles.featureTitle}>Kintsugi Wisdom</Text>
          <Text style={styles.featureDescription}>
            Learn the art of finding beauty in life's broken moments
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={onGetStarted}>
        <Text style={styles.startButtonText}>Start Your Journey</Text>
        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        A safe space for your thoughts and feelings 💙
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 24,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  feature: {
    alignItems: 'center',
    marginBottom: 24,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  startButtonText: {
    color: '#FF6B6B',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#FF6B6B',
  },
  disclaimer: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default WelcomeScreen;