import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, RegisterData } from '../../stores/authStore';
import { Colors, Spacing, Radius, FontSize } from '../../constants/Colors';

type Step = 'role' | 'info' | 'pts' | 'sts' | 'license' | 'car' | 'review';

const DRIVER_STEPS: Step[] = ['role', 'info', 'pts', 'sts', 'license', 'car', 'review'];
const DISPATCHER_STEPS: Step[] = ['role', 'info', 'review'];

export default function RegisterScreen() {
    const [role, setRole] = useState<'DRIVER' | 'DISPATCHER' | null>(null);
    const [stepIdx, setStepIdx] = useState(0);
    const [fullFio, setFullFio] = useState('');
    const [phone, setPhone] = useState('+7');
    const [password, setPassword] = useState('');
    const [photos, setPhotos] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const router = useRouter();

    const steps = role === 'DISPATCHER' ? DISPATCHER_STEPS : DRIVER_STEPS;
    const currentStep = steps[stepIdx];
    const progress = (stepIdx + 1) / steps.length;

    const pickImage = useCallback(async (key: string) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
        }
    }, []);

    const takePhoto = useCallback(async (key: string) => {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
            Alert.alert('Нет доступа', 'Разрешите доступ к камере в настройках');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.8,
            allowsEditing: true,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
        }
    }, []);

    const next = () => {
        if (currentStep === 'role' && !role) {
            Alert.alert('Выберите роль'); return;
        }
        if (currentStep === 'info') {
            if (fullFio.length < 5) { Alert.alert('ФИО', 'Минимум 5 символов'); return; }
            if (phone.length < 11) { Alert.alert('Телефон', 'Введите корректный номер'); return; }
            if (password.length < 6) { Alert.alert('Пароль', 'Минимум 6 символов'); return; }
        }
        if (['pts', 'sts', 'license', 'car'].includes(currentStep) && !photos[currentStep]) {
            Alert.alert('Фото', 'Загрузите фотографию для продолжения'); return;
        }
        setStepIdx(i => Math.min(i + 1, steps.length - 1));
    };

    const back = () => setStepIdx(i => Math.max(i - 1, 0));

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const data: RegisterData = {
                phone, password, fullFio, role: role!,
            };
            const msg = await register(data);
            Alert.alert('✅ Готово', msg, [{ text: 'OK', onPress: () => router.replace('/(auth)/pending') }]);
        } catch (err: any) {
            Alert.alert('Ошибка', err.message || 'Попробуйте позже');
        } finally {
            setLoading(false);
        }
    };

    const renderPhotoStep = (key: string, title: string, hint: string) => (
        <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{title}</Text>
            <Text style={styles.stepHint}>{hint}</Text>
            {photos[key] ? (
                <View style={styles.previewWrap}>
                    <Image source={{ uri: photos[key] }} style={styles.preview} />
                    <TouchableOpacity style={styles.retakeBtn} onPress={() => setPhotos(p => { const n = { ...p }; delete n[key]; return n; })}>
                        <Text style={styles.retakeText}>🔄 Переснять</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.photoButtons}>
                    <TouchableOpacity style={styles.photoBtn} onPress={() => takePhoto(key)}>
                        <Text style={styles.photoBtnEmoji}>📷</Text>
                        <Text style={styles.photoBtnText}>Камера</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(key)}>
                        <Text style={styles.photoBtnEmoji}>🖼</Text>
                        <Text style={styles.photoBtnText}>Галерея</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {/* Progress bar */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>Шаг {stepIdx + 1} из {steps.length}</Text>

            {/* Step: Role */}
            {currentStep === 'role' && (
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Выберите роль</Text>
                    <TouchableOpacity
                        style={[styles.roleCard, role === 'DRIVER' && styles.roleCardActive]}
                        onPress={() => setRole('DRIVER')}
                    >
                        <Text style={styles.roleEmoji}>🚗</Text>
                        <Text style={styles.roleTitle}>Водитель</Text>
                        <Text style={styles.roleDesc}>Выполняю заказы на перевозку</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleCard, role === 'DISPATCHER' && styles.roleCardActive]}
                        onPress={() => setRole('DISPATCHER')}
                    >
                        <Text style={styles.roleEmoji}>🎧</Text>
                        <Text style={styles.roleTitle}>Диспетчер</Text>
                        <Text style={styles.roleDesc}>Управляю заказами и водителями</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Step: Personal Info */}
            {currentStep === 'info' && (
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Личные данные</Text>
                    <Text style={styles.label}>ФИО полностью</Text>
                    <TextInput style={styles.input} value={fullFio} onChangeText={setFullFio}
                        placeholder="Иванов Иван Иванович" placeholderTextColor={Colors.textMuted} />
                    <Text style={styles.label}>Телефон</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone}
                        placeholder="+79001234567" placeholderTextColor={Colors.textMuted}
                        keyboardType="phone-pad" />
                    <Text style={styles.label}>Пароль</Text>
                    <TextInput style={styles.input} value={password} onChangeText={setPassword}
                        placeholder="Минимум 6 символов" placeholderTextColor={Colors.textMuted}
                        secureTextEntry />
                </View>
            )}

            {/* Photo steps */}
            {currentStep === 'pts' && renderPhotoStep('pts', '📄 Фото ПТС', 'Сфотографируйте лицевую сторону ПТС')}
            {currentStep === 'sts' && renderPhotoStep('sts', '🪪 Фото СТС', 'Сфотографируйте свидетельство о регистрации ТС')}
            {currentStep === 'license' && renderPhotoStep('license', '🪪 Водительское удостоверение', 'Сфотографируйте лицевую сторону')}
            {currentStep === 'car' && renderPhotoStep('car', '🚙 Фото автомобиля', 'Сбоку, чтобы был виден гос. номер')}

            {/* Review */}
            {currentStep === 'review' && (
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>✅ Проверьте данные</Text>
                    <View style={styles.reviewCard}>
                        <Text style={styles.reviewLabel}>Роль</Text>
                        <Text style={styles.reviewValue}>{role === 'DRIVER' ? '🚗 Водитель' : '🎧 Диспетчер'}</Text>
                        <Text style={styles.reviewLabel}>ФИО</Text>
                        <Text style={styles.reviewValue}>{fullFio}</Text>
                        <Text style={styles.reviewLabel}>Телефон</Text>
                        <Text style={styles.reviewValue}>{phone}</Text>
                    </View>
                    {role === 'DRIVER' && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoRow}>
                            {['pts', 'sts', 'license', 'car'].map(k => photos[k] ? (
                                <Image key={k} source={{ uri: photos[k] }} style={styles.thumbPhoto} />
                            ) : null)}
                        </ScrollView>
                    )}
                </View>
            )}

            {/* Navigation */}
            <View style={styles.nav}>
                {stepIdx > 0 && (
                    <TouchableOpacity style={styles.backBtn} onPress={back}>
                        <Text style={styles.backText}>← Назад</Text>
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }} />
                {currentStep === 'review' ? (
                    <TouchableOpacity style={[styles.submitBtn, loading && styles.buttonDisabled]} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color={Colors.bg} /> : <Text style={styles.submitText}>Отправить заявку</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={styles.nextBtn} onPress={next}>
                        <Text style={styles.nextText}>Далее →</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Back to login */}
            <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
                <Text style={styles.loginText}>Уже есть аккаунт? <Text style={{ color: Colors.primary }}>Войти</Text></Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    scroll: { padding: Spacing.xxl, paddingBottom: 60 },
    progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: Spacing.sm },
    progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
    progressText: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'right', marginBottom: Spacing.xxl },
    stepContent: { marginBottom: Spacing.xxl },
    stepTitle: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md },
    stepHint: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xl },
    label: { color: Colors.textSecondary, fontSize: FontSize.sm, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    input: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, color: Colors.text, fontSize: FontSize.md },
    roleCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.xxl, marginBottom: Spacing.lg, alignItems: 'center' },
    roleCardActive: { borderColor: Colors.primary, backgroundColor: '#1a1500' },
    roleEmoji: { fontSize: 40, marginBottom: Spacing.md },
    roleTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    roleDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.xs },
    photoButtons: { flexDirection: 'row', gap: Spacing.lg },
    photoBtn: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xxl, alignItems: 'center' },
    photoBtnEmoji: { fontSize: 36, marginBottom: Spacing.sm },
    photoBtnText: { color: Colors.textSecondary, fontSize: FontSize.sm },
    previewWrap: { alignItems: 'center' },
    preview: { width: '100%', height: 240, borderRadius: Radius.lg, marginBottom: Spacing.md },
    retakeBtn: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
    retakeText: { color: Colors.textSecondary, fontSize: FontSize.sm },
    reviewCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl },
    reviewLabel: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: Spacing.md },
    reviewValue: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
    photoRow: { marginTop: Spacing.lg },
    thumbPhoto: { width: 80, height: 80, borderRadius: Radius.md, marginRight: Spacing.md },
    nav: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.lg },
    backBtn: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
    backText: { color: Colors.textSecondary, fontSize: FontSize.md },
    nextBtn: { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
    nextText: { color: Colors.bg, fontSize: FontSize.md, fontWeight: '700' },
    submitBtn: { backgroundColor: Colors.success, borderRadius: Radius.md, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl },
    submitText: { color: Colors.bg, fontSize: FontSize.md, fontWeight: '700' },
    buttonDisabled: { opacity: 0.6 },
    loginLink: { marginTop: Spacing.xxl, alignItems: 'center' },
    loginText: { color: Colors.textSecondary, fontSize: FontSize.md },
});
