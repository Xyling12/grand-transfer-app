import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, KeyboardAvoidingView, Platform,
    ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../stores/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

export default function LoginScreen() {
    const [phone, setPhone] = useState('+7');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!phone || phone.length < 11) {
            Alert.alert('Ошибка', 'Введите номер телефона');
            return;
        }
        if (!password) {
            Alert.alert('Ошибка', 'Введите пароль');
            return;
        }

        setLoading(true);
        try {
            await login(phone, password);
        } catch (err: any) {
            Alert.alert('Ошибка входа', err.message || 'Проверьте данные');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo */}
                <View style={styles.logoWrap}>
                    <Text style={styles.logoEmoji}>🚗</Text>
                    <Text style={styles.logoText}>GrandTransfer</Text>
                    <Text style={styles.logoSub}>Межгородские перевозки</Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Телефон</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+7 (900) 123-45-67"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                    />

                    <Text style={styles.label}>Пароль</Text>
                    <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••"
                        placeholderTextColor={Colors.textMuted}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.bg} />
                        ) : (
                            <Text style={styles.buttonText}>Войти</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Register link */}
                <TouchableOpacity
                    onPress={() => router.push('/(auth)/register')}
                    style={styles.registerLink}
                >
                    <Text style={styles.registerText}>
                        Нет аккаунта?{' '}
                        <Text style={styles.registerBold}>Зарегистрироваться</Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xxl,
    },
    logoWrap: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl + 8,
    },
    logoEmoji: {
        fontSize: 56,
        marginBottom: Spacing.md,
    },
    logoText: {
        fontSize: FontSize.xxxl,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 1,
    },
    logoSub: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    form: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.xxl,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
        marginTop: Spacing.lg,
    },
    input: {
        backgroundColor: Colors.bg,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.lg,
        color: Colors.text,
        fontSize: FontSize.md,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.xxl,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: Colors.bg,
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    registerLink: {
        marginTop: Spacing.xxl,
        alignItems: 'center',
    },
    registerText: {
        color: Colors.textSecondary,
        fontSize: FontSize.md,
    },
    registerBold: {
        color: Colors.primary,
        fontWeight: '600',
    },
});
