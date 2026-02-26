import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProgressScreen() {
    const { historyByDate, todayHabits } = useHabits();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // --- Chart Data Preparation ---
    const getChartDates = () => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d.toISOString().split('T')[0]);
        }
        return days;
    };
    const chartDates = getChartDates();
    const today = new Date().toISOString().split('T')[0];

    const chartData = chartDates.map(date => {
        let completed = 0;
        if (date === today) {
            completed = todayHabits.filter(h => h.completedDates.includes(today)).length;
        } else {
            const entries = historyByDate[date] || [];
            completed = entries.filter(e => e.completed).length;
        }
        return { date, count: completed };
    });

    const maxCount = Math.max(...chartData.map(d => d.count), 1); // Avoid div by zero

    // --- History List Data ---
    // If a date is selected in chart, show only that date.
    // Otherwise show all history (sorted descending).
    const allHistoryDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));
    const displayDates = selectedDate
        ? (selectedDate === today ? [] : (historyByDate[selectedDate] ? [selectedDate] : []))
        : allHistoryDates;

    // Helper for date formatting
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <Animated.View entering={FadeInDown.delay(100).springify()}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Progress</Text>
                </Animated.View>

                {/* --- Weekly Chart --- */}
                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.sectionContainer}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Last 7 Days</Text>
                    <View style={styles.chartContainer}>
                        {chartData.map((item, index) => (
                            <Bar
                                key={item.date}
                                index={index}
                                count={item.count}
                                max={maxCount}
                                date={item.date}
                                isActive={selectedDate === item.date}
                                onPress={() => setSelectedDate(selectedDate === item.date ? null : item.date)}
                                color={colors.primary}
                                textColor={colors.text}
                                subTextColor={colors.icon}
                            />
                        ))}
                    </View>
                </Animated.View>

                {/* --- History List --- */}
                <View style={[styles.historyHeader, { marginTop: 20 }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
                        {selectedDate
                            ? (selectedDate === today ? "Today's Activity (See Home)" : `History: ${formatDate(selectedDate)}`)
                            : 'History Log'}
                    </Text>
                    {selectedDate && (
                        <TouchableOpacity onPress={() => setSelectedDate(null)}>
                            <Text style={{ color: colors.primary, fontWeight: '600' }}>Clear Filter</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <Text style={[styles.resetNote, { color: colors.icon, marginBottom: 20, textAlign: 'left' }]}>
                    Resets every Sunday
                </Text>

                {displayDates.length === 0 ? (
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.emptyContainer}>
                        {selectedDate === today ? (
                            <Text style={[styles.emptyText, { color: colors.icon }]}>
                                Go to the Home screen to view today's habits.
                            </Text>
                        ) : (
                            <>
                                <IconSymbol name="clock" size={48} color={colors.icon} />
                                <Text style={[styles.emptyTitle, { color: colors.text }]}>No history found</Text>
                                <Text style={[styles.emptyText, { color: colors.icon }]}>
                                    Either no habits were tracked or history was reset.
                                </Text>
                            </>
                        )}
                    </Animated.View>
                ) : (
                    displayDates.map((date, dayIndex) => {
                        const entries = historyByDate[date];
                        const completedCount = entries.filter(e => e.completed).length;
                        const total = entries.length;

                        return (
                            <Animated.View
                                key={date}
                                entering={FadeInDown.delay(300 + dayIndex * 80).springify()}
                                style={styles.daySection}
                            >
                                {/* Day header */}
                                <View style={styles.dayHeader}>
                                    <Text style={[styles.dayTitle, { color: colors.text }]}>
                                        {formatDate(date)}
                                    </Text>
                                    <View style={[
                                        styles.dayBadge,
                                        { backgroundColor: completedCount === total ? colors.success + '20' : colors.notification + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.dayBadgeText,
                                            { color: completedCount === total ? colors.success : colors.notification }
                                        ]}>
                                            {completedCount}/{total}
                                        </Text>
                                    </View>
                                </View>

                                {/* Habit entries */}
                                <View style={[styles.dayCard, { backgroundColor: colors.card }]}>
                                    {entries.map((entry, i) => (
                                        <View key={entry.id}>
                                            <View style={styles.entryRow}>
                                                <View style={[
                                                    styles.entryIcon,
                                                    {
                                                        backgroundColor: entry.completed
                                                            ? colors.success + '20'
                                                            : colors.notification + '15',
                                                    }
                                                ]}>
                                                    <IconSymbol
                                                        name={entry.completed ? 'checkmark.circle.fill' : 'xmark.circle.fill'}
                                                        size={20}
                                                        color={entry.completed ? colors.success : colors.notification}
                                                    />
                                                </View>
                                                <View style={styles.entryContent}>
                                                    <Text style={[styles.entryName, { color: colors.text }]}>
                                                        {entry.name}
                                                    </Text>
                                                    <Text style={[styles.entryStatus, {
                                                        color: entry.completed ? colors.success : colors.notification
                                                    }]}>
                                                        {entry.completed ? 'Completed' : 'Missed'}
                                                    </Text>
                                                </View>
                                            </View>
                                            {i < entries.length - 1 && (
                                                <View style={[styles.entryDivider, { backgroundColor: colors.border }]} />
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </Animated.View>
                        );
                    })
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- Bar Component ---
const Bar = ({ index, count, max, date, color, isActive, onPress, textColor, subTextColor }: any) => {
    const height = useSharedValue(0);
    const opacity = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        const targetHeight = (count / max) * 120; // Max height 120px
        height.value = withDelay(index * 100, withSpring(targetHeight, { damping: 12, stiffness: 90 }));
        opacity.value = withDelay(index * 100 + 200, withTiming(1, { duration: 500 }));
    }, [count, max]);

    useEffect(() => {
        scale.value = withSpring(isActive ? 1.15 : 1, { damping: 10, stiffness: 100 });
    }, [isActive]);

    const animatedBarStyle = useAnimatedStyle(() => ({
        height: Math.max(height.value, 4), // Min height 4px to show "0" clearly
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.barWrapper}>
            <View style={styles.barContainer}>
                <Animated.View
                    style={[
                        styles.bar,
                        animatedBarStyle,
                        {
                            backgroundColor: color,
                            opacity: isActive || !count ? 1 : 0.6,
                        }
                    ]}
                />
            </View>
            <Text style={[styles.barLabel, { color: isActive ? textColor : subTextColor, fontWeight: isActive ? 'bold' : 'normal' }]}>
                {new Date(date).toLocaleDateString(undefined, { weekday: 'narrow' })}
            </Text>
            {isActive && count > 0 &&
                <Animated.Text entering={FadeInUp.springify()} style={[styles.barValuePopup, { color: textColor }]}>
                    {count}
                </Animated.Text>
            }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 48 },
    headerTitle: { fontSize: 34, fontWeight: 'bold', letterSpacing: -0.5, marginBottom: 20 },
    sectionContainer: { marginBottom: 10 },
    sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 20, letterSpacing: -0.3 },
    chartContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        height: 150, paddingHorizontal: 8, marginBottom: 10,
    },
    historyHeader: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5,
    },
    resetNote: { fontSize: 13, marginTop: 4 },
    emptyContainer: { alignItems: 'center', paddingTop: 40, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '600' },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    daySection: { marginBottom: 24 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    dayTitle: { fontSize: 16, fontWeight: '600', flex: 1 },
    dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    dayBadgeText: { fontSize: 13, fontWeight: '700' },
    dayCard: { borderRadius: 16, overflow: 'hidden' },
    entryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    entryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    entryContent: { flex: 1 },
    entryName: { fontSize: 15, fontWeight: '600' },
    entryStatus: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    entryDivider: { height: 1, marginHorizontal: 14 },
    // Bar styles
    barWrapper: { alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: 32 },
    barContainer: { flex: 1, justifyContent: 'flex-end', marginBottom: 8 },
    bar: { width: 12, borderRadius: 6 },
    barLabel: { fontSize: 12 },
    barValuePopup: { position: 'absolute', top: -25, fontSize: 14, fontWeight: 'bold' },
});
