import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../stores/authStore';

export default function TabLayout() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const isDispatcher = user?.role === 'DISPATCHER' || isAdmin;

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: Colors.bg },
                headerShadowVisible: false,
                headerTintColor: Colors.text,
                headerTitleStyle: { fontWeight: '700' },
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    borderTopWidth: 1,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarLabelStyle: { fontSize: 11 },
            }}
        >
            <Tabs.Screen
                name="orders"
                options={{
                    title: isDispatcher ? 'Новые' : 'Заказы',
                    headerTitle: isDispatcher ? 'Новые заказы' : 'Доступные заказы',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="document-text-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="my-orders"
                options={{
                    title: 'Мои',
                    headerTitle: 'Мои заказы',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: 'История',
                    headerTitle: 'История заявок',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="time-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Профиль',
                    headerTitle: 'Профиль',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
