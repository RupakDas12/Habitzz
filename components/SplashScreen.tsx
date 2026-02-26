import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, useColorScheme } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const iconScale = useSharedValue(0.5);
    const iconOpacity = useSharedValue(0);
    const textOpacity = useSharedValue(0);
    const textTranslateY = useSharedValue(16);
    const subtitleOpacity = useSharedValue(0);
    const fadeOut = useSharedValue(1);

    useEffect(() => {
        // 1. Icon fades in + scales up with gentle overshoot
        iconOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
        iconScale.value = withSequence(
            withTiming(1.06, { duration: 500, easing: Easing.out(Easing.cubic) }),
            withTiming(1, { duration: 250, easing: Easing.inOut(Easing.cubic) }),
        );

        // 2. Title slides up + fades in
        textOpacity.value = withDelay(350, withTiming(1, { duration: 450 }));
        textTranslateY.value = withDelay(350, withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) }));

        // 3. Tagline fades in
        subtitleOpacity.value = withDelay(650, withTiming(1, { duration: 350 }));

        // 4. Whole screen fades out
        fadeOut.value = withDelay(4600, withTiming(0, { duration: 400, easing: Easing.in(Easing.cubic) }));

        const timer = setTimeout(onFinish, 5000);
        return () => clearTimeout(timer);
    }, []);

    const iconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
        transform: [{ scale: iconScale.value }],
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: textOpacity.value,
        transform: [{ translateY: textTranslateY.value }],
    }));

    const taglineStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => ({
        opacity: fadeOut.value,
    }));

    return (
        <Animated.View
            style={[
                styles.container,
                { backgroundColor: isDark ? '#0a0a0a' : '#ffffff' },
                containerStyle,
            ]}
        >
            <Animated.View style={[styles.iconWrap, iconStyle]}>
                <Image
                    source={require('@/assets/images/icon.png')}
                    style={styles.icon}
                    resizeMode="contain"
                />
            </Animated.View>

            <Animated.View style={titleStyle}>
                <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>
                    HABITZZ
                </Text>
            </Animated.View>

            <Animated.View style={taglineStyle}>
                <Text
                    style={[
                        styles.tagline,
                        { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)' },
                    ]}
                >
                    small steps, big changes
                </Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrap: {
        width: 140,
        height: 140,
        marginBottom: 28,
    },
    icon: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 32,
        fontWeight: '300',
        letterSpacing: 1.5,
        marginBottom: 6,
    },
    tagline: {
        fontSize: 13,
        fontWeight: '400',
        letterSpacing: 3,
        textTransform: 'uppercase',
    },
});
