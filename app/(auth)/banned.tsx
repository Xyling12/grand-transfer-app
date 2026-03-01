import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../../stores/authStore';
import { Colors, FontSize, Spacing } from '../../constants/Colors';

export default function BannedScreen() {
    const { logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>🚫</Text>
            <Text style={styles.title}>Доступ заблокирован</Text>
            <Text style={styles.text}>
                Ваш аккаунт заблокирован администратором.{'\n'}
                Для разблокировки обратитесь в поддержку.
            </Text>
            <TouchableOpacity style={styles.button} onPress={logout}>
                <Text style={styles.buttonText}>Выйти</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxl,
    },
    emoji: {
        fontSize: 72,
        marginBottom: Spacing.xxl,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.danger,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    text: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xxl,
    },
    button: {
        backgroundColor: Colors.surface,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.lg,
    },
    buttonText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },
});
