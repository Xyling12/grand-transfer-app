import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

interface Stats {
    totalOrders: number;
    completedOrders: number;
    activeOrders: number;
    totalDrivers: number;
    pendingDrivers: number;
    revenue: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<Stats>('/api/mobile/admin/stats');
                setStats(data);
            } catch (err: any) {
                // Fallback if no admin stats endpoint yet
                setStats({
                    totalOrders: 0, completedOrders: 0, activeOrders: 0,
                    totalDrivers: 0, pendingDrivers: 0, revenue: 0,
                });
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    const statCards = [
        { emoji: '📋', label: 'Всего заказов', value: stats?.totalOrders || 0, color: Colors.info, onPress: () => router.push({ pathname: '/(admin)/all-orders', params: { filter: 'all' } }) },
        { emoji: '✅', label: 'Выполнено', value: stats?.completedOrders || 0, color: Colors.success, onPress: () => router.push({ pathname: '/(admin)/all-orders', params: { filter: 'completed' } }) },
        { emoji: '🚗', label: 'Активных', value: stats?.activeOrders || 0, color: Colors.warning, onPress: () => router.push({ pathname: '/(admin)/all-orders', params: { filter: 'active' } }) },
        { emoji: '👥', label: 'Водителей', value: stats?.totalDrivers || 0, color: Colors.purple, onPress: () => router.push({ pathname: '/(admin)/users', params: { filter: 'approved' } }) },
        { emoji: '⏳', label: 'Ожидают верификации', value: stats?.pendingDrivers || 0, color: Colors.danger, onPress: () => router.push({ pathname: '/(admin)/users', params: { filter: 'pending' } }) },
        { emoji: '💰', label: 'Выручка', value: `${stats?.revenue || 0} ₽`, color: Colors.primary, onPress: () => Alert.alert('💰 Выручка', `Общая выручка: ${stats?.revenue || 0} ₽\nВыполненных заказов: ${stats?.completedOrders || 0}\nСредний чек: ${stats?.completedOrders ? Math.round((stats?.revenue || 0) / stats.completedOrders) : 0} ₽`) },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>📊 Панель управления</Text>

            <View style={styles.grid}>
                {statCards.map((card, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.statCard}
                        activeOpacity={0.7}
                        onPress={card.onPress}
                    >
                        <Text style={styles.statEmoji}>{card.emoji}</Text>
                        <Text style={[styles.statValue, { color: card.color }]}>
                            {card.value}
                        </Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Управление</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(admin)/users')}>
                <Text style={styles.menuEmoji}>👥</Text>
                <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Пользователи</Text>
                    <Text style={styles.menuDesc}>Верификация, роли, управление</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(admin)/all-orders')}>
                <Text style={styles.menuEmoji}>📋</Text>
                <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Все заказы</Text>
                    <Text style={styles.menuDesc}>Просмотр и управление</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(admin)/tickets')}>
                <Text style={styles.menuEmoji}>📩</Text>
                <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Тикеты</Text>
                    <Text style={styles.menuDesc}>Обращения и баг-репорты</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/(admin)/broadcast')}>
                <Text style={styles.menuEmoji}>📢</Text>
                <View style={styles.menuContent}>
                    <Text style={styles.menuTitle}>Рассылка</Text>
                    <Text style={styles.menuDesc}>Отправить сообщение всем</Text>
                </View>
                <Text style={styles.menuArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.menuItem, { marginTop: Spacing.lg }]}
                onPress={() => router.back()}
            >
                <Text style={styles.menuEmoji}>←</Text>
                <View style={styles.menuContent}>
                    <Text style={[styles.menuTitle, { color: Colors.textSecondary }]}>Назад к приложению</Text>
                </View>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 60 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    title: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xl },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xxl },
    statCard: {
        width: '48%',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    statEmoji: { fontSize: 28, marginBottom: Spacing.sm },
    statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
    statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs, textAlign: 'center' },
    sectionTitle: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    menuEmoji: { fontSize: 24, marginRight: Spacing.lg },
    menuContent: { flex: 1 },
    menuTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
    menuDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
    menuArrow: { color: Colors.textMuted, fontSize: FontSize.lg },
});
