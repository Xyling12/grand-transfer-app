import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '../stores/authStore';
import { Colors } from '../constants/Colors';

function RootLayoutNav() {
    const { user, isLoading, isAuthenticated } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user) {
            if (!inAuthGroup) {
                router.replace('/(auth)/login');
            }
        } else if (user.status === 'PENDING') {
            router.replace('/(auth)/pending');
        } else if (user.status === 'BANNED') {
            router.replace('/(auth)/banned');
        } else if (isAuthenticated) {
            if (inAuthGroup) {
                router.replace('/(tabs)/orders');
            }
        }

        setReady(true);
    }, [user, isLoading, isAuthenticated, segments]);

    if (isLoading || !ready) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(admin)" />
            <Stack.Screen
                name="order/[id]"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: Colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: Colors.text,
                    headerTitle: 'Заказ',
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="ticket/[type]"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: Colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: Colors.text,
                    headerTitle: 'Обращение',
                    animation: 'slide_from_right',
                }}
            />
            <Stack.Screen
                name="user/[id]"
                options={{
                    headerShown: true,
                    headerStyle: { backgroundColor: Colors.bg },
                    headerShadowVisible: false,
                    headerTintColor: Colors.text,
                    headerTitle: 'Пользователь',
                    animation: 'slide_from_right',
                }}
            />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.bg,
    },
});
