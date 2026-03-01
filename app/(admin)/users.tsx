import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, ScrollView,
    StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateRole } from '../../utils/translations';
import type { Driver } from '../../types';

export default function AdminUsersScreen() {
    const [users, setUsers] = useState<Driver[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const params = useLocalSearchParams<{ filter?: string }>();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'banned' | 'driver' | 'dispatcher'>(params.filter as any || 'all');
    const router = useRouter();

    const fetchUsers = useCallback(async () => {
        try {
            const data = await apiFetch<{ users: Driver[] }>('/api/mobile/admin/users');
            setUsers(data.users || []);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    const onRefresh = () => { setRefreshing(true); fetchUsers(); };

    const approveUser = async (userId: string) => {
        try {
            await apiFetch('/api/mobile/admin/users', {
                method: 'POST',
                body: JSON.stringify({ action: 'approve', userId }),
            });
            Alert.alert('✅', 'Пользователь одобрен');
            fetchUsers();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        }
    };

    const banUser = async (userId: string) => {
        Alert.alert('Заблокировать?', 'Пользователь потеряет доступ', [
            { text: 'Отмена' },
            {
                text: 'Заблокировать',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await apiFetch('/api/mobile/admin/users', {
                            method: 'POST',
                            body: JSON.stringify({ action: 'ban', userId }),
                        });
                        fetchUsers();
                    } catch (err: any) {
                        Alert.alert('Ошибка', err.message);
                    }
                },
            },
        ]);
    };

    const filtered = users.filter(u => {
        if (filter === 'all') return true;
        if (filter === 'driver') return u.role === 'DRIVER';
        if (filter === 'dispatcher') return u.role === 'DISPATCHER';
        return u.status.toLowerCase() === filter;
    });

    const statusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return { text: '⏳ Ожидает', color: Colors.warning, bg: Colors.warningBg };
            case 'APPROVED': return { text: '✅ Активен', color: Colors.success, bg: Colors.successBg };
            case 'BANNED': return { text: '🚫 Забанен', color: Colors.danger, bg: Colors.dangerBg };
            default: return { text: status, color: Colors.textMuted, bg: Colors.surface };
        }
    };

    const renderUser = useCallback(({ item }: { item: Driver }) => {
        const badge = statusBadge(item.status);
        return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/user/${item.id}`)}>
                <View style={styles.cardHeader}>
                    <View style={styles.userInfo}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{item.fullFio?.charAt(0)?.toUpperCase() || '?'}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{item.fullFio || 'Без имени'}</Text>
                            <Text style={styles.userPhone}>{item.phone}</Text>
                        </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <Text style={styles.roleText}>{translateRole(item.role)}</Text>
                    {item.createdAt && (
                        <Text style={styles.dateText}>
                            Регистрация: {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                        </Text>
                    )}
                </View>

                {item.status === 'PENDING' && (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => approveUser(item.id)}>
                            <Text style={styles.approveText}>✅ Одобрить</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.rejectBtn} onPress={() => banUser(item.id)}>
                            <Text style={styles.rejectText}>❌ Отклонить</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {item.status === 'APPROVED' && (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.banBtn} onPress={() => banUser(item.id)}>
                            <Text style={styles.banText}>🚫 Заблокировать</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    }, []);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            {/* Filter tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
                {(['all', 'driver', 'dispatcher', 'pending', 'approved', 'banned'] as const).map(f => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === 'all' ? 'Все' : f === 'driver' ? '🚗 Водители' : f === 'dispatcher' ? '📋 Диспетчеры' : f === 'pending' ? '⏳ Ожидают' : f === 'approved' ? '✅ Активные' : '🚫 Бан'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filtered}
                renderItem={renderUser}
                keyExtractor={item => item.id}
                contentContainerStyle={filtered.length === 0 ? styles.empty : styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyEmoji}>👥</Text>
                        <Text style={styles.emptyText}>Нет пользователей</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    listContent: { padding: Spacing.lg },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
    emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
    filterScroll: { minHeight: 52, maxHeight: 56, borderBottomWidth: 1, borderBottomColor: Colors.border },
    filters: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        alignItems: 'center',
    },
    filterBtn: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },
    filterTextActive: { color: '#fff', fontWeight: '700' },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    userInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + '30', justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
    userName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
    userPhone: { color: Colors.textMuted, fontSize: FontSize.xs },
    badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    badgeText: { fontSize: FontSize.xs, fontWeight: '600' },
    cardBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    roleText: { color: Colors.textSecondary, fontSize: FontSize.sm },
    dateText: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
    approveBtn: { flex: 1, padding: Spacing.md, alignItems: 'center', backgroundColor: Colors.success + '10' },
    approveText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600' },
    rejectBtn: { flex: 1, padding: Spacing.md, alignItems: 'center' },
    rejectText: { color: Colors.danger, fontSize: FontSize.sm },
    banBtn: { flex: 1, padding: Spacing.md, alignItems: 'center' },
    banText: { color: Colors.danger, fontSize: FontSize.sm },
});
