export type UserRole = 'USER' | 'DRIVER' | 'DISPATCHER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'APPROVED' | 'BANNED';
export type OrderStatus = 'NEW' | 'PROCESSING' | 'DISPATCHED' | 'TAKEN' | 'COMPLETED' | 'CANCELLED';
export type Tariff = 'econom' | 'standart' | 'comfort' | 'minivan' | 'business';
export type TicketType = 'SUPPORT' | 'BUG';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';

export interface Driver {
    id: string;
    telegramId?: string;
    firstName?: string;
    fullFio?: string;
    phone?: string;
    username?: string;
    role: UserRole;
    status: UserStatus;
    subExpiresAt?: string | null;
    createdAt?: string;
    pushToken?: string | null;
}

export interface Order {
    id: number;
    fromCity: string;
    toCity: string;
    tariff: string;
    passengers: number;
    priceEstimate: number | null;
    customerName: string;
    customerPhone: string;
    comments: string | null;
    scheduledDate: string | null;
    status: OrderStatus;
    sourceSite: string | null;
    createdAt: string;
    takenAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    driverId: string | null;
    dispatcherId: string | null;
    driver?: Partial<Driver> | null;
    dispatcher?: Partial<Driver> | null;
}

export interface SupportTicket {
    id: number;
    type: TicketType;
    status: TicketStatus;
    subject: string;
    createdAt: string;
    userId: string;
    assignedTo: string | null;
    messages?: TicketMessage[];
}

export interface TicketMessage {
    id: number;
    ticketId: number;
    senderId: string;
    senderName: string;
    text: string;
    createdAt: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    driver?: Driver;
    error?: string;
    message?: string;
}

export interface OrdersResponse {
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
}
