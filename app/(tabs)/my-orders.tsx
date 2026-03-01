import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, RefreshControl, ActivityIndicator, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateTariff, translateStatus, statusColor, statusEmoji } from '../../utils/translations';
import type { Order } from '../../types';

export default function MyOrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const { user } = useAuth();
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        try {
            const data = await apiFetch<{ orders: Order[] }>('/api/mobile/orders?type=my');
            setOrders(data.orders || []);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const completeOrder = async (orderId: number) => {
        Alert.alert('Подтверждение', 'Отметить заказ как выполненный?', [
            { text: 'Отмена' },
            {
                text: 'Выполнен ✅',
                onPress: async () => {
                    setActionLoading(orderId);
                    try {
                        await apiFetch('/api/mobile/orders', {
                            method: 'POST',
                            body: JSON.stringify({ action: 'complete', orderId }),
                        });
                        fetchOrders();
                    } catch (err: any) {
                        Alert.alert('Ошибка', err.message);
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const cancelOrder = async (orderId: number) => {
        Alert.alert('❌ Отменить заказ?', 'Это действие нельзя отменить', [
            { text: 'Нет' },
            {
                text: 'Да, отменить',
                style: 'destructive',
                onPress: async () => {
                    setActionLoading(orderId);
                    try {
                        await apiFetch('/api/mobile/orders', {
                            method: 'POST',
                            body: JSON.stringify({ action: 'cancel', orderId }),
                        });
                        fetchOrders();
                    } catch (err: any) {
                        Alert.alert('Ошибка', err.message);
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const renderOrder = useCallback(({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/order/${item.id}`)}>
            <View style={styles.cardHeader}>
                <Text style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20', color: statusColor(item.status) }]}>
                    {statusEmoji(item.status)} {translateStatus(item.status)}
                </Text>
                <Text style={styles.orderId}>#{item.id}</Text>
            </View>

            <View style={styles.route}>
                <Text style={styles.routeText}>
                    <Text style={styles.routeCity}>{item.fromCity}</Text>
                    {'  →  '}
                    <Text style={styles.routeCity}>{item.toCity}</Text>
                </Text>
            </View>

            <View style={styles.details}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>🏷 Тариф</Text>
                    <Text style={styles.detailValue}>{translateTariff(item.tariff)}</Text>
                </View>
                {item.priceEstimate && (
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>💰 Цена</Text>
                        <Text style={[styles.detailValue, { color: Colors.primary }]}>{item.priceEstimate} ₽</Text>
                    </View>
                )}
                <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Text style={styles.detailLabel}>👤 Клиент</Text>
                    <Text style={styles.detailValue}>{item.customerName}</Text>
                </View>
                <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
                    <Text style={styles.detailLabel}>📞 Телефон</Text>
                    <Text style={[styles.detailValue, { color: Colors.info }]}>{item.customerPhone}</Text>
                </TouchableOpacity>
            </View>

            {item.status === 'TAKEN' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => Linking.openURL(`https://yandex.ru/navi/?rtext=${encodeURIComponent(item.fromCity)}~${encodeURIComponent(item.toCity)}&rtt=auto`)}
                    >
                        <Text style={styles.navText}>📱 Навигатор</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.completeBtn, actionLoading === item.id && { opacity: 0.6 }]}
                        onPress={() => completeOrder(item.id)}
                        disabled={actionLoading === item.id}
                    >
                        <Text style={styles.completeText}>✅ Выполнен</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.cancelBtn, actionLoading === item.id && { opacity: 0.6 }]}
                        onPress={() => cancelOrder(item.id)}
                        disabled={actionLoading === item.id}
                    >
                        <Text style={styles.cancelText}>❌</Text>
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    ), [actionLoading]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            contentContainerStyle={orders.length === 0 ? styles.empty : styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>🚗</Text>
                    <Text style={styles.emptyText}>Нет активных заказов</Text>
                    <Text style={styles.emptyHint}>Заберите заказ из доступных</Text>
                </View>
            }
        />
    );
}

const styles = StyleSheet.create({
    list: { flex: 1, backgroundColor: Colors.bg },
    listContent: { padding: Spacing.lg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
    emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
    emptyHint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    statusBadge: { fontSize: FontSize.xs, fontWeight: '600', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, overflow: 'hidden' },
    orderId: { color: Colors.textMuted, fontSize: FontSize.xs },
    route: { padding: Spacing.lg },
    routeText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
    routeCity: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    details: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
    detailValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
    actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.border },
    navBtn: { flex: 1, padding: Spacing.lg, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.border },
    navText: { color: Colors.info, fontSize: FontSize.sm, fontWeight: '600' },
    completeBtn: { flex: 1, padding: Spacing.lg, alignItems: 'center', backgroundColor: Colors.success + '15', borderRightWidth: 1, borderRightColor: Colors.border },
    completeText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '700' },
    cancelBtn: { padding: Spacing.lg, alignItems: 'center', width: 50 },
    cancelText: { fontSize: 16 },
});
