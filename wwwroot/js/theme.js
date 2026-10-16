/**
 * Ngariung - Theme Module
 * Handles light/dark theme switching and persistence
 */

const Theme = {
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    },

    /**
     * Initialize theme on page load
     */
    init() {
        const savedTheme = this.getSavedTheme();
        this.applyTheme(savedTheme);
        this.setupToggleButton();
        this.watchSystemTheme();

        CONFIG.log('Theme initialized:', savedTheme);
    },

    /**
     * Get saved theme from localStorage or default to system
     */
    getSavedTheme() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || this.THEMES.SYSTEM;
    },

    /**
     * Save theme preference to localStorage
     */
    saveTheme(theme) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
    },

    /**
     * Get system preferred theme
     */
    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.THEMES.DARK;
        }
        return this.THEMES.LIGHT;
    },

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        const effectiveTheme = theme === this.THEMES.SYSTEM ? this.getSystemTheme() : theme;

        // Set data attribute on html element
        document.documentElement.setAttribute('data-theme', effectiveTheme);

        // Update toggle button icon if exists
        this.updateToggleIcon(effectiveTheme);

        CONFIG.log('Applied theme:', effectiveTheme);
    },

    /**
     * Toggle between light and dark
     */
    toggle() {
        const currentTheme = this.getSavedTheme();
        const effectiveTheme = currentTheme === this.THEMES.SYSTEM ? this.getSystemTheme() : currentTheme;

        // Toggle between light and dark (skip system for manual toggle)
        const newTheme = effectiveTheme === this.THEMES.DARK ? this.THEMES.LIGHT : this.THEMES.DARK;

        this.saveTheme(newTheme);
        this.applyTheme(newTheme);

        CONFIG.log('Theme toggled to:', newTheme);
    },

    /**
     * Update toggle button icon based on theme
     */
    updateToggleIcon(theme) {
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (!toggleBtn) return;

        const icon = toggleBtn.querySelector('.theme-icon');
        if (icon) {
            icon.textContent = theme === this.THEMES.DARK ? '☀️' : '🌙';
        }

        toggleBtn.setAttribute('aria-label', `Ganti ke tema ${theme === this.THEMES.DARK ? 'terang' : 'gelap'}`);
    },

    /**
     * Setup toggle button event listener
     */
    setupToggleButton() {
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.toggle();
        });

        // Also handle settings dropdown if exists
        const themeSelect = document.getElementById('themeSelect');
        if (themeSelect) {
            themeSelect.value = this.getSavedTheme();
            themeSelect.addEventListener('change', (e) => {
                const theme = e.target.value;
                this.saveTheme(theme);
                this.applyTheme(theme);
            });
        }
    },

    /**
     * Watch for system theme changes
     */
    watchSystemTheme() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        mediaQuery.addEventListener('change', (e) => {
            const savedTheme = this.getSavedTheme();

            // Only apply if user is using system theme
            if (savedTheme === this.THEMES.SYSTEM) {
                const systemTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
                this.applyTheme(this.THEMES.SYSTEM);
                CONFIG.log('System theme changed to:', systemTheme);
            }
        });
    }
};

// Make Theme available globally
window.Theme = Theme;

// Auto-initialize theme as early as possible to prevent flash
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Theme.init());
} else {
    Theme.init();
}
