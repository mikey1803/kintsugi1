// utils/GamificationSystem.js
// Gamification system for wellness activities

import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

class GamificationSystem {
  constructor() {
    this.userId = 'default_user'; // In production, use actual user ID
  }

  // Points system
  POINTS = {
    WELLNESS_CHECKIN: 50,
    BREATHING_EXERCISE: 30,
    GROUNDING_EXERCISE: 30,
    GRATITUDE_JOURNAL: 40,
    MINDFULNESS_TIMER: 25,
    FOCUS_PUZZLE: 35,
    MUSIC_ACTIVITY: 20,
    RELAXATION_EXERCISE: 35,
    VISUALIZATION: 30,
    MOTIVATIONAL_QUIZ: 25,
    CHAT_SESSION: 15,
    DAILY_STREAK: 100,
  };

  // Badge definitions
  BADGES = {
    // Beginner badges
    FIRST_STEPS: {
      id: 'first_steps',
      name: 'First Steps',
      emoji: '🌱',
      description: 'Complete your first wellness check-in',
      requirement: 1,
      type: 'checkin',
    },
    BREATHE_EASY: {
      id: 'breathe_easy',
      name: 'Breathe Easy',
      emoji: '🌬️',
      description: 'Complete 5 breathing exercises',
      requirement: 5,
      type: 'breathing',
    },
    GRATEFUL_HEART: {
      id: 'grateful_heart',
      name: 'Grateful Heart',
      emoji: '✨',
      description: 'Write 10 gratitude entries',
      requirement: 10,
      type: 'gratitude',
    },
    
    // Intermediate badges
    MINDFUL_WARRIOR: {
      id: 'mindful_warrior',
      name: 'Mindful Warrior',
      emoji: '🧘',
      description: 'Complete 20 mindfulness activities',
      requirement: 20,
      type: 'mindfulness',
    },
    GROUNDING_MASTER: {
      id: 'grounding_master',
      name: 'Grounding Master',
      emoji: '🌿',
      description: 'Practice grounding 15 times',
      requirement: 15,
      type: 'grounding',
    },
    FOCUS_CHAMPION: {
      id: 'focus_champion',
      name: 'Focus Champion',
      emoji: '🎯',
      description: 'Complete 10 focus challenges',
      requirement: 10,
      type: 'focus',
    },
    
    // Streak badges
    SEVEN_DAY_STREAK: {
      id: 'seven_day_streak',
      name: '7-Day Warrior',
      emoji: '🔥',
      description: 'Maintain a 7-day wellness streak',
      requirement: 7,
      type: 'streak',
    },
    THIRTY_DAY_STREAK: {
      id: 'thirty_day_streak',
      name: '30-Day Legend',
      emoji: '⭐',
      description: 'Maintain a 30-day wellness streak',
      requirement: 30,
      type: 'streak',
    },
    HUNDRED_DAY_STREAK: {
      id: 'hundred_day_streak',
      name: '100-Day Master',
      emoji: '👑',
      description: 'Maintain a 100-day wellness streak',
      requirement: 100,
      type: 'streak',
    },
    
    // Advanced badges
    WELLNESS_GURU: {
      id: 'wellness_guru',
      name: 'Wellness Guru',
      emoji: '🌟',
      description: 'Earn 1000 total points',
      requirement: 1000,
      type: 'points',
    },
    CONSISTENCY_KING: {
      id: 'consistency_king',
      name: 'Consistency King',
      emoji: '💎',
      description: 'Complete activities 50 days',
      requirement: 50,
      type: 'days',
    },
    SELF_CARE_CHAMPION: {
      id: 'self_care_champion',
      name: 'Self-Care Champion',
      emoji: '🏆',
      description: 'Earn 5000 total points',
      requirement: 5000,
      type: 'points',
    },
  };

  // Initialize user progress
  async initializeUser() {
    try {
      const userRef = doc(db, 'gamification', this.userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          totalPoints: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: null,
          badges: [],
          activityCounts: {
            checkin: 0,
            breathing: 0,
            gratitude: 0,
            mindfulness: 0,
            grounding: 0,
            focus: 0,
            chat: 0,
            totalActivities: 0,
          },
          createdAt: new Date(),
        });
      }

