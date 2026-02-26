import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Habit } from '@/types/habit';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeOutLeft,
    Layout,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    ZoomIn,
    ZoomOut
} from 'react-native-reanimated';

interface HabitItemProps {
    item: Habit;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export function HabitItem({ item, onToggle, onDelete }: HabitItemProps) {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const today = new Date().toISOString().split('T')[0];
    const isCompleted = item.completedDates.includes(today);

    // Animation values
    const scale = useSharedValue(1);

    const checkboxAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(isCompleted ? 1 : 0.8) }],
        backgroundColor: withTiming(isCompleted ? colors.success : 'transparent', { duration: 200 }),
        borderColor: withTiming(isCompleted ? colors.success : colors.icon, { duration: 200 }),
    }));

    const textAnimatedStyle = useAnimatedStyle(() => ({
        opacity: withTiming(isCompleted ? 0.45 : 1, { duration: 200 }),
    }));

    const handlePress = () => {
        scale.value = withSpring(0.9, {}, () => {
            scale.value = withSpring(1);
        });
        onToggle(item.id);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Habit',
            `Remove "${item.name}" from today's list?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete(item.id),
                },
            ]
        );
    };

    return (
        <Animated.View
            layout={Layout.springify()}
            entering={FadeInDown}
            exiting={FadeOutLeft}
            style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
            <TouchableOpacity
                style={styles.cardContent}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Animated.View style={[styles.checkbox, checkboxAnimatedStyle]}>
                    {isCompleted && (
                        <Animated.View entering={ZoomIn} exiting={ZoomOut}>
                            <IconSymbol name="checkmark" size={16} color="#fff" />
                        </Animated.View>
                    )}
                </Animated.View>
                <View style={styles.textContainer}>
                    <Animated.Text
                        style={[
                            styles.habitName,
                            { color: colors.text },
                            textAnimatedStyle,
                            isCompleted && styles.habitNameDone,
                        ]}
                    >
                        {item.name}
                    </Animated.Text>
                    <Text style={[styles.habitTime, { color: colors.icon }]}>
                        {item.time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                <IconSymbol name="trash.fill" size={20} color={colors.notification} />
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    habitName: {
        fontSize: 18,
        fontWeight: '600',
    },
    habitNameDone: {
        textDecorationLine: 'line-through',
    },
    habitTime: {
        fontSize: 14,
        marginTop: 2,
    },
    deleteButton: {
        padding: 8,
    },
});
