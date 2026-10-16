/**
 * Ngariung - SignalR Connection Module
 * Handles real-time connection with SignalR Hub
 * 
 * NOTE: Requires @microsoft/signalr library
 * Add to HTML: <script src="https://cdn.jsdelivr.net/npm/@microsoft/signalr@latest/dist/browser/signalr.min.js"></script>
 */

const SignalRConnection = {
    connection: null,
    reconnectAttempt: 0,
    isConnecting: false,
    callbacks: {
        onReceiveMessage: [],
        onUserTyping: [],
        onUserJoined: [],
        onUserLeft: [],
        onConnectionChanged: []
    },

    /**
     * Initialize SignalR connection
     */
    async init() {
        if (!window.signalR) {
            CONFIG.error('SignalR library not loaded');
            Toast.error('Koneksi real-time tidak tersedia. Muat ulang halaman.');
            return;
        }

        const user = Auth.getCurrentUser();
        if (!user) {
            CONFIG.error('Cannot initialize SignalR: user not authenticated');
            return;
        }

        // Build connection
        this.connection = new signalR.HubConnectionBuilder()
            .withUrl(CONFIG.buildUrl(CONFIG.SIGNALR_HUB_URL), {
                accessTokenFactory: () => user.token
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: retryContext => {
                    const delays = CONFIG.SETTINGS.RECONNECT_DELAYS;
                    const delayIndex = Math.min(retryContext.previousRetryCount, delays.length - 1);
                    return delays[delayIndex];
                }
            })
            .configureLogging(CONFIG.FEATURES.DEBUG ? signalR.LogLevel.Information : signalR.LogLevel.Warning)
            .build();

        // Setup event handlers
        this.setupEventHandlers();

        // Start connection
        await this.start();
    },

    /**
     * Setup SignalR event handlers
     */
    setupEventHandlers() {
        if (!this.connection) return;

        // Server -> Client: New message received
        this.connection.on('ReceiveMessage', (message) => {
            CONFIG.log('SignalR: ReceiveMessage', message);
            this.callbacks.onReceiveMessage.forEach(cb => cb(message));
        });

        // Server -> Client: User started typing
        this.connection.on('UserTyping', (roomId, userId, displayName) => {
            CONFIG.log('SignalR: UserTyping', roomId, userId, displayName);
            this.callbacks.onUserTyping.forEach(cb => cb(roomId, userId, displayName));
        });

        // Server -> Client: User joined room
        this.connection.on('UserJoined', (roomId, userId, displayName) => {
            CONFIG.log('SignalR: UserJoined', roomId, userId, displayName);
            this.callbacks.onUserJoined.forEach(cb => cb(roomId, userId, displayName));
        });

        // Server -> Client: User left room
        this.connection.on('UserLeft', (roomId, userId, displayName) => {
            CONFIG.log('SignalR: UserLeft', roomId, userId, displayName);
            this.callbacks.onUserLeft.forEach(cb => cb(roomId, userId, displayName));
        });

        // Connection state change handlers
        this.connection.onreconnecting(() => {
            CONFIG.warn('SignalR reconnecting...');
            this.updateConnectionStatus('reconnecting');
        });

        this.connection.onreconnected(() => {
            CONFIG.log('SignalR reconnected');
            this.reconnectAttempt = 0;
            this.updateConnectionStatus('connected');
            Toast.success('Koneksi dipulihkan');
        });

        this.connection.onclose((error) => {
            CONFIG.error('SignalR connection closed', error);
            this.updateConnectionStatus('disconnected');

            if (error) {
                Toast.error('Koneksi terputus');
            }
        });
    },

    /**
     * Start SignalR connection
     */
    async start() {
        if (!this.connection || this.isConnecting) return;

        this.isConnecting = true;
        this.updateConnectionStatus('connecting');

        try {
            await this.connection.start();
            CONFIG.log('SignalR connected');
            this.reconnectAttempt = 0;
            this.updateConnectionStatus('connected');
        } catch (error) {
            CONFIG.error('SignalR connection failed', error);
            this.updateConnectionStatus('disconnected');
            Toast.error('Gagal terhubung ke server');
        } finally {
            this.isConnecting = false;
        }
    },

    /**
     * Stop SignalR connection
     */
    async stop() {
        if (!this.connection) return;

        try {
            await this.connection.stop();
            CONFIG.log('SignalR disconnected');
        } catch (error) {
            CONFIG.error('Error stopping SignalR', error);
        }
    },

    /**
     * Join a room (SignalR group)
     */
    async joinRoom(roomId) {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            CONFIG.error('Cannot join room: not connected');
            return false;
        }

        try {
            await this.connection.invoke('JoinRoom', roomId);
            CONFIG.log('Joined SignalR room:', roomId);
            return true;
        } catch (error) {
            CONFIG.error('Error joining room:', error);
            Toast.error('Gagal bergabung ke ruang');
            return false;
        }
    },

    /**
     * Send message to room
     */
    async sendMessage(roomId, text) {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            CONFIG.error('Cannot send message: not connected');
            return false;
        }

        try {
            await this.connection.invoke('SendMessage', roomId, text);
            CONFIG.log('Message sent via SignalR');
            return true;
        } catch (error) {
            CONFIG.error('Error sending message:', error);

            // Check for rate limit error
            if (error.message && error.message.includes('rate limit')) {
                Toast.error('Anda mengirim pesan terlalu cepat. Tunggu sebentar.');
            } else {
                Toast.error('Gagal mengirim pesan');
            }

            return false;
        }
    },

    /**
     * Notify typing indicator
     */
    async startTyping(roomId) {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return;
        }

        try {
            await this.connection.invoke('StartTyping', roomId);
        } catch (error) {
            // Silent fail for typing indicator
            CONFIG.warn('Error sending typing indicator:', error);
        }
    },

    /**
     * Mark messages as read
     */
    async markRead(roomId) {
        if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
            return;
        }

        try {
            await this.connection.invoke('MarkRead', roomId);
            CONFIG.log('Marked messages as read for room:', roomId);
        } catch (error) {
            CONFIG.warn('Error marking as read:', error);
        }
    },

    /**
     * Update connection status UI
     */
    updateConnectionStatus(status) {
        const statusEl = document.getElementById('connectionStatus');
        if (!statusEl) return;

        const statusText = statusEl.querySelector('.status-text');

        statusEl.className = 'connection-status';

        switch (status) {
            case 'connecting':
                statusEl.classList.add('status-connecting');
                if (statusText) statusText.textContent = 'Menghubungkan...';
                break;
            case 'connected':
                statusEl.classList.add('status-connected');
                if (statusText) statusText.textContent = 'Terhubung';
                // Hide after 2 seconds
                setTimeout(() => {
                    statusEl.classList.add('status-hidden');
                }, 2000);
                break;
            case 'reconnecting':
                statusEl.classList.add('status-reconnecting');
                statusEl.classList.remove('status-hidden');
                if (statusText) statusText.textContent = 'Menyambung kembali...';
                break;
            case 'disconnected':
                statusEl.classList.add('status-disconnected');
                statusEl.classList.remove('status-hidden');
                if (statusText) statusText.textContent = 'Terputus';
                break;
        }

        this.callbacks.onConnectionChanged.forEach(cb => cb(status));
    },

    /**
     * Register callback for ReceiveMessage event
     */
    onReceiveMessage(callback) {
        this.callbacks.onReceiveMessage.push(callback);
    },

    /**
     * Register callback for UserTyping event
     */
    onUserTyping(callback) {
        this.callbacks.onUserTyping.push(callback);
    },

    /**
     * Register callback for UserJoined event
     */
    onUserJoined(callback) {
        this.callbacks.onUserJoined.push(callback);
    },

    /**
     * Register callback for UserLeft event
     */
    onUserLeft(callback) {
        this.callbacks.onUserLeft.push(callback);
    },

    /**
     * Register callback for connection status change
     */
    onConnectionChanged(callback) {
        this.callbacks.onConnectionChanged.push(callback);
    },

    /**
     * Check if connected
     */
    isConnected() {
        return this.connection && this.connection.state === signalR.HubConnectionState.Connected;
    }
};

// Make SignalRConnection available globally
window.SignalRConnection = SignalRConnection;
