import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function AdminLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                headerStyle: { backgroundColor: Colors.bg },
                headerShadowVisible: false,
                headerTintColor: Colors.text,
                headerTitleStyle: { fontWeight: '700' },
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
            }}
        >
            <Stack.Screen name="dashboard" options={{ headerTitle: 'Панель управления' }} />
            <Stack.Screen name="all-orders" options={{ headerTitle: 'Все заказы' }} />
            <Stack.Screen name="users" options={{ headerTitle: 'Пользователи' }} />
            <Stack.Screen name="tickets" options={{ headerTitle: 'Тикеты' }} />
            <Stack.Screen name="broadcast" options={{ headerTitle: 'Рассылка' }} />
        </Stack>
    );
}
