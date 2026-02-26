import { Colors } from '@/constants/theme';
import { useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const { addHabit, completeOnboarding } = useHabits();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [habitName, setHabitName] = useState('');
    const [habitTime, setHabitTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');
    const [loading, setLoading] = useState(false);

    const handleStart = async () => {
        if (!habitName.trim()) {
            alert('Please enter a habit name');
            return;
        }
        if (loading) return;
        setLoading(true);
        try {
            await addHabit(habitName, habitTime);
            await completeOnboarding();
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (selectedDate) {
            setHabitTime(selectedDate);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Welcome to HABITZZ</Text>
                        <Text style={[styles.subtitle, { color: colors.text }]}>Start small, achieve big.</Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>What's your first micro-habit?</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                            placeholder="e.g., Drink water, Read 5 pages"
                            placeholderTextColor="#999"
                            value={habitName}
                            onChangeText={setHabitName}
                        />

                        <View style={styles.timeSection}>
                            <Text style={[styles.label, { color: colors.text, marginBottom: 0 }]}>Reminder Time</Text>

                            {Platform.OS === 'android' && (
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    style={[styles.timeDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}
                                >
                                    <Text style={[styles.timeText, { color: colors.primary }]}>
                                        {habitTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {Platform.OS === 'ios' && (
                                <DateTimePicker
                                    testID="dateTimePicker"
                                    value={habitTime}
                                    mode="time"
                                    display="compact"
                                    onChange={onDateChange}
                                    themeVariant={colorScheme ?? 'light'}
                                />
                            )}
                        </View>

                        {Platform.OS === 'android' && showTimePicker && (
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={habitTime}
                                mode="time"
                                // @ts-ignore
                                is24Hour={false}
                                display="spinner"
                                onChange={onDateChange}
                            />
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.primary, opacity: loading ? 0.75 : 1 }]}
                        onPress={handleStart}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Get Started</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
    },
    card: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    timeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
    },
    timeDisplay: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
