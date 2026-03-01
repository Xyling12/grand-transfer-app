import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSize, Spacing } from '../../constants/Colors';

export default function PendingScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>⏳</Text>
            <Text style={styles.title}>Заявка на рассмотрении</Text>
            <Text style={styles.text}>
                Ваши документы отправлены администратору.{'\n'}
                Мы уведомим вас, когда заявка будет рассмотрена.
            </Text>
            <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                    💡 Обычно проверка занимает от 10 минут до 24 часов
                </Text>
            </View>
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
        color: Colors.text,
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
    infoCard: {
        backgroundColor: Colors.warningBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333300',
        padding: Spacing.lg,
    },
    infoText: {
        color: Colors.warning,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
});
