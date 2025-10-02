// screens/ChatbotScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

const API_URL = 'https://kintsugi-ndn896rsa-karthibans-projects-ade1358f.vercel.app'; 

const BOT_USER = {
  _id: 2,
  name: 'Kintsugi AI',
  avatar: 'https://i.imgur.com/gPcrbBC.png',
};

const ChatbotScreen = () => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'Hello! I am Kintsugi, your personal wellness companion. How can I help you today?',
        createdAt: new Date(),
        user: BOT_USER,
      },
    ]);
  }, []);

  const onSend = useCallback((messages = []) => {
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, messages),
    );

    const userMessage = messages[0].text;
    const history = messages.slice(1).reverse().map(msg => ({
        role: msg.user._id === 1 ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));

    // --- MODIFIED FETCH LOGIC TO CAPTURE THE ERROR ---
    fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: userMessage, history: history }),
    })
      .then(response => response.text()) // 1. Get the raw text response first
      .then(text => {
        // 2. Log the raw text to the console for us to see
        console.log("--- RAW SERVER RESPONSE ---");
        console.log(text);
        console.log("---------------------------");

        // 3. Now, try to parse it as JSON
        const data = JSON.parse(text);

        if (data.reply) {
          const botMessage = {
            _id: new Date().getTime() + 1,
            text: data.reply,
            createdAt: new Date(),
            user: BOT_USER,
          };
          setMessages(previousMessages =>
            GiftedChat.append(previousMessages, [botMessage]),
          );
        } else {
          throw new Error(data.error || 'Invalid response from AI');
        }
      })
      .catch(error => {
        console.error("Failed to fetch AI response:", error);
        const errorMessage = {
            _id: new Date().getTime() + 1,
            text: "Sorry, I'm having trouble connecting. Please check the debug console for details.",
            createdAt: new Date(),
            user: BOT_USER,
        };
        setMessages(previousMessages =>
            GiftedChat.append(previousMessages, [errorMessage]),
        );
      });
  }, []);

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: '#007AFF',
          },
          left: {
            backgroundColor: '#E5E5EA',
          },
        }}
        textStyle={{
          right: {
            color: '#FFFFFF',
          },
          left: {
            color: '#000000',
          },
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{
          _id: 1,
        }}
        renderBubble={renderBubble}
        placeholder="Type your message here..."
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});

export default ChatbotScreen;