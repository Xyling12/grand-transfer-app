/**
 * Minimal mock for react-native
 * Only exposes what tests need: Platform
 */
export const Platform = {
    OS: 'ios' as 'ios' | 'android' | 'web',
};

export const Alert = {
    alert: () => { },
};
