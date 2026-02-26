import { Colors } from '@/constants/theme';
import { useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddHabitModal() {
    const { addHabit } = useHabits();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];

    const [habitName, setHabitName] = useState('');
    const [habitTime, setHabitTime] = useState(new Date());
    const [showTimePicker, setShowTimePicker] = useState(Platform.OS === 'ios');

    const handleSave = async () => {
        if (!habitName.trim()) {
            alert('Please enter a habit name');
            return;
        }
        await addHabit(habitName, habitTime);
        router.back();
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
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Create New Habit</Text>
                        <Text style={[styles.subtitle, { color: colors.icon }]}>Build a better you, one habit at a time</Text>
                    </View>

                    {/* Form Card */}
                    <View style={[styles.formCard, { backgroundColor: colors.card }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Habit Name</Text>
                        <TextInput
                            style={[styles.input, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
                            placeholder="e.g., Meditate, Exercise, Read"
                            placeholderTextColor={colors.icon}
                            value={habitName}
                            onChangeText={setHabitName}
                            autoFocus
                        />

                        <View style={styles.divider} />

                        <View style={styles.timeSection}>
                            <View>
                                <Text style={[styles.label, { color: colors.text, marginBottom: 4 }]}>Reminder Time</Text>
                                <Text style={[styles.timeHint, { color: colors.icon }]}>Daily notification</Text>
                            </View>

                            {Platform.OS === 'android' && (
                                <TouchableOpacity
                                    onPress={() => setShowTimePicker(true)}
                                    style={[styles.timeDisplay, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
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

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => router.back()}
                        >
                            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveButtonText}>Create Habit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        opacity: 0.7,
    },
    formCard: {
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    label: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 10,
        letterSpacing: -0.2,
    },
    input: {
        height: 52,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.06)',
        marginVertical: 24,
    },
    timeSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeHint: {
        fontSize: 13,
        opacity: 0.6,
    },
    timeDisplay: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
    },
    button: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        borderWidth: 1,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
