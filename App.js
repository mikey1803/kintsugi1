// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import CheckInScreen from './screens/CheckInScreen';
import HistoryScreen from './screens/HistoryScreen';
// UPDATED: Import the new ChatbotScreen
import ChatbotScreen from './screens/ChatbotScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Check In') {
              iconName = focused ? 'happy' : 'happy-outline';
            } else if (route.name === 'History') {
              iconName = focused ? 'time' : 'time-outline';
            } else if (route.name === 'Kintsugi AI') { // UPDATED: Name and icon
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Check In" component={CheckInScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
        {/* UPDATED: The third tab is now our chatbot */}
        <Tab.Screen name="Kintsugi AI" component={ChatbotScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}