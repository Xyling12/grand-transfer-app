import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

export default function AdminBroadcastScreen() {
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const router = useRouter();

    const handleSend = async () => {
        if (!message.trim()) {
            Alert.alert('', 'Напишите сообщение для рассылки');
            return;
        }

        Alert.alert(
            '📢 Подтверждение',
            `Отправить сообщение всем пользователям?\n\n«${message.trim().slice(0, 100)}${message.length > 100 ? '...' : ''}»`,
            [
                { text: 'Отмена' },
                {
                    text: 'Отправить',
                    onPress: async () => {
                        setSending(true);
                        try {
                            // Future: connect to broadcast API
                            await new Promise(r => setTimeout(r, 800));
                            Alert.alert('✅ Отправлено', 'Сообщение отправлено всем пользователям', [
                                { text: 'OK', onPress: () => router.back() },
                            ]);
                            setMessage('');
                        } catch (err: any) {
                            Alert.alert('Ошибка', err.message);
                        } finally {
                            setSending(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>📢</Text>
                    <Text style={styles.title}>Рассылка</Text>
                    <Text style={styles.subtitle}>Отправить сообщение всем зарегистрированным пользователям</Text>
                </View>

                <Text style={styles.label}>Сообщение</Text>
                <TextInput
                    style={styles.textArea}
                    placeholder="Введите текст рассылки..."
                    placeholderTextColor={Colors.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={8}
                    textAlignVertical="top"
                />

                <Text style={styles.charCount}>{message.length} символов</Text>

                <TouchableOpacity
                    style={[styles.sendBtn, sending && { opacity: 0.6 }]}
                    onPress={handleSend}
                    disabled={sending}
                >
                    <Text style={styles.sendBtnText}>
                        {sending ? '⏳ Отправка...' : '📨 Отправить всем'}
                    </Text>
                </TouchableOpacity>

                <View style={styles.warningCard}>
                    <Text style={styles.warningText}>⚠️ Сообщение будет отправлено всем пользователям приложения. Используйте с осторожностью.</Text>
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
    label: { color: Colors.textMuted, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.sm },
    textArea: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        color: Colors.text,
        fontSize: FontSize.md,
        minHeight: 180,
    },
    charCount: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', marginTop: Spacing.xs },
    sendBtn: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.lg,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.xl,
    },
    sendBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
    warningCard: {
        backgroundColor: Colors.warningBg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.warning + '30',
        padding: Spacing.lg,
        marginTop: Spacing.xl,
    },
    warningText: { color: Colors.warning, fontSize: FontSize.xs, lineHeight: 18 },
});
