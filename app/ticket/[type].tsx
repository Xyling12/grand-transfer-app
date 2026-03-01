import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

export default function TicketScreen() {
    const { type } = useLocalSearchParams<{ type: string }>();
    const isSupport = type === 'support';
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const handleSubmit = async () => {
        if (!subject.trim()) {
            Alert.alert('', 'Укажите тему обращения');
            return;
        }
        if (!message.trim()) {
            Alert.alert('', 'Напишите сообщение');
            return;
        }

        setSending(true);
        try {
            // For now, just show success - later connect to ticket API
            await new Promise(r => setTimeout(r, 500));
            Alert.alert(
                '✅ Отправлено',
                isSupport
                    ? 'Ваше обращение отправлено в поддержку. Мы ответим в ближайшее время.'
                    : 'Баг-репорт отправлен. Спасибо за помощь в улучшении приложения!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (err: any) {
            Alert.alert('Ошибка', err.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>{isSupport ? '🆘' : '🛠'}</Text>
                    <Text style={styles.title}>
                        {isSupport ? 'Обращение в поддержку' : 'Сообщить об ошибке'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {isSupport
                            ? 'Опишите вашу проблему или вопрос'
                            : 'Опишите ошибку — что произошло и как воспроизвести'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.label}>Тема</Text>
                    <TextInput
                        style={styles.input}
                        placeholder={isSupport ? 'Например: Проблема с заказом' : 'Например: Ошибка при загрузке'}
                        placeholderTextColor={Colors.textMuted}
                        value={subject}
                        onChangeText={setSubject}
                    />

                    <Text style={styles.label}>Сообщение</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Подробно опишите..."
                        placeholderTextColor={Colors.textMuted}
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />

                    <View style={styles.infoCard}>
                        <Text style={styles.infoText}>
                            👤 {user?.fullFio || 'N/A'} • 📱 {user?.phone || 'N/A'}
                        </Text>
                        <Text style={styles.infoHint}>Контактные данные прикрепляются автоматически</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, sending && { opacity: 0.6 }]}
                        onPress={handleSubmit}
                        disabled={sending}
                    >
                        <Text style={styles.submitText}>
                            {sending ? 'Отправка...' : '📨 Отправить'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: Spacing.xl },
    emoji: { fontSize: 48, marginBottom: Spacing.md },
    title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center' },
    form: {},
    label: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        color: Colors.text,
        fontSize: FontSize.md,
    },
    textArea: { minHeight: 150 },
    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        marginTop: Spacing.xl,
    },
    infoText: { color: Colors.text, fontSize: FontSize.sm },
    infoHint: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 4 },
    submitBtn: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
});
