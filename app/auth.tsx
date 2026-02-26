import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
    const { signIn, signUp } = useAuth();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const bg = isDark ? '#12121a' : '#f2f2f7';
    const cardBg = isDark ? '#1e1e2e' : '#ffffff';
    const cardBorder = isDark ? '#2e2e3e' : '#e8e8f0';
    const textColor = isDark ? '#fff' : '#111';
    const subtleText = isDark ? '#888' : '#999';
    const accent = '#5050cc';

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak password', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        const fn = mode === 'signin' ? signIn : signUp;
        const { error } = await fn(email.trim(), password);
        setLoading(false);

        if (error) {
            Alert.alert(mode === 'signin' ? 'Sign In Failed' : 'Sign Up Failed', error);
        } else if (mode === 'signup') {
            Alert.alert(
                'Check your email',
                'We sent you a confirmation link. Please verify your email then sign in.',
            );
            setMode('signin');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    {/* Header */}
                    <View style={styles.header}>
                        <Image
                            source={require('@/assets/images/icon.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.appName, { color: accent }]}>HABITZZ</Text>
                        <Text style={[styles.tagline, { color: subtleText }]}>
                            {mode === 'signin' ? 'Welcome back 👋' : 'Create your account'}
                        </Text>
                    </View>

                    {/* Card */}
                    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.label, { color: subtleText }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: cardBorder, backgroundColor: bg }]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            placeholderTextColor={subtleText}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Text style={[styles.label, { color: subtleText, marginTop: 16 }]}>Password</Text>
                        <TextInput
                            style={[styles.input, { color: textColor, borderColor: cardBorder, backgroundColor: bg }]}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Min. 6 characters"
                            placeholderTextColor={subtleText}
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: accent, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleSubmit}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Toggle */}
                    <TouchableOpacity
                        onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        style={styles.toggle}
                    >
                        <Text style={[styles.toggleText, { color: subtleText }]}>
                            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                            <Text style={{ color: accent, fontWeight: '600' }}>
                                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                            </Text>
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    flex: { flex: 1 },
    scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 36 },
    logo: { width: 100, height: 100, marginBottom: 16 },
    appName: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
    tagline: { fontSize: 16, marginTop: 6 },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 24,
        marginBottom: 20,
    },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    toggle: { alignItems: 'center', paddingVertical: 8 },
    toggleText: { fontSize: 14 },
});
