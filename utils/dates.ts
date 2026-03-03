/**
 * Форматирование дат — ДД/ММ/ГГГГ (и ДД/ММ/ГГГГ ЧЧ:ММ для datetime)
 * Единое место для изменения формата дат во всём приложении.
 */

const RU_DATE_OPTS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
};

const RU_DATETIME_OPTS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
};

/** ДД/ММ/ГГГГ */
export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('ru-RU', RU_DATE_OPTS);
    } catch {
        return String(value);
    }
}

/** ДД/ММ/ГГГГ ЧЧ:ММ */
export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('ru-RU', RU_DATETIME_OPTS);
    } catch {
        return String(value);
    }
}
