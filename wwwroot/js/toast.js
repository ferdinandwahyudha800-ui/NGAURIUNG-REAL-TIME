/**
 * Ngariung - Toast Notification Module
 * Handles displaying toast messages to users
 */

const Toast = {
    TYPES: {
        INFO: 'info',
        SUCCESS: 'success',
        WARNING: 'warning',
        ERROR: 'error'
    },

    /**
     * Show toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type of toast (info, success, warning, error)
     * @param {number} duration - Duration in ms (0 = no auto dismiss)
     */
    show(message, type = 'info', duration = CONFIG.SETTINGS.TOAST_DURATION) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            CONFIG.error('Toast container not found');
            return;
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        // Icon based on type
        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${Utils.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Tutup notifikasi">✕</button>
        `;

        // Add to container
        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('toast-show');
        });

        // Setup close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(toast);
        });

        // Auto dismiss if duration specified
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(toast);
            }, duration);
        }

        CONFIG.log('Toast shown:', type, message);

        return toast;
    },

    /**
     * Dismiss a toast
     */
    dismiss(toast) {
        if (!toast || !toast.parentElement) return;

        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');

        // Remove from DOM after animation
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    },

    /**
     * Show info toast
     */
    info(message, duration) {
        return this.show(message, this.TYPES.INFO, duration);
    },

    /**
     * Show success toast
     */
    success(message, duration) {
        return this.show(message, this.TYPES.SUCCESS, duration);
    },

    /**
     * Show warning toast
     */
    warning(message, duration) {
        return this.show(message, this.TYPES.WARNING, duration);
    },

    /**
     * Show error toast
     */
    error(message, duration) {
        return this.show(message, this.TYPES.ERROR, duration);
    },

    /**
     * Clear all toasts
     */
    clearAll() {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toasts = container.querySelectorAll('.toast');
        toasts.forEach(toast => this.dismiss(toast));
    }
};

// Make Toast available globally
window.Toast = Toast;
