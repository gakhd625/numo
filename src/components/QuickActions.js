import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius, fontSize, fontWeight } from '../config/theme';

const actions = [
    { key: 'transfer', label: 'Transfer', icon: 'swap-vertical', colorKey: 'expense' },
    { key: 'voucher', label: 'Voucher', icon: 'pricetag', colorKey: 'actionPurple' },
    { key: 'request', label: 'Request', icon: 'arrow-down', colorKey: 'actionBlue' },
    { key: 'send', label: 'Send', icon: 'paper-plane', colorKey: 'primary' },
];

/**
 * QuickActions row.
 * Props:
 *   theme     – current theme object
 *   onAction  – (key: string) => void  (optional callback)
 */
export default function QuickActions({ theme, onAction }) {
    return (
        <View style={styles.row}>
            {actions.map(({ key, label, icon, colorKey }) => {
                const color = theme[colorKey] || theme.primary;
                return (
                    <TouchableOpacity
                        key={key}
                        style={styles.item}
                        activeOpacity={0.7}
                        onPress={() => onAction?.(key)}
                    >
                        <View style={[styles.iconBox, { backgroundColor: color + '18' }]}>
                            <Ionicons name={icon} size={22} color={color} />
                        </View>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg + 4,
    },
    item: {
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 52,
        height: 52,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    label: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
});
