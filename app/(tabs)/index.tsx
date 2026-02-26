import { HabitItem } from '@/components/HabitItem';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { todayHabits, toggleHabit, deleteHabit } = useHabits();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [completedHabitName, setCompletedHabitName] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const completedCount = todayHabits.filter(h => h.completedDates.includes(today)).length;
  const totalCount = todayHabits.length;
  const remainingCount = totalCount - completedCount;
  const allDone = totalCount > 0 && completedCount === totalCount;
  const progress = totalCount > 0 ? completedCount / totalCount : 0;

  // Animated progress bar
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withSpring(progress, { damping: 14, stiffness: 80 });
  }, [progress]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%` as any,
  }));

  const handleToggleHabit = (id: string) => {
    const habit = todayHabits.find(h => h.id === id);
    const wasCompleted = habit?.completedDates.includes(today);

    toggleHabit(id);

    if (!wasCompleted && habit) {
      setCompletedHabitName(habit.name);
      setShowCompletionPopup(true);
      setTimeout(() => setShowCompletionPopup(false), 2000);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Today's Focus</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.success + '20' }]}>
            <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>Done</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{completedCount}</Text>
          </View>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.summaryIconContainer, { backgroundColor: colors.notification + '20' }]}>
            <IconSymbol name="flag.fill" size={24} color={colors.notification} />
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.icon }]}>Remaining</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{remainingCount}</Text>
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: allDone ? colors.success : colors.primary },
                progressBarStyle,
              ]}
            />
          </View>
          <Text style={[styles.progressLabel, { color: colors.icon }]}>
            {Math.round(progress * 100)}% complete
          </Text>
        </View>
      )}

      {/* All done banner */}
      {allDone && (
        <Animated.View
          entering={FadeInDown.springify().damping(12)}
          exiting={FadeOut}
          style={[styles.celebrationCard, { backgroundColor: colors.primary }]}
        >
          <IconSymbol name="star.fill" size={28} color="#fff" />
          <View style={styles.celebrationTextContainer}>
            <Text style={styles.celebrationTitle}>All done today! 🎉</Text>
            <Text style={styles.celebrationSubtitle}>Great work</Text>
          </View>
        </Animated.View>
      )}

      {/* Habit List */}
      <Animated.FlatList
        data={todayHabits}
        renderItem={({ item }) => (
          <HabitItem
            item={item}
            onToggle={handleToggleHabit}
            onDelete={deleteHabit}
          />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        itemLayoutAnimation={LinearTransition}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="plus.circle" size={48} color={colors.icon} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No habits yet today</Text>
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              Tap + to add your first habit for today
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modal')}
        activeOpacity={0.8}
      >
        <IconSymbol name="plus" size={30} color="#fff" />
      </TouchableOpacity>

      {/* Completion Popup */}
      <Modal
        visible={showCompletionPopup}
        transparent
        animationType="none"
        onRequestClose={() => setShowCompletionPopup(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={[styles.popupContainer, { backgroundColor: colors.card }]}
          >
            <View style={[styles.popupIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="checkmark.circle.fill" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.popupTitle, { color: colors.text }]}>Habit Done!</Text>
            <Text style={[styles.popupHabitName, { color: colors.text }]}>{completedHabitName}</Text>
            <View style={[styles.popupDivider, { backgroundColor: colors.primary }]} />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginTop: 4 },
  summaryContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 14, gap: 12 },
  summaryCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 12,
  },
  summaryIconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  summaryLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },
  progressContainer: { paddingHorizontal: 20, marginBottom: 16 },
  progressTrack: {
    height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { fontSize: 12, fontWeight: '500' },
  celebrationCard: {
    marginHorizontal: 20, marginBottom: 16, padding: 16,
    borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  celebrationTextContainer: { flex: 1 },
  celebrationTitle: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  celebrationSubtitle: { color: '#fff', fontSize: 13, opacity: 0.9 },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  emptyContainer: { padding: 48, alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  fab: {
    position: 'absolute', bottom: 30, right: 30,
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 8,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  popupContainer: {
    width: width * 0.75, maxWidth: 320, borderRadius: 20,
    padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 8,
  },
  popupIconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  popupTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  popupHabitName: { fontSize: 16, fontWeight: '500', textAlign: 'center', marginBottom: 16, opacity: 0.85 },
  popupDivider: { width: 40, height: 3, borderRadius: 2 },
});
