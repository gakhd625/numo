import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 40;
const COLORS = [
    '#10B981', '#34D399', '#6EE7B7', // greens
    '#F59E0B', '#FBBF24',             // yellows
    '#EC4899', '#F472B6',             // pinks
    '#8B5CF6', '#A78BFA',             // purples
    '#3B82F6', '#60A5FA',             // blues
    '#EF4444', '#F87171',             // reds
];

function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

function ConfettiPiece({ delay, color, startX }) {
    const fallAnim = useRef(new Animated.Value(-40)).current;
    const swayAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    const size = randomBetween(6, 14);
    const isCircle = Math.random() > 0.5;
    const duration = randomBetween(2500, 4000);
    const swayAmount = randomBetween(-60, 60);

    useEffect(() => {
        const timeout = setTimeout(() => {
            Animated.parallel([
                Animated.timing(fallAnim, {
                    toValue: SCREEN_HEIGHT + 40,
                    duration,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(swayAnim, {
                        toValue: swayAmount,
                        duration: duration * 0.3,
                        useNativeDriver: true,
                    }),
                    Animated.timing(swayAnim, {
                        toValue: -swayAmount * 0.6,
                        duration: duration * 0.35,
                        useNativeDriver: true,
                    }),
                    Animated.timing(swayAnim, {
                        toValue: swayAmount * 0.3,
                        duration: duration * 0.35,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.timing(rotateAnim, {
                    toValue: randomBetween(2, 6),
                    duration,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration,
                    delay: duration * 0.6,
                    useNativeDriver: true,
                }),
            ]).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View
            style={[
                styles.confettiPiece,
                {
                    width: size,
                    height: isCircle ? size : size * 0.5,
                    borderRadius: isCircle ? size / 2 : 2,
                    backgroundColor: color,
                    left: startX,
                    transform: [
                        { translateY: fallAnim },
                        { translateX: swayAnim },
                        { rotate: spin },
                    ],
                    opacity: opacityAnim,
                },
            ]}
        />
    );
}

/**
 * Full-screen confetti celebration overlay.
 * Props:
 *   visible  – whether to show
 *   onDismiss – called when user taps or auto-dismiss
 */
export default function ConfettiCelebration({ visible, onDismiss }) {
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        if (visible) {
            // Generate confetti pieces
            const newPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
                id: i,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                startX: randomBetween(0, SCREEN_WIDTH - 14),
                delay: randomBetween(0, 600),
            }));
            setPieces(newPieces);

            // Animate the badge
            Animated.sequence([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 6,
                    useNativeDriver: true,
                }),
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss after 4 seconds
            const timeout = setTimeout(() => {
                onDismiss?.();
            }, 4500);
            return () => clearTimeout(timeout);
        } else {
            scaleAnim.setValue(0);
            textOpacity.setValue(0);
            setPieces([]);
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onDismiss}>
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onDismiss}
            >
                {/* Confetti pieces */}
                {pieces.map((p) => (
                    <ConfettiPiece
                        key={p.id}
                        color={p.color}
                        startX={p.startX}
                        delay={p.delay}
                    />
                ))}

                {/* Center celebration badge */}
                <Animated.View
                    style={[
                        styles.badge,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    <View style={styles.trophyCircle}>
                        <Ionicons name="trophy" size={52} color="#F59E0B" />
                    </View>
                    <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
                        🎉 Goal Achieved! 🎉
                    </Animated.Text>
                    <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
                        Congratulations! You reached your savings goal.
                    </Animated.Text>
                    <Animated.View style={{ opacity: textOpacity }}>
                        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                            <Text style={styles.dismissText}>Awesome!</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confettiPiece: {
        position: 'absolute',
        top: 0,
    },
    badge: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        paddingHorizontal: 36,
        paddingTop: 40,
        paddingBottom: 28,
        alignItems: 'center',
        width: SCREEN_WIDTH * 0.82,
        maxWidth: 340,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },
    trophyCircle: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },
    dismissButton: {
        backgroundColor: '#10B981',
        paddingHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 16,
    },
    dismissText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
