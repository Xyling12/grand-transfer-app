import { Platform } from 'react-native';

// On web (browser), use localhost to avoid CORS issues.
// On native (iOS/Android), use the LAN IP so the device can reach the server.
// Production: https://xn--c1acbe2apap.com
export const API_BASE_URL =
    Platform.OS === 'web'
        ? 'http://localhost:3000'
        : 'http://192.168.0.3:3000';
