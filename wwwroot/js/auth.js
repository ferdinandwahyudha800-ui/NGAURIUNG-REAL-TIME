/**
 * Ngariung - Authentication Module
 * Handles auth token validation, user session, and redirects
 */

const Auth = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) return false;

        // Check if token expired
        if (Utils.isTokenExpired(token)) {
            this.logout();
            return false;
        }

        return true;
    },

    /**
     * Get current user info from token and localStorage
     */
    getCurrentUser() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const userId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);
        const userName = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME);

        if (!token || !userId) return null;

        return {
            userId,
            userName,
            token
        };
    },

    /**
     * Save auth session to localStorage
     */
    saveSession(token, userId, displayName) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, userId);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, displayName);
        CONFIG.log('Session saved for user:', displayName);
    },

    /**
     * Clear auth session
     */
    clearSession() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_NAME);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_ROOM);
        CONFIG.log('Session cleared');
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            // Call logout endpoint (best effort)
            await Utils.apiFetch(CONFIG.API.AUTH.LOGOUT, {
                method: 'POST'
            }).catch(() => {
                // Ignore error, clear session anyway
            });
        } finally {
            this.clearSession();
            this.redirectToAuth();
        }
    },

    /**
     * Redirect to auth page
     */
    redirectToAuth() {
        if (!window.location.pathname.includes('auth.html')) {
            window.location.href = 'auth.html';
        }
    },

    /**
     * Redirect to main app
     */
    redirectToApp() {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
    },

    /**
     * Protect page - redirect to auth if not authenticated
     * Call this at the top of index.html page load
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            this.redirectToAuth();
            return false;
        }
        return true;
    },

    /**
     * Auth page check - redirect to app if already authenticated
     * Call this at the top of auth.html page load
     */
    skipIfAuthenticated() {
        if (this.isAuthenticated()) {
            this.redirectToApp();
            return false;
        }
        return true;
    }
};

// Make Auth available globally
window.Auth = Auth;
