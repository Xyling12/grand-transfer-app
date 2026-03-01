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

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const isDispatcher = user?.role === 'DISPATCHER' || user?.role === 'ADMIN';

    const fetchOrders = useCallback(async () => {
        try {
            const type = isDispatcher ? 'available' : 'available';
            const data = await apiFetch<{ orders: Order[] }>(`/api/mobile/orders?type=${type}`);
            setOrders(data.orders || []);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [isDispatcher]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const handleAction = async (orderId: number, action: 'take' | 'dispatch') => {
        setActionLoading(orderId);
        try {
            await apiFetch('/api/mobile/orders', {
                method: 'POST',
                body: JSON.stringify({ action, orderId }),
            });
            const msg = action === 'dispatch' ? 'Заказ отправлен водителям' : 'Заказ взят в работу!';
            Alert.alert('✅', msg);
            fetchOrders();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const openMap = (from: string, to: string) => {
        const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(from)}~${encodeURIComponent(to)}&rtt=auto`;
        Linking.openURL(url);
    };

    const renderOrder = useCallback(({ item }: { item: Order }) => {
        const isTaken = item.status === 'TAKEN' || item.status === 'COMPLETED';
        const showContacts = isTaken && item.driverId === user?.id;

        return (
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
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>👥 Пассажиры</Text>
                        <Text style={styles.detailValue}>{item.passengers}</Text>
                    </View>
                    {item.priceEstimate && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>💰 Цена</Text>
                            <Text style={[styles.detailValue, { color: Colors.primary }]}>{item.priceEstimate} ₽</Text>
                        </View>
                    )}
                    {item.scheduledDate && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>📅 Дата</Text>
                            <Text style={styles.detailValue}>{new Date(item.scheduledDate).toLocaleDateString('ru-RU')}</Text>
                        </View>
                    )}
                    {item.comments && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>💬</Text>
                            <Text style={[styles.detailValue, { flex: 1 }]} numberOfLines={2}>{item.comments}</Text>
                        </View>
                    )}
                    {showContacts && (
                        <>
                            <View style={[styles.detailRow, { marginTop: 8 }]}>
                                <Text style={styles.detailLabel}>👤 Клиент</Text>
                                <Text style={styles.detailValue}>{item.customerName}</Text>
                            </View>
                            <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${item.customerPhone}`)}>
                                <Text style={styles.detailLabel}>📞 Телефон</Text>
                                <Text style={[styles.detailValue, { color: Colors.info }]}>{item.customerPhone}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.actions}>
                    <TouchableOpacity style={styles.mapBtn} onPress={() => openMap(item.fromCity, item.toCity)}>
                        <Text style={styles.mapText}>🗺 Маршрут</Text>
                    </TouchableOpacity>

                    {isDispatcher && item.status === 'NEW' && (
                        <>
                            <TouchableOpacity
                                style={[styles.takeBtn, { backgroundColor: Colors.success }, actionLoading === item.id && { opacity: 0.6 }]}
                                onPress={() => handleAction(item.id, 'take')}
                                disabled={actionLoading === item.id}
                            >
                                <Text style={styles.takeText}>📋 Взять</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.takeBtn, actionLoading === item.id && { opacity: 0.6 }]}
                                onPress={() => handleAction(item.id, 'dispatch')}
                                disabled={actionLoading === item.id}
                            >
                                <Text style={styles.takeText}>📤 Водителям</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {isDispatcher && item.status === 'DISPATCHED' && (
                        <TouchableOpacity
                            style={[styles.takeBtn, { backgroundColor: Colors.success }, actionLoading === item.id && { opacity: 0.6 }]}
                            onPress={() => handleAction(item.id, 'take')}
                            disabled={actionLoading === item.id}
                        >
                            <Text style={styles.takeText}>📋 Взять</Text>
                        </TouchableOpacity>
                    )}

                    {!isDispatcher && (item.status === 'DISPATCHED') && (
                        <TouchableOpacity
                            style={[styles.takeBtn, actionLoading === item.id && { opacity: 0.6 }]}
                            onPress={() => handleAction(item.id, 'take')}
                            disabled={actionLoading === item.id}
                        >
                            {actionLoading === item.id ? (
                                <ActivityIndicator color={Colors.bg} size="small" />
                            ) : (
                                <Text style={styles.takeText}>✅ Забрать</Text>
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [user, actionLoading, isDispatcher]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            contentContainerStyle={orders.length === 0 ? styles.empty : styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            ListEmptyComponent={
                <View style={styles.emptyWrap}>
                    <Text style={styles.emptyEmoji}>📭</Text>
                    <Text style={styles.emptyText}>Нет доступных заказов</Text>
                    <Text style={styles.emptyHint}>Потяните вниз для обновления</Text>
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
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.lg,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    statusBadge: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Radius.full,
        overflow: 'hidden',
    },
    orderId: { color: Colors.textMuted, fontSize: FontSize.xs },
    route: { padding: Spacing.lg },
    routeText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
    routeCity: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    details: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
    detailValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    mapBtn: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: 'center',
        borderRightWidth: 1,
        borderRightColor: Colors.border,
    },
    mapText: { color: Colors.info, fontSize: FontSize.sm, fontWeight: '600' },
    takeBtn: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
    },
    takeText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});
