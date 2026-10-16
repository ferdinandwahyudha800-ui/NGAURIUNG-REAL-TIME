/**
 * Ngariung - Configuration
 * Central configuration untuk API endpoints dan settings
 */

const CONFIG = {
    // API Base URL
    // Saat development dengan backend .NET: 'https://localhost:5001'
    // Saat production: sesuaikan dengan domain server
    API_BASE_URL: window.location.origin,

    // API Endpoints
    API: {
        // Auth endpoints
        AUTH: {
            REGISTER: '/api/auth/register',
            LOGIN: '/api/auth/login',
            LOGOUT: '/api/auth/logout'
        },

        // Room endpoints
        ROOMS: {
            LIST: '/api/rooms',
            CREATE: '/api/rooms',
            GET: (id) => `/api/rooms/${id}`,
            LEAVE: (id) => `/api/rooms/${id}/members/me`,
            MESSAGES: (id) => `/api/rooms/${id}/messages`
        },

        // User endpoints
        USERS: {
            LIST: '/api/users',
            ME: '/api/me',
            DM: (userId) => `/api/dm/${userId}`
        },

        // File upload (jika diimplementasi nanti)
        FILES: {
            UPLOAD: '/api/files'
        }
    },

    // SignalR Hub URL
    SIGNALR_HUB_URL: '/chatHub',

    // Local Storage Keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'ngariung_auth_token',
        USER_ID: 'ngariung_user_id',
        USER_NAME: 'ngariung_user_name',
        THEME: 'ngariung_theme',
        LAST_ROOM: 'ngariung_last_room'
    },

    // App Settings
    SETTINGS: {
        // Jumlah pesan per load
        MESSAGES_PER_PAGE: 50,

        // Timeout untuk typing indicator (ms)
        TYPING_TIMEOUT: 5000,

        // Debounce untuk typing event (ms)
        TYPING_DEBOUNCE: 3000,

        // Auto reconnect delays (ms)
        RECONNECT_DELAYS: [1000, 2000, 4000, 8000, 16000, 30000],

        // Toast auto dismiss duration (ms)
        TOAST_DURATION: 3000,

        // Character limits
        MAX_MESSAGE_LENGTH: 500,
        MAX_DISPLAY_NAME_LENGTH: 50,
        MIN_DISPLAY_NAME_LENGTH: 2,
        MAX_ROOM_NAME_LENGTH: 50,
        MIN_ROOM_NAME_LENGTH: 3,
        MAX_ROOM_DESC_LENGTH: 200,
        MIN_PASSWORD_LENGTH: 6
    },

    // Feature Flags (untuk development)
    FEATURES: {
        // Demo mode: gunakan mock data tanpa backend
        DEMO_MODE: false,

        // Enable debug logging
        DEBUG: true,

        // Enable file upload (MVP: false, v1.1: true)
        FILE_UPLOAD: false,

        // Enable emoji reactions (v2.0)
        EMOJI_REACTIONS: false
    }
};

// Helper function untuk build full API URL
CONFIG.buildUrl = function (endpoint) {
    return `${this.API_BASE_URL}${endpoint}`;
};

// Helper function untuk get auth header
CONFIG.getAuthHeader = function () {
    const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Debug logger helper
CONFIG.log = function (...args) {
    if (this.FEATURES.DEBUG) {
        console.log('[Ngariung]', ...args);
    }
};

CONFIG.error = function (...args) {
    if (this.FEATURES.DEBUG) {
        console.error('[Ngariung Error]', ...args);
    }
};

CONFIG.warn = function (...args) {
    if (this.FEATURES.DEBUG) {
        console.warn('[Ngariung Warning]', ...args);
    }
};

// Make config available globally
window.CONFIG = CONFIG;
