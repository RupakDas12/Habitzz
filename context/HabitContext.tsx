import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Habit } from '../types/habit';
import { useAuth } from './AuthContext';

// ── Helpers ────────────────────────────────────────────────────────────────
const getToday = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

/** Returns the date string of the most recent Sunday (or today if today is Sunday) */
const getMostRecentSunday = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // getDay() = 0 on Sunday
    return d.toISOString().split('T')[0];
};

// ── Context Types ──────────────────────────────────────────────────────────
interface HistoryEntry {
    id: string;
    name: string;
    date: string;       // YYYY-MM-DD
    completed: boolean; // was it ticked that day?
}

interface HabitContextType {
    todayHabits: Habit[];
    historyByDate: Record<string, HistoryEntry[]>; // date → entries
    isOnboardingCompleted: boolean;
    isLoading: boolean;
    addHabit: (name: string, time: Date) => Promise<void>;
    toggleHabit: (id: string) => Promise<void>;
    completeOnboarding: () => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────
export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [allHabits, setAllHabits] = useState<Habit[]>([]);
    const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        } else {
            setAllHabits([]);
            setIsLoading(false);
        }
    }, [user]);

    // ── Load ───────────────────────────────────────────────────────────────
    const loadData = async () => {
        setIsLoading(true);
        try {
            // Onboarding flag (device-local)
            const storedOnboarding = await AsyncStorage.getItem('@onboarding_complete');
            if (storedOnboarding === 'true') setIsOnboardingCompleted(true);

            // Weekly reset check — runs silently on every app open
            await checkWeeklyReset();

            // Load all habits from Supabase
            const { data, error } = await supabase
                .from('habits')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const parsed: Habit[] = (data ?? []).map((row: any) => ({
                id: row.id,
                name: row.name,
                time: new Date(`1970-01-01T${row.time}`),
                date: row.date ?? getToday(),
                completedDates: row.completed_dates ?? [],
                createdAt: row.created_at,
            }));
            setAllHabits(parsed);
        } catch (e) {
            console.error('Failed to load habits', e);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Weekly Reset ───────────────────────────────────────────────────────
    const checkWeeklyReset = async () => {
        const today = getToday();
        const todayDate = new Date();
        if (todayDate.getDay() !== 0) return; // Only run on Sunday

        const thisSunday = getMostRecentSunday();
        const lastReset = await AsyncStorage.getItem('@last_weekly_reset');
        if (lastReset === thisSunday) return; // Already reset this Sunday

        const { error } = await supabase
            .from('habits')
            .delete()
            .lt('date', today);

        if (!error) {
            await AsyncStorage.setItem('@last_weekly_reset', thisSunday);
        } else {
            console.error('Weekly reset error', error);
        }
    };

    // ── Notifications ──────────────────────────────────────────────────────
    const scheduleNotification = async (name: string, time: Date) => {
        const Notifications = require('@/lib/notifications').default;
        if (!Notifications) return;

        try {
            const { status } = await Notifications.getPermissionsAsync();
            if (status !== 'granted') {
                const { status: newStatus } = await Notifications.requestPermissionsAsync();
                if (newStatus !== 'granted') return;
            }
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Habit Reminder',
                    body: `It's time for your habit: ${name}`,
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DAILY,
                    hour: time.getHours(),
                    minute: time.getMinutes(),
                },
            });
        } catch (e) {
            console.error('Failed to schedule notification', e);
        }
    };

    // ── CRUD ───────────────────────────────────────────────────────────────
    const addHabit = useCallback(async (name: string, time: Date) => {
        if (!user) return;
        const today = getToday();
        const timeStr = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
        const createdAt = Date.now();

        const { data, error } = await supabase
            .from('habits')
            .insert({
                user_id: user.id,
                name,
                time: timeStr,
                date: today,
                completed_dates: [],
                created_at: createdAt,
            })
            .select()
            .single();

        if (error) { console.error('addHabit error', error); return; }

        const newHabit: Habit = {
            id: data.id,
            name: data.name,
            time: new Date(`1970-01-01T${data.time}`),
            date: data.date,
            completedDates: [],
            createdAt: data.created_at,
        };
        setAllHabits(prev => [...prev, newHabit]);
        await scheduleNotification(name, time);
    }, [user]);

    const toggleHabit = useCallback(async (id: string) => {
        const today = getToday();
        const habit = allHabits.find(h => h.id === id);
        if (!habit || habit.date !== today) return;

        const isCompleted = habit.completedDates.includes(today);
        const newDates = isCompleted
            ? habit.completedDates.filter(d => d !== today)
            : [...habit.completedDates, today];

        const { error } = await supabase
            .from('habits')
            .update({ completed_dates: newDates })
            .eq('id', id);

        if (error) { console.error('toggleHabit error', error); return; }
        setAllHabits(prev => prev.map(h => h.id === id ? { ...h, completedDates: newDates } : h));
    }, [allHabits]);

    const deleteHabit = useCallback(async (id: string) => {
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) { console.error('deleteHabit error', error); return; }
        setAllHabits(prev => prev.filter(h => h.id !== id));
    }, []);

    const completeOnboarding = useCallback(async () => {
        setIsOnboardingCompleted(true);
        await AsyncStorage.setItem('@onboarding_complete', 'true');
    }, []);

    // ── Derived State (memoized) ──────────────────────────────────────────
    const today = getToday();

    const todayHabits = useMemo(
        () => allHabits.filter(h => h.date === today),
        [allHabits, today]
    );

    const historyByDate = useMemo(() => {
        const map: Record<string, HistoryEntry[]> = {};
        allHabits
            .filter(h => h.date < today)
            .forEach(h => {
                const entry: HistoryEntry = {
                    id: h.id,
                    name: h.name,
                    date: h.date,
                    completed: h.completedDates.includes(h.date),
                };
                if (!map[h.date]) map[h.date] = [];
                map[h.date].push(entry);
            });
        return map;
    }, [allHabits, today]);

    return (
        <HabitContext.Provider value={{
            todayHabits,
            historyByDate,
            isOnboardingCompleted,
            isLoading,
            addHabit,
            toggleHabit,
            completeOnboarding,
            deleteHabit,
        }}>
            {children}
        </HabitContext.Provider>
    );
};

export const useHabits = () => {
    const context = useContext(HabitContext);
    if (!context) throw new Error('useHabits must be used within a HabitProvider');
    return context;
};
