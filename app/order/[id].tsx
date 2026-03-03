import React, { useState, useEffect } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Linking, TextInput, Modal,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';
import { translateTariff, translateStatus, statusColor, statusEmoji } from '../../utils/translations';
import { formatDate, formatDateTime } from '../../utils/dates';
import type { Order } from '../../types';

export default function OrderDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [cancelModalVisible, setCancelModalVisible] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [distance, setDistance] = useState<string | null>(null);
    const { user } = useAuth();
    const router = useRouter();
    const isDispatcher = user?.role === 'DISPATCHER' || user?.role === 'ADMIN';

    useEffect(() => {
        (async () => {
            try {
                // For admin use filter=all, for drivers cascade available→my→history
                const isAdmin = user?.role === 'ADMIN' || user?.role === 'DISPATCHER';
                const filters = isAdmin ? ['all'] : ['available', 'my', 'history'];
                let found: Order | null = null;
                for (const f of filters) {
                    const data = await apiFetch<{ orders: Order[] }>(`/api/mobile/orders?filter=${f}`);
                    found = (data.orders || []).find(o => String(o.id) === id) || null;
                    if (found) break;
                }
                setOrder(found);
            } catch (err: any) {
                Alert.alert('Ошибка', err.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Calculate route distance using Nominatim + OSRM (free APIs)
    useEffect(() => {
        if (!order) return;
        (async () => {
            try {
                const [r1, r2] = await Promise.all([
                    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.fromCity)}&format=json&limit=1`),
                    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.toCity)}&format=json&limit=1`),
                ]);
                const [d1, d2] = await Promise.all([r1.json(), r2.json()]);
                if (!d1[0] || !d2[0]) return;
                const r3 = await fetch(`https://router.project-osrm.org/route/v1/driving/${d1[0].lon},${d1[0].lat};${d2[0].lon},${d2[0].lat}?overview=false`);
                const d3 = await r3.json();
                if (d3.routes?.[0]) {
                    const km = Math.round(d3.routes[0].distance / 1000);
                    setDistance(`${km} км`);
                }
            } catch { }
        })();
    }, [order]);

    const takeOrder = async () => {
        if (!order) return;
        setActionLoading(true);
        try {
            const action = isDispatcher ? 'dispatch' : 'take';
            await apiFetch('/api/mobile/orders', {
                method: 'POST',
                body: JSON.stringify({ action, orderId: order.id }),
            });
            Alert.alert('✅', isDispatcher ? 'Заказ отправлен водителям' : 'Заказ ваш!');
            router.back();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const completeOrder = async () => {
        if (!order) return;
        setActionLoading(true);
        try {
            await apiFetch('/api/mobile/orders', {
                method: 'POST',
                body: JSON.stringify({ action: 'complete', orderId: order.id }),
            });
            Alert.alert('✅', 'Заказ выполнен!');
            router.back();
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const openMap = () => {
        if (!order) return;
        const url = `https://yandex.ru/maps/?rtext=${encodeURIComponent(order.fromCity)}~${encodeURIComponent(order.toCity)}&rtt=auto`;
        Linking.openURL(url);
    };

    const openNavigator = () => {
        if (!order) return;
        const url = `yandexnavi://build_route_on_map?lat_to=0&lon_to=0&query=${encodeURIComponent(order.toCity)}`;
        Linking.openURL(url).catch(() => {
            Linking.openURL(`https://yandex.ru/maps/?rtext=${encodeURIComponent(order.fromCity)}~${encodeURIComponent(order.toCity)}&rtt=auto`);
        });
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (!order) {
        return (
            <View style={styles.centered}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>Заказ не найден</Text>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>← Назад</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isMine = order.driverId === user?.id;
    const showContacts = isMine || isDispatcher;
    const canTake = !isDispatcher && (order.status === 'NEW' || order.status === 'DISPATCHED');
    const canDispatch = isDispatcher && (order.status === 'NEW' || order.status === 'TAKEN');
    // Только водитель (isMine) может завершить заказ — диспетчер не завершает
    const canComplete = isMine && (order.status === 'TAKEN' || order.status === 'DISPATCHED');
    const canCancel = isDispatcher && order.status !== 'COMPLETED' && order.status !== 'CANCELLED';


    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <Stack.Screen options={{
                headerShown: true,
                headerTitle: `Заказ #${order.id}`,
                headerStyle: { backgroundColor: Colors.bg },
                headerShadowVisible: false,
                headerTintColor: Colors.text,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/orders')} style={{ paddingHorizontal: 8 }}>
                        <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: '600' }}>← Назад</Text>
                    </TouchableOpacity>
                ),
            }} />
            {/* Status */}
            <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor(order.status) }]}>
                        {statusEmoji(order.status)} {translateStatus(order.status)}
                    </Text>
                </View>
                <Text style={styles.orderId}>#{order.id}</Text>
            </View>

            {/* Route */}
            <View style={styles.routeCard}>
                <View style={styles.routePoint}>
                    <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.routeLabel}>Откуда</Text>
                        <Text style={styles.routeCity}>{order.fromCity}</Text>
                    </View>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routePoint}>
                    <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.routeLabel}>Куда</Text>
                        <Text style={styles.routeCity}>{order.toCity}</Text>
                    </View>
                </View>
                {distance !== null && (
                    <View style={[styles.routePoint, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border }]}>
                        <View style={[styles.dot, { backgroundColor: Colors.info }]} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.routeLabel}>Расстояние</Text>
                            <Text style={[styles.routeCity, { color: Colors.info }]}>{distance}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Details */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Детали заказа</Text>
                <DetailRow label="🏷 Тариф" value={translateTariff(order.tariff)} />
                <DetailRow label="👥 Пассажиры" value={String(order.passengers)} />
                <DetailRow
                    label="💰 Стоимость"
                    value={order.priceEstimate ? `${order.priceEstimate} ₽` : 'Не указана'}
                    highlight={!!order.priceEstimate}
                />
                <DetailRow
                    label="📅 Дата поездки"
                    value={order.scheduledDate ? formatDate(order.scheduledDate) : 'Не указана'}
                />
                <DetailRow label="🕐 Создан" value={formatDateTime(order.createdAt)} />
                {!!order.completedAt && (
                    <DetailRow label="✅ Выполнен" value={formatDateTime(order.completedAt)} />
                )}
                {!!order.cancelledAt && (
                    <DetailRow label="❌ Отменён" value={formatDateTime(order.cancelledAt)} />
                )}
                {!!order.cancelReason && (
                    <View style={styles.commentsBlock}>
                        <Text style={styles.commentsLabel}>📋 Причина отмены</Text>
                        <Text style={[styles.commentsText, { color: Colors.danger }]}>{order.cancelReason}</Text>
                    </View>
                )}
                {order.comments ? (
                    <View style={styles.commentsBlock}>
                        <Text style={styles.commentsLabel}>💬 Комментарий</Text>
                        <Text style={styles.commentsText}>{order.comments}</Text>
                    </View>
                ) : null}
            </View>

            {/* Driver / Dispatcher info (admin view) */}
            {/* Driver / Dispatcher info */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Исполнители</Text>
                {order.dispatcher ? (
                    <TouchableOpacity onPress={() => router.push(`/user/${order.dispatcher!.id}`)}>
                        <DetailRow label="📋 Диспетчер" value={order.dispatcher.fullFio || order.dispatcher.firstName || '—'} highlight />
                    </TouchableOpacity>
                ) : (
                    <DetailRow label="📋 Диспетчер" value="не назначен" />
                )}
                {order.driver ? (
                    <>
                        <TouchableOpacity onPress={() => router.push(`/user/${order.driver!.id}`)}>
                            <DetailRow label="🚗 Водитель" value={order.driver.fullFio || order.driver.firstName || '—'} highlight />
                        </TouchableOpacity>
                        {order.driver.phone && (
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.driver!.phone}`)}>
                                <DetailRow label="📞 Тел. водителя" value={order.driver.phone} highlight />
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <DetailRow label="🚗 Водитель" value="не назначен" />
                )}
            </View>

            {/* Client info (hidden until taken) */}
            {showContacts ? (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Контакты клиента</Text>
                    <DetailRow label="👤 Имя" value={order.customerName} />
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}>
                        <DetailRow label="📞 Телефон" value={order.customerPhone} highlight />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Контакты клиента</Text>
                    <Text style={styles.hiddenText}>🔒 Контакты будут доступны после принятия заказа</Text>
                </View>
            )}

            {/* Actions */}
            <View style={styles.actionsBlock}>
                <TouchableOpacity style={styles.mapButton} onPress={openMap}>
                    <Text style={styles.mapButtonText}>🗺 Посмотреть маршрут</Text>
                </TouchableOpacity>

                {/* Кнопка «Клиент» — только для диспетчера */}
                {isDispatcher && showContacts && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.info }]}
                        onPress={() => Linking.openURL(`tel:${order.customerPhone}`)}
                    >
                        <Text style={styles.actionButtonText}>📞 Позвонить клиенту</Text>
                    </TouchableOpacity>
                )}

                {/* Кнопка «Водитель» — позвонить водителю если назначен */}
                {isDispatcher && order.driver?.phone && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.info + 'cc' }]}
                        onPress={() => Linking.openURL(`tel:${order.driver!.phone}`)}
                    >
                        <Text style={styles.actionButtonText}>🚗 Позвонить водителю</Text>
                    </TouchableOpacity>
                )}

                {isMine && (
                    <TouchableOpacity style={styles.navButton} onPress={openNavigator}>
                        <Text style={styles.navButtonText}>🧭 Открыть навигатор</Text>
                    </TouchableOpacity>
                )}

                {canTake && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: Colors.success }, actionLoading && { opacity: 0.6 }]}
                        onPress={takeOrder}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.actionButtonText}>
                                {isDispatcher ? '📋 Взять в работу' : '✅ Забрать заказ'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}

                {canDispatch && (
                    <TouchableOpacity
                        style={[styles.actionButton, actionLoading && { opacity: 0.6 }]}
                        onPress={async () => {
                            setActionLoading(true);
                            try {
                                await apiFetch('/api/mobile/orders', {
                                    method: 'POST',
                                    body: JSON.stringify({ action: 'dispatch', orderId: order.id }),
                                });
                                Alert.alert('✅', 'Заказ отправлен водителям');
                                router.back();
                            } catch (err: any) {
                                Alert.alert('Ошибка', err.message);
                            } finally {
                                setActionLoading(false);
                            }
                        }}
                        disabled={actionLoading}
                    >
                        <Text style={styles.actionButtonText}>📤 Отправить водителям</Text>
                    </TouchableOpacity>
                )}

                {canComplete && (
                    <TouchableOpacity
                        style={[styles.completeButton, actionLoading && { opacity: 0.6 }]}
                        onPress={completeOrder}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.actionButtonText}>✅ Завершить заказ</Text>
                        )}
                    </TouchableOpacity>
                )}

                {canCancel && (
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setCancelModalVisible(true)}
                    >
                        <Text style={styles.cancelButtonText}>❌ Отменить заказ</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Cancel modal */}
            <Modal visible={cancelModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Причина отмены</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Укажите причину..."
                            placeholderTextColor={Colors.textMuted}
                            value={cancelReason}
                            onChangeText={setCancelReason}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => { setCancelModalVisible(false); setCancelReason(''); }}
                            >
                                <Text style={styles.modalCancelText}>Назад</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalConfirmBtn, !cancelReason.trim() && { opacity: 0.4 }]}
                                disabled={!cancelReason.trim() || actionLoading}
                                onPress={async () => {
                                    setActionLoading(true);
                                    try {
                                        await apiFetch('/api/mobile/orders', {
                                            method: 'POST',
                                            body: JSON.stringify({ action: 'cancel', orderId: order.id, reason: cancelReason.trim() }),
                                        });
                                        setCancelModalVisible(false);
                                        Alert.alert('❌', 'Заказ отменён');
                                        router.back();
                                    } catch (err: any) {
                                        Alert.alert('Ошибка', err.message);
                                    } finally {
                                        setActionLoading(false);
                                    }
                                }}
                            >
                                <Text style={styles.modalConfirmText}>Отменить заказ</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={[styles.detailValue, highlight && { color: Colors.primary, fontWeight: '700' }]}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
    emptyEmoji: { fontSize: 56, marginBottom: Spacing.lg },
    emptyText: { fontSize: FontSize.lg, color: Colors.textSecondary, fontWeight: '600' },
    backBtn: { marginTop: Spacing.xl, padding: Spacing.lg },
    backBtnText: { color: Colors.primary, fontSize: FontSize.md },

    statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
    statusBadge: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radius.full },
    statusText: { fontSize: FontSize.sm, fontWeight: '700' },
    orderId: { color: Colors.textMuted, fontSize: FontSize.sm },

    routeCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    routePoint: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
    dot: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
    routeLine: { width: 2, height: 30, backgroundColor: Colors.border, marginLeft: 6, marginVertical: 4 },
    routeLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 2 },
    routeCity: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },

    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    sectionTitle: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md },

    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
    detailLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
    detailValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '500' },

    commentsBlock: { marginTop: Spacing.md, backgroundColor: Colors.bg, borderRadius: Radius.md, padding: Spacing.md },
    commentsLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginBottom: 4 },
    commentsText: { color: Colors.text, fontSize: FontSize.sm, lineHeight: 20 },

    hiddenText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md },

    actionsBlock: { gap: Spacing.md, marginTop: Spacing.sm },
    mapButton: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    mapButtonText: { color: Colors.info, fontSize: FontSize.md, fontWeight: '600' },
    navButton: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.info + '40',
        padding: Spacing.lg,
        alignItems: 'center',
    },
    navButtonText: { color: Colors.info, fontSize: FontSize.md, fontWeight: '600' },
    actionButton: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    completeButton: {
        backgroundColor: Colors.success,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    actionButtonText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

    cancelButton: {
        backgroundColor: 'transparent',
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.danger,
        padding: Spacing.lg,
        alignItems: 'center',
    },
    cancelButtonText: { color: Colors.danger, fontSize: FontSize.md, fontWeight: '700' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: Spacing.xl },
    modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl },
    modalTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: Spacing.lg, textAlign: 'center' },
    modalInput: {
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        color: Colors.text,
        fontSize: FontSize.md,
        minHeight: 100,
        marginBottom: Spacing.lg,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.md },
    modalCancelBtn: { flex: 1, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', backgroundColor: Colors.bg },
    modalCancelText: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '600' },
    modalConfirmBtn: { flex: 1, padding: Spacing.lg, borderRadius: Radius.lg, alignItems: 'center', backgroundColor: Colors.danger },
    modalConfirmText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
