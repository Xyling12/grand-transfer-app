import React from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateRole } from '../../utils/translations';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const isAdmin = user?.role === 'ADMIN';

    const handleLogout = () => {
        Alert.alert('Выход', 'Вы уверены?', [
            { text: 'Отмена' },
            { text: 'Выйти', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            {/* Profile card */}
            <View style={styles.profileCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {user?.fullFio?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                </View>
                <Text style={styles.name}>{user?.fullFio || 'Без имени'}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{translateRole(user?.role || '')}</Text>
                </View>
            </View>

            {/* Info card */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📱 Телефон</Text>
                    <Text style={styles.infoValue}>{user?.phone || '—'}</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🆔 ID</Text>
                    <Text style={styles.infoValue}>{user?.id?.slice(0, 8)}...</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📅 Статус</Text>
                    <Text style={[styles.infoValue, { color: Colors.success }]}>✅ Активен</Text>
                </View>
            </View>

            {/* Admin button */}
            {isAdmin && (
                <TouchableOpacity
                    style={styles.adminBtn}
                    onPress={() => router.push('/(admin)/dashboard')}
                >
                    <Text style={styles.adminText}>👑 Панель администратора</Text>
                </TouchableOpacity>
            )}

            {/* Support buttons */}
            <View style={styles.supportSection}>
                <Text style={styles.sectionTitle}>Поддержка</Text>
                <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/ticket/support')}>
                    <Text style={styles.supportText}>🆘 Написать в поддержку</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportBtn} onPress={() => router.push('/ticket/bug')}>
                    <Text style={styles.supportText}>🛠 Сообщить об ошибке</Text>
                </TouchableOpacity>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutText}>🚪 Выйти из аккаунта</Text>
            </TouchableOpacity>

            <Text style={styles.version}>GrandTransfer v1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 60 },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xxl,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Colors.primary + '30',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: FontSize.xxl,
        fontWeight: '700',
        color: Colors.primary,
    },
    name: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.sm,
    },
    roleBadge: {
        backgroundColor: Colors.primary + '20',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
    },
    roleText: {
        color: Colors.primary,
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: Spacing.lg,
    },
    infoLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
    infoValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
    divider: { height: 1, backgroundColor: Colors.border },
    adminBtn: {
        backgroundColor: Colors.primary + '15',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.primary + '40',
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    adminText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
    supportSection: { marginBottom: Spacing.lg },
    sectionTitle: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 1 },
    supportBtn: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    supportText: { color: Colors.textSecondary, fontSize: FontSize.sm },
    logoutBtn: {
        backgroundColor: Colors.dangerBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.danger + '30',
        padding: Spacing.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    logoutText: { color: Colors.danger, fontSize: FontSize.md },
    version: { textAlign: 'center', color: Colors.textMuted, fontSize: FontSize.xs },
});
