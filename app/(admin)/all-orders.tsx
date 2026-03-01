import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    StyleSheet, RefreshControl, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateTariff, translateStatus, statusColor, statusEmoji } from '../../utils/translations';
import type { Order } from '../../types';

const FILTERS = [
    { key: 'all', label: 'Все' },
    { key: 'new', label: 'Новые' },
    { key: 'active', label: 'Активные' },
    { key: 'completed', label: 'Выполненные' },
];

export default function AllOrdersScreen() {
    const params = useLocalSearchParams<{ filter?: string }>();
    const [activeFilter, setActiveFilter] = useState(params.filter || 'all');
    const [allOrders, setAllOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = useCallback(async () => {
        try {
            const data = await apiFetch<{ orders: Order[] }>('/api/mobile/orders?filter=all');
            setAllOrders(data.orders || []);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    const filtered = activeFilter === 'all' ? allOrders
        : activeFilter === 'new' ? allOrders.filter(o => o.status === 'NEW' || o.status === 'DISPATCHED')
            : activeFilter === 'active' ? allOrders.filter(o => o.status === 'NEW' || o.status === 'DISPATCHED' || o.status === 'TAKEN')
                : allOrders.filter(o => o.status === 'COMPLETED');

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const renderOrder = ({ item }: { item: Order }) => (
        <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => router.push(`/order/${item.id}`)}>
            <View style={styles.cardHeader}>
                <Text style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20', color: statusColor(item.status) }]}>
                    {statusEmoji(item.status)} {translateStatus(item.status)}
                </Text>
                <Text style={styles.orderId}>#{item.id}</Text>
            </View>
            <Text style={styles.routeCity}>{item.fromCity} → {item.toCity}</Text>
            <View style={styles.footer}>
                <Text style={styles.footerItem}>{translateTariff(item.tariff)}</Text>
                {item.priceEstimate ? <Text style={[styles.footerItem, { color: Colors.primary }]}>{item.priceEstimate}₽</Text> : null}
                <Text style={styles.footerItem}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[styles.filterTab, activeFilter === f.key && styles.filterTabActive]}
                        onPress={() => setActiveFilter(f.key)}
                    >
                        <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
                            {f.label} {activeFilter === f.key ? `(${filtered.length})` : ''}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <FlatList
                data={filtered}
                renderItem={renderOrder}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={filtered.length === 0 ? styles.empty : styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
                ListEmptyComponent={
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyEmoji}>📋</Text>
                        <Text style={styles.emptyText}>Нет заказов</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    listContent: { padding: Spacing.lg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
    emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
    filterScroll: { maxHeight: 50 },
    filterRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
    filterTab: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    filterTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    filterText: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
    filterTextActive: { color: '#fff' },
    card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.md },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    statusBadge: { fontSize: FontSize.xs, fontWeight: '600', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, overflow: 'hidden' },
    orderId: { color: Colors.textMuted, fontSize: FontSize.xs },
    routeCity: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    footer: { flexDirection: 'row', justifyContent: 'space-between' },
    footerItem: { color: Colors.textMuted, fontSize: FontSize.xs },
});
