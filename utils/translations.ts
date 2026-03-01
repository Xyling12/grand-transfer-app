export const translateTariff = (tariff: string): string => {
    switch (tariff?.toLowerCase()) {
        case 'standart': return 'Стандарт';
        case 'econom': return 'Эконом';
        case 'comfort': return 'Комфорт';
        case 'minivan': return 'Минивэн';
        case 'business': return 'Бизнес';
        default: return tariff;
    }
};

export const translateStatus = (status: string): string => {
    switch (status) {
        case 'NEW': return 'Новая';
        case 'PROCESSING': return 'В обработке';
        case 'DISPATCHED': return 'Поиск водителя';
        case 'TAKEN': return 'Взят в работу';
        case 'COMPLETED': return 'Выполнена';
        case 'CANCELLED': return 'Отменена';
        default: return status;
    }
};

export const translateRole = (role: string): string => {
    switch (role) {
        case 'ADMIN': return 'Админ';
        case 'DISPATCHER': return 'Диспетчер';
        case 'DRIVER': return 'Водитель';
        case 'USER': return 'Пользователь';
        default: return role;
    }
};

export const statusColor = (status: string): string => {
    switch (status) {
        case 'NEW': return '#3b82f6';
        case 'PROCESSING': return '#a78bfa';
        case 'DISPATCHED': return '#eab308';
        case 'TAKEN': return '#22c55e';
        case 'COMPLETED': return '#22c55e';
        case 'CANCELLED': return '#ef4444';
        default: return '#9ca3af';
    }
};

export const statusEmoji = (status: string): string => {
    switch (status) {
        case 'NEW': return '🔵';
        case 'PROCESSING': return '🟣';
        case 'DISPATCHED': return '🟡';
        case 'TAKEN': return '🟢';
        case 'COMPLETED': return '✅';
        case 'CANCELLED': return '❌';
        default: return '⚪';
    }
};
