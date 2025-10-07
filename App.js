// App.js

import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HistoryScreen from './screens/HistoryScreen';
import ChatbotScreen from './screens/ChatbotScreen';
import MoodCheckModal from './components/MoodCheckModal';

const Tab = createBottomTabNavigator();

export default function App() {
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [hasCheckedMoodToday, setHasCheckedMoodToday] = useState(false);
  const navigationRef = useRef();

  useEffect(() => {
    // Show mood modal after a short delay when app starts
    setTimeout(() => {
      setShowMoodModal(true);
    }, 1500);
  }, []);

  const handleMoodComplete = (selectedEmotion) => {
    console.log('Mood selected:', selectedEmotion);
    setHasCheckedMoodToday(true);
    setShowMoodModal(false);
    
    // Navigate to Kintsugi AI tab after mood check
    setTimeout(() => {
      if (navigationRef.current) {
        navigationRef.current.navigate('Kintsugi AI');
      }
    }, 500);
  };

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        <Tab.Navigator
          initialRouteName="Kintsugi AI"
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'History') {
                iconName = focused ? 'time' : 'time-outline';
              } else if (route.name === 'Kintsugi AI') {
                iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              } else if (route.name === 'Journal') {
                iconName = focused ? 'book' : 'book-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#FF6B6B',
            tabBarInactiveTintColor: 'gray',
            headerShown: false,
            tabBarStyle: {
              backgroundColor: 'white',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              paddingBottom: 8,
              paddingTop: 8,
              height: 60,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          })}
        >
          <Tab.Screen name="Kintsugi AI" component={ChatbotScreen} />
          <Tab.Screen name="History" component={HistoryScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      {/* Mood Check Modal */}
      <MoodCheckModal
        visible={showMoodModal}
        onComplete={handleMoodComplete}
      />
    </>
  );
}