      return await this.getUserProgress();
    } catch (error) {
      console.error('Error initializing user:', error);
      return this.getDefaultProgress();
    }
  }

  // Get user progress
  async getUserProgress() {
    try {
      const userRef = doc(db, 'gamification', this.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data();
      }
      return this.getDefaultProgress();
    } catch (error) {
      console.error('Error getting user progress:', error);
      return this.getDefaultProgress();
    }
  }

  // Default progress for offline mode
  getDefaultProgress() {
    return {
      totalPoints: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      badges: [],
      activityCounts: {
        checkin: 0,
        breathing: 0,
        gratitude: 0,
        mindfulness: 0,
        grounding: 0,
        focus: 0,
        chat: 0,
        totalActivities: 0,
      },
    };
  }

  // Award points for activity
  async awardPoints(activityType) {
    try {
      const points = this.POINTS[activityType] || 10;
      const userRef = doc(db, 'gamification', this.userId);
      
      // Check if user exists, initialize if not
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await this.initializeUser();
      }
      
      // Update streak
      const streakUpdate = await this.updateStreak();
      
      // Map activity type to counter
      const activityCountMap = {
        WELLNESS_CHECKIN: 'checkin',
        BREATHING_EXERCISE: 'breathing',
        GRATITUDE_JOURNAL: 'gratitude',
        GROUNDING_EXERCISE: 'grounding',
        MINDFULNESS_TIMER: 'mindfulness',
        FOCUS_PUZZLE: 'focus',
        MUSIC_ACTIVITY: 'mindfulness',
        RELAXATION_EXERCISE: 'mindfulness',
        VISUALIZATION: 'mindfulness',
        MOTIVATIONAL_QUIZ: 'mindfulness',
        CHAT_SESSION: 'chat',
      };

      const countKey = activityCountMap[activityType];

      // Get current progress
      const progress = await this.getUserProgress();

      // Update points and activity count
      await setDoc(userRef, {
        totalPoints: (progress.totalPoints || 0) + points,
        activityCounts: {
          ...progress.activityCounts,
          [countKey]: (progress.activityCounts[countKey] || 0) + 1,
          totalActivities: (progress.activityCounts.totalActivities || 0) + 1,
        },
      }, { merge: true });

      // Check for new badges
      const newBadges = await this.checkBadges();
      
      // Calculate new level
      const updatedProgress = await this.getUserProgress();
      const newLevel = this.calculateLevel(updatedProgress.totalPoints);
      
      if (newLevel > updatedProgress.level) {
        await setDoc(userRef, { level: newLevel }, { merge: true });
      }

      return {
        pointsAwarded: points,
        streakBonus: streakUpdate.bonusPoints,
        newBadges: newBadges,
        newLevel: newLevel > progress.level ? newLevel : null,
        totalPoints: progress.totalPoints + points + streakUpdate.bonusPoints,
      };
    } catch (error) {
      console.error('Error awarding points:', error);
      return { pointsAwarded: 0, streakBonus: 0, newBadges: [], newLevel: null };
    }
  }

  // Update daily streak
  async updateStreak() {
    try {
      const userRef = doc(db, 'gamification', this.userId);
      const userDoc = await getDoc(userRef);
      
      // Initialize user if doesn't exist
      if (!userDoc.exists()) {
        await this.initializeUser();
        return { currentStreak: 1, bonusPoints: 0 };
      }
      
      const progress = userDoc.data();
      
      const today = new Date().toDateString();
      const lastDate = progress.lastActivityDate ? new Date(progress.lastActivityDate.seconds * 1000).toDateString() : null;
      
      let newStreak = progress.currentStreak || 0;
      let bonusPoints = 0;

      if (lastDate !== today) {
        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDate === yesterdayStr) {
          // Continue streak
          newStreak += 1;
          bonusPoints = Math.floor(newStreak / 7) * 50; // Bonus every 7 days
        } else if (lastDate === null) {
          // First day
          newStreak = 1;
        } else {
          // Streak broken
          newStreak = 1;
        }

        await setDoc(userRef, {
          currentStreak: newStreak,
          longestStreak: newStreak > (progress.longestStreak || 0) ? newStreak : progress.longestStreak,
          lastActivityDate: new Date(),
          totalPoints: (progress.totalPoints || 0) + bonusPoints,
        }, { merge: true });
      }

      return {
        currentStreak: newStreak,
        bonusPoints: bonusPoints,
      };
    } catch (error) {
      console.error('Error updating streak:', error);
      return { currentStreak: 0, bonusPoints: 0 };
    }
  }

  // Check for new badges
  async checkBadges() {
    try {
      const progress = await this.getUserProgress();
      const earnedBadges = progress.badges || [];
      const newBadges = [];

      for (const [key, badge] of Object.entries(this.BADGES)) {
        // Skip if already earned
        if (earnedBadges.includes(badge.id)) continue;

        let earned = false;

        switch (badge.type) {
          case 'checkin':
            earned = progress.activityCounts.checkin >= badge.requirement;
            break;
          case 'breathing':
            earned = progress.activityCounts.breathing >= badge.requirement;
            break;
          case 'gratitude':
            earned = progress.activityCounts.gratitude >= badge.requirement;
            break;
          case 'mindfulness':
            earned = progress.activityCounts.mindfulness >= badge.requirement;
            break;
          case 'grounding':
            earned = progress.activityCounts.grounding >= badge.requirement;
            break;
          case 'focus':
            earned = progress.activityCounts.focus >= badge.requirement;
            break;
          case 'streak':
            earned = progress.currentStreak >= badge.requirement;
            break;
          case 'points':
            earned = progress.totalPoints >= badge.requirement;
            break;
          case 'days':
            earned = progress.activityCounts.totalActivities >= badge.requirement;
            break;
        }

        if (earned) {
          newBadges.push(badge);
          earnedBadges.push(badge.id);
        }
      }

      // Save new badges
      if (newBadges.length > 0) {
        const userRef = doc(db, 'gamification', this.userId);
        await setDoc(userRef, {
          badges: earnedBadges,
        }, { merge: true });
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  // Calculate level based on points
  calculateLevel(points) {
    // Level formula: Level = floor(sqrt(points / 100)) + 1
    // Level 1: 0-99 points
    // Level 2: 100-399 points
    // Level 3: 400-899 points
    // etc.
    return Math.floor(Math.sqrt(points / 100)) + 1;
  }

  // Get points needed for next level
  getPointsForNextLevel(currentLevel) {
    const nextLevel = currentLevel + 1;
    return (nextLevel - 1) * (nextLevel - 1) * 100;
  }
}

export default new GamificationSystem();
