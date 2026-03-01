import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateTariff, translateStatus, statusColor, statusEmoji } from '../../utils/translations';
import type { Order } from '../../types';

export default function HistoryScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        try {
            const data = await apiFetch<{ orders: Order[] }>('/api/mobile/orders?type=history');
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

    const renderOrder = useCallback(({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/order/${item.id}`)}>
            <View style={styles.cardHeader}>
                <Text style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20', color: statusColor(item.status) }]}>
                    {statusEmoji(item.status)} {translateStatus(item.status)}
                </Text>
                <Text style={styles.date}>
                    {item.completedAt
                        ? new Date(item.completedAt).toLocaleDateString('ru-RU')
                        : new Date(item.createdAt).toLocaleDateString('ru-RU')}
                </Text>
            </View>
            <View style={styles.route}>
                <Text style={styles.routeText}>
                    <Text style={styles.routeCity}>{item.fromCity}</Text>
                    {'  →  '}
                    <Text style={styles.routeCity}>{item.toCity}</Text>
                </Text>
            </View>
            <View style={styles.footer}>
                <Text style={styles.footerText}>{translateTariff(item.tariff)}</Text>
                {item.priceEstimate && (
                    <Text style={[styles.footerText, { color: Colors.primary }]}>{item.priceEstimate} ₽</Text>
                )}
            </View>
        </TouchableOpacity>
    ), []);

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
                    <Text style={styles.emptyEmoji}>📚</Text>
                    <Text style={styles.emptyText}>История пуста</Text>
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
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
    statusBadge: { fontSize: FontSize.xs, fontWeight: '600', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, overflow: 'hidden' },
    date: { color: Colors.textMuted, fontSize: FontSize.xs },
    route: { padding: Spacing.lg },
    routeText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
    routeCity: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
    footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
    footerText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
