import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/context/AuthContext';
import { useHabits } from '@/context/HabitContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// ─── Gamification helpers ────────────────────────────────────────────────────

function calcLevel(xp: number) {
    // XP thresholds grow by 50 each level: L1=50, L2=150, L3=300 …
    let level = 1;
    let threshold = 50;
    let remaining = xp;
    while (remaining >= threshold) {
        remaining -= threshold;
        level++;
        threshold += 50;
    }
    return { level, current: remaining, needed: threshold };
}



// ─── XP Progress bar ─────────────────────────────────────────────────────────

function XPBar({ pct, color }: { pct: number; color: string }) {
    const w = useSharedValue(0);
    useEffect(() => {
        w.value = withDelay(400, withSpring(pct, { damping: 14, stiffness: 70 }));
    }, [pct]);
    const style = useAnimatedStyle(() => ({ width: `${w.value * 100}%` as any }));
    return (
        <View style={xpStyles.track}>
            <Animated.View style={[xpStyles.fill, { backgroundColor: color }, style]} />
        </View>
    );
}

const xpStyles = StyleSheet.create({
    track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4 },
});

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({
    icon, iconBg, iconColor, num, lbl, delay, cardBg, cardBorder, textColor, labelColor,
}: any) {
    const scale = useSharedValue(0.85);
    useEffect(() => { scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 120 })); }, []);
    const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
        <Animated.View style={[styles.statTile, { backgroundColor: cardBg, borderColor: cardBorder }, animStyle]}>
            <View style={[styles.statIconBg, { backgroundColor: iconBg }]}>
                <IconSymbol name={icon} size={20} color={iconColor} />
            </View>
            <Text style={[styles.statNum, { color: textColor }]}>{num}</Text>
            <Text style={[styles.statLbl, { color: labelColor }]}>{lbl}</Text>
        </Animated.View>
    );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProfileScreen() {
    const { todayHabits, historyByDate } = useHabits();
    const { user, signOut } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ── Derived stats ────────────────────
    const totalCompletions = useMemo(() =>
        Object.values(historyByDate).reduce(
            (sum, entries) => sum + entries.filter(e => e.completed).length, 0
        ), [historyByDate]);

    const totalDays = useMemo(() => Object.keys(historyByDate).length, [historyByDate]);

    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = useMemo(() =>
        todayHabits.filter(h => h.completedDates.includes(today)).length,
        [todayHabits, today]
    );

    // best streak
    const bestStreak = useMemo(() => {
        const dates = Object.keys(historyByDate).sort();
        let streak = 0, best = 0, cur = 0;
        for (let i = 0; i < dates.length; i++) {
            const entries = historyByDate[dates[i]];
            const hasCompletion = entries.some(e => e.completed);
            if (hasCompletion) {
                if (i === 0) { cur = 1; }
                else {
                    const prev = new Date(dates[i - 1]);
                    const curr = new Date(dates[i]);
                    const diff = (curr.getTime() - prev.getTime()) / 86400000;
                    cur = diff === 1 ? cur + 1 : 1;
                }
                best = Math.max(best, cur);
            } else {
                cur = 0;
            }
        }
        return best;
    }, [historyByDate]);

    // XP = total completions, level
    const xp = totalCompletions;
    const { level, current: xpCurrent, needed: xpNeeded } = calcLevel(xp);
    const xpPct = xpNeeded > 0 ? xpCurrent / xpNeeded : 0;

    // ── Profile edits ────────────────────
    const [userName, setUserName] = useState('');
    const [userAge, setUserAge] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const nameRef = useRef<TextInput>(null);

    useEffect(() => { loadUserData(); }, []);

    const loadUserData = async () => {
        try {
            const name = await AsyncStorage.getItem('user_name') || '';
            const age = await AsyncStorage.getItem('user_age') || '';
            setUserName(name);
            setUserAge(age);
        } catch (e) { console.error(e); }
    };

    const saveUserData = async () => {
        try {
            await AsyncStorage.setItem('user_name', userName);
            await AsyncStorage.setItem('user_age', userAge);
            setIsEditing(false);
        } catch {
            Alert.alert('Error', 'Failed to save profile data');
        }
    };

    const handleSignOut = () =>
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
        ]);

    const getInitials = () => {
        if (userName) {
            const parts = userName.trim().split(' ');
            if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            return userName.substring(0, 2).toUpperCase();
        }
        return user?.email?.[0]?.toUpperCase() ?? '?';
    };

    // ── Theme tokens ─────────────────────
    const bg = isDark ? '#0d0d16' : '#f2f2f7';
    const cardBg = isDark ? 'rgba(26,26,40,0.95)' : '#ffffff';
    const cardBorder = isDark ? '#2a2a3e' : '#e8e8f0';
    const labelColor = isDark ? '#6e6e8a' : '#8e8e9a';
    const textColor = isDark ? '#ffffff' : '#0a0a14';
    const accent = '#6366f1';
    const accentSoft = isDark ? '#6366f128' : '#6366f114';


    return (
        <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── Hero header ───────────────────────────────────── */}
                <Animated.View entering={FadeIn.duration(500)} style={styles.heroWrapper}>
                    <LinearGradient
                        colors={['#4f46e5', '#7c3aed', '#a21caf']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroBg}
                    >
                        {/* Decorative circles */}
                        <View style={styles.decCircle1} />
                        <View style={styles.decCircle2} />

                        {/* Edit button */}
                        <TouchableOpacity
                            style={styles.heroEditBtn}
                            onPress={isEditing ? saveUserData : () => { setIsEditing(true); setTimeout(() => nameRef.current?.focus(), 100); }}
                            activeOpacity={0.8}
                        >
                            <BlurView intensity={30} tint="light" style={styles.heroEditBlur}>
                                <IconSymbol name={isEditing ? 'checkmark' : 'pencil'} size={14} color="#fff" />
                                <Text style={styles.heroEditText}>{isEditing ? 'Save' : 'Edit'}</Text>
                            </BlurView>
                        </TouchableOpacity>

                        {/* Avatar */}
                        <View style={styles.avatarRing}>
                            <LinearGradient
                                colors={['#fff4', '#fff1']}
                                style={styles.avatarGrad}
                            >
                                <Text style={styles.avatarInitials}>{getInitials()}</Text>
                            </LinearGradient>
                        </View>

                        {/* Name & email */}
                        {isEditing ? (
                            <TextInput
                                ref={nameRef}
                                style={styles.heroNameInput}
                                value={userName}
                                onChangeText={setUserName}
                                placeholder="Your name"
                                placeholderTextColor="rgba(255,255,255,0.5)"
                                autoFocus
                            />
                        ) : (
                            <Text style={styles.heroName}>
                                {userName || 'Your Name'}
                            </Text>
                        )}

                        {user?.email ? (
                            <View style={styles.heroPill}>
                                <IconSymbol name="envelope.fill" size={11} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.heroPillText}>{user.email}</Text>
                            </View>
                        ) : null}

                        {/* Level + XP */}
                        <View style={styles.xpContainer}>
                            <View style={styles.xpRow}>
                                <View style={styles.levelBadge}>
                                    <Text style={styles.levelText}>Lv {level}</Text>
                                </View>
                                <Text style={styles.xpLabel}>{xpCurrent} / {xpNeeded} XP</Text>
                                <Text style={styles.totalXP}>{xp} total</Text>
                            </View>
                            <XPBar pct={xpPct} color="#a5f3fc" />
                        </View>
                    </LinearGradient>
                </Animated.View>

                {/* ── Four stat tiles ───────────────────────────────── */}
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.statsGrid}>
                    <StatTile
                        icon="checkmark.circle.fill" iconBg="#34c75922" iconColor="#34c759"
                        num={todayCompleted} lbl={'Done\nToday'}
                        delay={0} cardBg={cardBg} cardBorder={cardBorder}
                        textColor={textColor} labelColor={labelColor}
                    />
                    <StatTile
                        icon="star.fill" iconBg={accentSoft} iconColor={accent}
                        num={totalCompletions} lbl={'Total\nDone'}
                        delay={60} cardBg={cardBg} cardBorder={cardBorder}
                        textColor={textColor} labelColor={labelColor}
                    />
                    <StatTile
                        icon="flame.fill" iconBg="#ef444422" iconColor="#ef4444"
                        num={bestStreak} lbl={'Best\nStreak'}
                        delay={120} cardBg={cardBg} cardBorder={cardBorder}
                        textColor={textColor} labelColor={labelColor}
                    />
                    <StatTile
                        icon="calendar" iconBg="#ff9f0a22" iconColor="#ff9f0a"
                        num={totalDays} lbl={'Days\nTracked'}
                        delay={180} cardBg={cardBg} cardBorder={cardBorder}
                        textColor={textColor} labelColor={labelColor}
                    />
                </Animated.View>

                {/* ── Info card ─────────────────────────────────────── */}
                <Animated.View
                    entering={FadeInDown.delay(200).springify()}
                    style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
                >
                    <Text style={[styles.cardTitle, { color: labelColor }]}>PERSONAL INFO</Text>

                    {/* Name row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: accentSoft }]}>
                            <IconSymbol name="person.fill" size={15} color={accent} />
                        </View>
                        <View style={styles.infoTextCol}>
                            <Text style={[styles.infoLbl, { color: labelColor }]}>NAME</Text>
                            {isEditing ? (
                                <TextInput
                                    ref={nameRef}
                                    style={[styles.infoInput, { color: textColor, borderColor: cardBorder, backgroundColor: bg }]}
                                    value={userName}
                                    onChangeText={setUserName}
                                    placeholder="Enter your name"
                                    placeholderTextColor={labelColor}
                                />
                            ) : (
                                <Text style={[styles.infoVal, { color: textColor }]}>{userName || 'Not set'}</Text>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: cardBorder }]} />

                    {/* Age row */}
                    <View style={styles.infoRow}>
                        <View style={[styles.infoIcon, { backgroundColor: '#ff9f0a20' }]}>
                            <IconSymbol name="birthday.cake.fill" size={15} color="#ff9f0a" />
                        </View>
                        <View style={styles.infoTextCol}>
                            <Text style={[styles.infoLbl, { color: labelColor }]}>AGE</Text>
                            {isEditing ? (
                                <TextInput
                                    style={[styles.infoInput, { color: textColor, borderColor: cardBorder, backgroundColor: bg }]}
                                    value={userAge}
                                    onChangeText={setUserAge}
                                    placeholder="Enter your age"
                                    placeholderTextColor={labelColor}
                                    keyboardType="number-pad"
                                />
                            ) : (
                                <Text style={[styles.infoVal, { color: textColor }]}>{userAge || 'Not set'}</Text>
                            )}
                        </View>
                    </View>

                    {/* Email row (read-only, always) */}
                    {user?.email && (
                        <>
                            <View style={[styles.divider, { backgroundColor: cardBorder }]} />
                            <View style={styles.infoRow}>
                                <View style={[styles.infoIcon, { backgroundColor: '#06b6d420' }]}>
                                    <IconSymbol name="envelope.fill" size={15} color="#06b6d4" />
                                </View>
                                <View style={styles.infoTextCol}>
                                    <Text style={[styles.infoLbl, { color: labelColor }]}>EMAIL</Text>
                                    <Text style={[styles.infoVal, { color: textColor }]}>{user.email}</Text>
                                </View>
                            </View>
                        </>
                    )}
                </Animated.View>


                {/* ── Edit profile / Sign out buttons ───────────────── */}
                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.btnRow}>
                    {/* Edit / Save */}
                    <TouchableOpacity
                        style={styles.editBtn}
                        onPress={isEditing ? saveUserData : () => setIsEditing(true)}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={['#818cf8', '#6366f1', '#4f46e5']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.editBtnInner}
                        >
                            <IconSymbol name={isEditing ? 'checkmark' : 'pencil'} size={16} color="#fff" />
                            <Text style={styles.editBtnText}>{isEditing ? 'Save Changes' : 'Edit Profile'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    {/* Sign out */}
                    <TouchableOpacity
                        style={[styles.signOutBtn, {
                            backgroundColor: isDark ? '#2a1a1a' : '#fff5f5',
                            borderColor: isDark ? '#4a2a2a' : '#ffd0d0',
                        }]}
                        onPress={handleSignOut}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="rectangle.portrait.and.arrow.right" size={16} color="#ff453a" />
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingBottom: 60 },

    // Hero
    heroWrapper: { marginBottom: 16 },
    heroBg: {
        paddingTop: 36,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
        overflow: 'hidden',
    },
    decCircle1: {
        position: 'absolute', width: 220, height: 220, borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: -60, right: -60,
    },
    decCircle2: {
        position: 'absolute', width: 160, height: 160, borderRadius: 80,
        backgroundColor: 'rgba(255,255,255,0.04)',
        bottom: -40, left: -40,
    },
    heroEditBtn: {
        position: 'absolute', top: 16, right: 16, borderRadius: 20, overflow: 'hidden',
    },
    heroEditBlur: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    heroEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },

    avatarRing: {
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
        marginBottom: 14, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    avatarGrad: {
        flex: 1, justifyContent: 'center', alignItems: 'center',
    },
    avatarInitials: { fontSize: 38, fontWeight: '800', color: '#fff' },

    heroName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
    heroNameInput: {
        fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6,
        borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.5)',
        paddingBottom: 2, minWidth: 160, textAlign: 'center',
    },
    heroPill: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,255,255,0.14)',
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 20, marginBottom: 18,
    },
    heroPillText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '500' },

    xpContainer: { width: '100%', gap: 8 },
    xpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    levelBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: 20,
    },
    levelText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    xpLabel: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500' },
    totalXP: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },

    // Stats grid
    statsGrid: {
        flexDirection: 'row', flexWrap: 'wrap',
        paddingHorizontal: 16, gap: 10, marginBottom: 16,
    },
    statTile: {
        width: (width - 32 - 30) / 4,
        borderRadius: 18, borderWidth: 1,
        paddingVertical: 14, alignItems: 'center', gap: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    statIconBg: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
    statNum: { fontSize: 22, fontWeight: '800', letterSpacing: -0.8 },
    statLbl: { fontSize: 10, fontWeight: '500', textAlign: 'center', lineHeight: 13 },

    // Card
    card: {
        marginHorizontal: 16, marginBottom: 16,
        borderRadius: 22, borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 10, elevation: 3,
        overflow: 'hidden',
        paddingVertical: 14,
    },
    cardTitle: {
        fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
        marginHorizontal: 18, marginBottom: 10,
    },

    // Info rows
    infoRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 12, gap: 14,
    },
    infoIcon: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    infoTextCol: { flex: 1 },
    infoLbl: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 2 },
    infoVal: { fontSize: 15, fontWeight: '500' },
    infoInput: {
        fontSize: 15, fontWeight: '500', borderWidth: 1, borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    divider: { height: 1, marginHorizontal: 18 },


    // Buttons
    btnRow: { paddingHorizontal: 16, gap: 10 },
    editBtn: {
        borderRadius: 16,
        shadowColor: '#6366f1', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
        overflow: 'hidden',
    },
    editBtnInner: {
        flexDirection: 'row', height: 52, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center', gap: 8,
    },
    editBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    signOutBtn: {
        flexDirection: 'row', height: 52, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, gap: 8,
    },
    signOutText: { fontSize: 16, fontWeight: '600', color: '#ff453a' },
});
