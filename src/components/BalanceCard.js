import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { borderRadius, spacing, fontSize, fontWeight } from '../config/theme';

/**
 * Credit-card style balance display.
 * Props:
 *   balance  – numeric balance to show
 *   theme    – current theme object
 */
export default function BalanceCard({ balance, theme }) {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(balance));

    return (
        <View style={[styles.wrapper, theme.shadow]}>
            <LinearGradient
                colors={[theme.cardGradientStart, theme.cardGradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                {/* Top row */}
                <View style={styles.topRow}>
                    <Text style={styles.label}>Your Balance</Text>
                    {/* <Text style={styles.badge}>VISA</Text> */}
                </View>

                {/* Amount */}
                <Text style={styles.amount}>$ {formatted}</Text>

                {/* Card number dots */}
                <View style={styles.dotsRow}>
                    {['••••', '••••', '••••', '••••'].map((g, i) => (
                        <Text key={i} style={styles.dots}>{g}</Text>
                    ))}
                    <Text style={styles.expiry}>11/26</Text>
                </View>

                {/* Decorative circles */}
                <View style={styles.circle1} />
                <View style={styles.circle2} />
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: borderRadius.xl,
        overflow: 'hidden',
    },
    gradient: {
        paddingVertical: 28,
        paddingHorizontal: spacing.lg,
        position: 'relative',
        overflow: 'hidden',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    label: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
    },
    badge: {
        color: '#FFF',
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        letterSpacing: 2,
        opacity: 0.9,
    },
    amount: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: fontWeight.bold,
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    dots: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        letterSpacing: 2,
    },
    expiry: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        marginLeft: 'auto',
    },
    circle1: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,255,255,0.06)',
        top: -50,
        right: -40,
    },
    circle2: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.04)',
        bottom: -30,
        left: -20,
    },
});
