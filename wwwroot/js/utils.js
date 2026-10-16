/**
 * Ngariung - Utility Functions
 * Helper functions yang digunakan di seluruh aplikasi
 */

const Utils = {
    /**
     * Escape HTML untuk mencegah XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Format timestamp ke format yang lebih readable
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        // Jika hari ini
        if (diffDays === 0) {
            if (diffMins < 1) return 'Baru saja';
            if (diffMins < 60) return `${diffMins} menit yang lalu`;
            if (diffHours < 24) return `${diffHours} jam yang lalu`;
        }

        // Jika kemarin
        if (diffDays === 1) {
            return `Kemarin ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Jika lebih dari kemarin
        if (diffDays < 7) {
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            return `${days[date.getDay()]} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Format lengkap
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Format time untuk message display (hanya jam:menit)
     */
    formatMessageTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Validasi email format
     */
    isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    /**
     * Validasi display name
     */
    isValidDisplayName(name) {
        return name.length >= CONFIG.SETTINGS.MIN_DISPLAY_NAME_LENGTH &&
            name.length <= CONFIG.SETTINGS.MAX_DISPLAY_NAME_LENGTH;
    },

    /**
     * Validasi password
     */
    isValidPassword(password) {
        return password.length >= CONFIG.SETTINGS.MIN_PASSWORD_LENGTH;
    },

    /**
     * Validasi room name
     */
    isValidRoomName(name) {
        const regex = /^[a-zA-Z0-9_-]+$/;
        return name.length >= CONFIG.SETTINGS.MIN_ROOM_NAME_LENGTH &&
            name.length <= CONFIG.SETTINGS.MAX_ROOM_NAME_LENGTH &&
            regex.test(name);
    },

    /**
     * Generate initials dari nama untuk avatar
     */
    getInitials(name) {
        if (!name) return '?';
        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].substring(0, 2).toUpperCase();
        }
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    },

    /**
     * Generate warna konsisten dari string (untuk avatar)
     */
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
            '#3182ce', '#38a169', '#d69e2e', '#e53e3e',
            '#805ad5', '#d53f8c', '#319795', '#dd6b20'
        ];
        return colors[Math.abs(hash) % colors.length];
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, limit) {
        let inThrottle;
        return function (...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Scroll element to bottom smoothly
     */
    scrollToBottom(element, smooth = true) {
        if (!element) return;
        element.scrollTo({
            top: element.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    },

    /**
     * Check if element is scrolled to bottom
     */
    isScrolledToBottom(element, threshold = 100) {
        if (!element) return true;
        return element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
    },

    /**
     * Copy text to clipboard
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            CONFIG.error('Failed to copy to clipboard:', err);
            return false;
        }
    },

    /**
     * Format file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    },

    /**
     * Parse JWT token (tanpa verifikasi)
     */
    parseJWT(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            CONFIG.error('Failed to parse JWT:', e);
            return null;
        }
    },

    /**
     * Check if JWT token is expired
     */
    isTokenExpired(token) {
        const payload = this.parseJWT(token);
        if (!payload || !payload.exp) return true;
        return Date.now() >= payload.exp * 1000;
    },

    /**
     * Get user ID from JWT token
     */
    getUserIdFromToken(token) {
        const payload = this.parseJWT(token);
        return payload?.sub || payload?.userId || null;
    },

    /**
     * Sanitize input untuk mencegah XSS
     */
    sanitizeInput(input) {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            .trim();
    },

    /**
     * Generate random ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Wait for element to exist in DOM
     */
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    },

    /**
     * Format error message dari API response
     */
    formatApiError(error) {
        if (typeof error === 'string') return error;
        if (error.error) return error.error;
        if (error.message) return error.message;
        if (error.title) return error.title;
        return 'Terjadi kesalahan. Silakan coba lagi.';
    },

    /**
     * Handle API fetch with error handling
     */
    async apiFetch(url, options = {}) {
        try {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                    ...CONFIG.getAuthHeader(),
                    ...options.headers
                }
            };

            const response = await fetch(CONFIG.buildUrl(url), {
                ...options,
                headers: defaultOptions.headers
            });

            // Handle non-JSON responses
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const data = isJson ? await response.json() : await response.text();

            if (!response.ok) {
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    data: data
                };
            }

            return data;
        } catch (error) {
            CONFIG.error('API Fetch error:', error);
            throw error;
        }
    }
};

// Make utils available globally
window.Utils = Utils;
