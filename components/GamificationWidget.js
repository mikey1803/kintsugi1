// components/GamificationWidget.js
// Display points, level, streak, and badges

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GamificationSystem from '../utils/GamificationSystem';

const GamificationWidget = ({ compact = false }) => {
  const [progress, setProgress] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    const userProgress = await GamificationSystem.getUserProgress();
    setProgress(userProgress);
  };

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (!progress) return null;

  const pointsForNextLevel = GamificationSystem.getPointsForNextLevel(progress.level);
  const pointsProgress = (progress.totalPoints / pointsForNextLevel) * 100;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <Text style={styles.compactEmoji}>⭐</Text>
            <Text style={styles.compactValue}>{progress.totalPoints}</Text>
          </View>
          <View style={styles.compactItem}>
            <Text style={styles.compactEmoji}>🔥</Text>
            <Text style={styles.compactValue}>{progress.currentStreak}</Text>
          </View>
          <View style={styles.compactItem}>
            <Text style={styles.compactEmoji}>🏆</Text>
            <Text style={styles.compactValue}>Lv {progress.level}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={styles.container}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.header}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {progress.level}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowModal(true)}>
            <Ionicons name="trophy" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{progress.totalPoints}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{progress.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🏅</Text>
            <Text style={styles.statValue}>{progress.badges?.length || 0}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(pointsProgress, 100)}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress.totalPoints} / {pointsForNextLevel} to Level {progress.level + 1}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Progress 🌟</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={28} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Level & Points */}
              <View style={styles.levelCard}>
                <Text style={styles.levelCardTitle}>Level {progress.level}</Text>
                <Text style={styles.pointsText}>{progress.totalPoints} Total Points</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.min(pointsProgress, 100)}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {pointsForNextLevel - progress.totalPoints} points to next level
                </Text>
              </View>

              {/* Streak */}
              <View style={styles.streakCard}>
                <Text style={styles.sectionTitle}>🔥 Streak Status</Text>
                <View style={styles.streakInfo}>
                  <View style={styles.streakItem}>
                    <Text style={styles.streakValue}>{progress.currentStreak}</Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                  </View>
                  <View style={styles.streakItem}>
                    <Text style={styles.streakValue}>{progress.longestStreak || 0}</Text>
                    <Text style={styles.streakLabel}>Longest Streak</Text>
                  </View>
                </View>
                <Text style={styles.streakNote}>
                  💡 Complete any activity daily to maintain your streak!
                </Text>
              </View>

              {/* Badges */}
              <View style={styles.badgesSection}>
                <Text style={styles.sectionTitle}>🏆 Badges ({progress.badges?.length || 0})</Text>
                <View style={styles.badgesGrid}>
                  {Object.values(GamificationSystem.BADGES).map((badge) => {
                    const earned = progress.badges?.includes(badge.id);
                    return (
                      <View
                        key={badge.id}
                        style={[styles.badgeCard, !earned && styles.badgeCardLocked]}
                      >
                        <Text style={[styles.badgeEmoji, !earned && styles.badgeEmojiLocked]}>
                          {badge.emoji}
                        </Text>
                        <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]}>
                          {badge.name}
                        </Text>
                        <Text style={styles.badgeDescription}>
                          {badge.description}
                        </Text>
                        {!earned && (
                          <Text style={styles.badgeRequirement}>
                            🔒 {badge.requirement} required
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Activity Stats */}
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>📊 Activity Stats</Text>
                {Object.entries(progress.activityCounts || {}).map(([key, value]) => {
                  if (key === 'totalActivities') return null;
                  const labels = {
                    checkin: 'Wellness Check-ins',
                    breathing: 'Breathing Exercises',
                    gratitude: 'Gratitude Entries',
                    mindfulness: 'Mindfulness Activities',
                    grounding: 'Grounding Exercises',
                    focus: 'Focus Challenges',
                    chat: 'Chat Sessions',
                  };
                  return (
                    <View key={key} style={styles.statRow}>
                      <Text style={styles.statRowLabel}>{labels[key]}</Text>
                      <Text style={styles.statRowValue}>{value}</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  compactItem: {
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  compactValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelCardTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  streakCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  streakInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B9D',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  streakNote: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  badgesSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  badgeCardLocked: {
    borderColor: '#E0E0E0',
    opacity: 0.6,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: '#999',
  },
  badgeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeRequirement: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statRowLabel: {
    fontSize: 14,
    color: '#2C3E50',
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4CAF50',
  },
});

export default GamificationWidget;
