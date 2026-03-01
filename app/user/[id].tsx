import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateRole } from '../../utils/translations';
import type { Driver } from '../../types';

export default function UserDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [user, setUser] = useState<Driver | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const data = await apiFetch<{ users: Driver[] }>('/api/mobile/admin/users');
                const found = (data.users || []).find(u => u.id === id);
                setUser(found || null);
            } catch (err: any) {
                Alert.alert('Ошибка', err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const approveUser = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await apiFetch('/api/mobile/admin/users', {
                method: 'POST', body: JSON.stringify({ action: 'approve', userId: user.id }),
            });
            Alert.alert('✅', 'Пользователь одобрен');
            router.back();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const banUser = async () => {
        if (!user) return;
        Alert.alert('Заблокировать?', 'Пользователь потеряет доступ', [
            { text: 'Отмена' },
            {
                text: 'Заблокировать', style: 'destructive',
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await apiFetch('/api/mobile/admin/users', {
                            method: 'POST', body: JSON.stringify({ action: 'ban', userId: user.id }),
                        });
                        Alert.alert('🚫', 'Пользователь заблокирован');
                        router.back();
                    } catch (err: any) {
                        Alert.alert('Ошибка', err.message);
                    } finally {
                        setActionLoading(false);
                    }
                },
            },
        ]);
    };

    if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

    if (!user) return (
        <View style={s.centered}>
            <Text style={{ fontSize: 56 }}>🔍</Text>
            <Text style={s.emptyText}>Пользователь не найден</Text>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Text style={s.backBtnText}>← Назад</Text>
            </TouchableOpacity>
        </View>
    );

    const statusInfo = user.status === 'PENDING'
        ? { text: '⏳ Ожидает верификации', color: Colors.warning, bg: Colors.warningBg }
        : user.status === 'APPROVED'
            ? { text: '✅ Активен', color: Colors.success, bg: Colors.successBg }
            : { text: '🚫 Заблокирован', color: Colors.danger, bg: Colors.dangerBg };

    return (
        <ScrollView style={s.container} contentContainerStyle={s.scroll}>
            {/* Avatar & name */}
            <View style={s.profileCard}>
                <View style={s.avatar}>
                    <Text style={s.avatarText}>{user.fullFio?.charAt(0)?.toUpperCase() || '?'}</Text>
                </View>
                <Text style={s.name}>{user.fullFio || 'Без имени'}</Text>
                <View style={[s.badge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[s.badgeText, { color: statusInfo.color }]}>{statusInfo.text}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={s.card}>
                <Text style={s.section}>Информация</Text>
                <Row label="👤 Роль" value={translateRole(user.role)} />
                <Row label="📱 Телефон" value={user.phone || '—'} />
                <Row label="🆔 ID" value={user.id.slice(0, 12) + '...'} />
                {user.createdAt && <Row label="📅 Регистрация" value={new Date(user.createdAt).toLocaleDateString('ru-RU')} />}
                {user.subExpiresAt && <Row label="💎 Подписка до" value={new Date(user.subExpiresAt).toLocaleDateString('ru-RU')} />}
            </View>

            {/* Phone */}
            {user.phone && (
                <TouchableOpacity style={s.phoneBtn} onPress={() => Linking.openURL(`tel:${user.phone}`)}>
                    <Text style={s.phoneBtnText}>📞 Позвонить {user.phone}</Text>
                </TouchableOpacity>
            )}

            {/* Actions */}
            {user.status === 'PENDING' && (
                <View style={s.actions}>
                    <TouchableOpacity style={[s.approveBtn, actionLoading && { opacity: 0.6 }]} onPress={approveUser} disabled={actionLoading}>
                        <Text style={s.approveBtnText}>✅ Одобрить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.banBtn, actionLoading && { opacity: 0.6 }]} onPress={banUser} disabled={actionLoading}>
                        <Text style={s.banBtnText}>❌ Отклонить</Text>
                    </TouchableOpacity>
                </View>
            )}

            {user.status === 'APPROVED' && (
                <TouchableOpacity style={[s.banBtn, actionLoading && { opacity: 0.6 }]} onPress={banUser} disabled={actionLoading}>
                    <Text style={s.banBtnText}>🚫 Заблокировать</Text>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return <View style={s.row}><Text style={s.rowLabel}>{label}</Text><Text style={s.rowValue}>{value}</Text></View>;
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600', marginTop: Spacing.md },
    backBtn: { marginTop: Spacing.xl, padding: Spacing.lg },
    backBtnText: { color: Colors.primary, fontSize: FontSize.md },
    profileCard: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xxl, marginBottom: Spacing.lg },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '30', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
    avatarText: { fontSize: 32, fontWeight: '700', color: Colors.primary },
    name: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    badge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: Radius.full },
    badgeText: { fontSize: FontSize.sm, fontWeight: '600' },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg },
    section: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    rowLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
    rowValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
    phoneBtn: { backgroundColor: Colors.info + '15', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.info + '40', padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
    phoneBtnText: { color: Colors.info, fontSize: FontSize.md, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
    approveBtn: { flex: 1, backgroundColor: Colors.success, borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center' },
    approveBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
    banBtn: { flex: 1, backgroundColor: Colors.dangerBg, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.danger + '30', padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
    banBtnText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '600' },
});
