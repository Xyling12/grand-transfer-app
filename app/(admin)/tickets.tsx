import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, Alert,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

export default function AdminTicketsScreen() {
    // Placeholder - no tickets yet
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyEmoji}>📩</Text>
                <Text style={styles.emptyTitle}>Тикеты</Text>
                <Text style={styles.emptyText}>Обращения и баг-репорты от пользователей будут отображаться здесь</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Открытых</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>В работе</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Закрытых</Text>
                </View>
            </View>

            <Text style={styles.hint}>Тикеты создаются пользователями через «Профиль → Написать в поддержку» или «Сообщить об ошибке»</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    emptyWrap: { alignItems: 'center', marginTop: 40, marginBottom: Spacing.xxl },
    emptyEmoji: { fontSize: 64, marginBottom: Spacing.lg },
    emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: Spacing.xl },
    statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
    statCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center' },
    statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary },
    statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
    hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
