/**
 * Ngariung - Main Application Module
 * Initializes and coordinates all modules
 */

const App = {
    /**
     * Initialize application
     */
    async init() {
        CONFIG.log('Initializing Ngariung app...');

        // Check authentication
        if (!Auth.requireAuth()) {
            return;
        }

        // Initialize modules
        this.initializeModules();

        // Setup SignalR event handlers
        this.setupSignalRHandlers();

        // Connect to SignalR
        await SignalRConnection.init();

        // Load initial data
        await Rooms.init();

        // Setup UI interactions
        this.setupUIHandlers();

        // Setup settings
        this.setupSettings();

        CONFIG.log('Ngariung app initialized successfully');
    },

    /**
     * Initialize all modules
     */
    initializeModules() {
        Messages.init();
        MessageComposer.init();
        Members.init();
    },

    /**
     * Setup SignalR event handlers
     */
    setupSignalRHandlers() {
        // Handle incoming messages
        SignalRConnection.onReceiveMessage((message) => {
            CONFIG.log('Received message:', message);
            Messages.addMessage(message);
        });

        // Handle typing indicators
        SignalRConnection.onUserTyping((roomId, userId, displayName) => {
            if (roomId === Rooms.currentRoomId) {
                MessageComposer.showTypingIndicator(userId, displayName);
            }
        });

        // Handle user joined
        SignalRConnection.onUserJoined((roomId, userId, displayName) => {
            if (roomId === Rooms.currentRoomId) {
                Toast.info(`${displayName} bergabung ke ruang`);
                // Could reload members here
            }
        });

        // Handle user left
        SignalRConnection.onUserLeft((roomId, userId, displayName) => {
            if (roomId === Rooms.currentRoomId) {
                Toast.info(`${displayName} keluar dari ruang`);
                // Could reload members here
            }
        });

        // Handle connection changes
        SignalRConnection.onConnectionChanged((status) => {
            if (status === 'disconnected') {
                // Disable message input
                const input = document.getElementById('messageInput');
                if (input) {
                    input.disabled = true;
                    input.placeholder = 'Tidak terhubung...';
                }
            } else if (status === 'connected') {
                // Enable message input
                const input = document.getElementById('messageInput');
                if (input) {
                    input.disabled = false;
                    input.placeholder = 'Ketik pesan...';
                }

                // Rejoin current room if any
                if (Rooms.currentRoomId) {
                    SignalRConnection.joinRoom(Rooms.currentRoomId);
                }
            }
        });
    },

    /**
     * Setup UI handlers
     */
    setupUIHandlers() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Yakin ingin keluar?')) {
                    await Auth.logout();
                }
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.openSettings();
            });
        }

        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');

        if (menuToggle && sidebar) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                const isOpen = sidebar.classList.contains('open');
                menuToggle.setAttribute('aria-expanded', isOpen.toString());
            });
        }

        // Close sidebar on overlay click (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 768) {
                const sidebar = document.getElementById('sidebar');
                const menuToggle = document.getElementById('menuToggle');

                if (sidebar?.classList.contains('open') &&
                    !sidebar.contains(e.target) &&
                    !menuToggle?.contains(e.target)) {
                    sidebar.classList.remove('open');
                    menuToggle?.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Handle window resize
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    },

    /**
     * Handle window resize
     */
    handleResize() {
        // Close sidebar on desktop
        if (window.innerWidth >= 768) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
        }

        // Close members panel on mobile
        if (window.innerWidth < 768) {
            Members.closePanel();
        }
    },

    /**
     * Setup settings
     */
    setupSettings() {
        const form = document.getElementById('settingsForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveSettings(e.target);
        });

        // Load current settings when opening modal
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.loadCurrentSettings();
            });
        }
    },

    /**
     * Open settings modal
     */
    openSettings() {
        this.loadCurrentSettings();
        Modals.open('settingsModal');
    },

    /**
     * Load current user settings
     */
    loadCurrentSettings() {
        const displayNameInput = document.getElementById('displayNameInput');
        const themeSelect = document.getElementById('themeSelect');

        if (displayNameInput) {
            const userName = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_NAME);
            displayNameInput.value = userName || '';
        }

        if (themeSelect) {
            themeSelect.value = Theme.getSavedTheme();
        }

        // Status would come from server/cache in real implementation
        const statusSelect = document.getElementById('statusSelect');
        if (statusSelect) {
            statusSelect.value = 'Online';
        }
    },

    /**
     * Save settings
     */
    async saveSettings(form) {
        const displayName = form.displayName.value.trim();
        const status = form.status.value;
        const theme = form.theme.value;

        // Validate
        Modals.clearFormErrors(form);

        if (!Utils.isValidDisplayName(displayName)) {
            Modals.showFormError('settingsForm', 'displayName',
                `Nama tampilan harus ${CONFIG.SETTINGS.MIN_DISPLAY_NAME_LENGTH}-${CONFIG.SETTINGS.MAX_DISPLAY_NAME_LENGTH} karakter`);
            return;
        }

        // Apply theme immediately
        Theme.saveTheme(theme);
        Theme.applyTheme(theme);

        // Save to server
        try {
            await Utils.apiFetch(CONFIG.API.USERS.ME, {
                method: 'PATCH',
                body: JSON.stringify({ displayName, status })
            });

            // Update localStorage
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_NAME, displayName);

            Toast.success('Pengaturan berhasil disimpan');
            Modals.close('settingsModal');

            // Refresh to show new name (or update UI directly)
            // For simplicity, reload rooms to show new display name
            await Rooms.loadRooms();

        } catch (error) {
            CONFIG.error('Error saving settings:', error);

            let errorMessage = 'Gagal menyimpan pengaturan';
            if (error.status === 400 && error.data) {
                errorMessage = Utils.formatApiError(error.data);
            }

            Modals.showFormError('settingsForm', 'displayName', errorMessage);
            Toast.error(errorMessage);
        }
    },

    /**
     * Cleanup on page unload
     */
    cleanup() {
        SignalRConnection.stop();
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    App.cleanup();
});

// Make App available globally
window.App = App;
