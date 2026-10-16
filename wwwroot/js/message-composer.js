/**
 * Ngariung - Message Composer Module
 * Handles message input, sending, typing indicators, and character counter
 */

const MessageComposer = {
    typingTimeout: null,
    isTyping: false,

    /**
     * Initialize message composer
     */
    init() {
        this.setupMessageInput();
        this.setupSendButton();
        this.setupCharacterCounter();
        CONFIG.log('Message composer initialized');
    },

    /**
     * Setup message input
     */
    setupMessageInput() {
        const input = document.getElementById('messageInput');
        if (!input) return;

        // Auto-resize textarea
        input.addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
            this.updateCharacterCounter(e.target.value.length);
            this.handleTyping();
        });

        // Send on Ctrl+Enter or Cmd+Enter
        input.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Prevent default Enter (newline) if Shift not pressed (optional)
        // Uncomment if you want Enter to send, Shift+Enter for newline
        /*
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        */
    },

    /**
     * Auto-resize textarea based on content
     */
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    },

    /**
     * Setup send button
     */
    setupSendButton() {
        const sendBtn = document.getElementById('sendBtn');
        const input = document.getElementById('messageInput');

        if (!sendBtn || !input) return;

        // Enable/disable based on input
        input.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            sendBtn.disabled = !hasText;
        });

        // Send on click
        sendBtn.addEventListener('click', () => {
            this.sendMessage();
        });
    },

    /**
     * Setup character counter
     */
    setupCharacterCounter() {
        const input = document.getElementById('messageInput');
        const counter = document.getElementById('charCounter');

        if (!input || !counter) return;

        input.addEventListener('input', (e) => {
            this.updateCharacterCounter(e.target.value.length);
        });
    },

    /**
     * Update character counter display
     */
    updateCharacterCounter(count) {
        const counter = document.getElementById('charCounter');
        if (!counter) return;

        const max = CONFIG.SETTINGS.MAX_MESSAGE_LENGTH;
        counter.textContent = `${count}/${max}`;

        // Warning color if near limit
        if (count > max * 0.9) {
            counter.style.color = 'var(--danger)';
        } else {
            counter.style.color = '';
        }
    },

    /**
     * Handle typing indicator
     */
    handleTyping() {
        const roomId = Rooms.currentRoomId;
        if (!roomId) return;

        // Clear existing timeout
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // Send typing indicator if not already typing
        if (!this.isTyping) {
            this.isTyping = true;
            SignalRConnection.startTyping(roomId);
        }

        // Reset typing after timeout
        this.typingTimeout = setTimeout(() => {
            this.isTyping = false;
        }, CONFIG.SETTINGS.TYPING_TIMEOUT);
    },

    /**
     * Send message
     */
    async sendMessage() {
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');

        if (!input || !sendBtn) return;

        const text = input.value.trim();
        const roomId = Rooms.currentRoomId;

        // Validate
        if (!text || !roomId) return;

        if (text.length > CONFIG.SETTINGS.MAX_MESSAGE_LENGTH) {
            Toast.error(`Pesan terlalu panjang. Maksimal ${CONFIG.SETTINGS.MAX_MESSAGE_LENGTH} karakter.`);
            return;
        }

        // Check connection
        if (!SignalRConnection.isConnected()) {
            Toast.error('Tidak terhubung. Pesan tidak dapat dikirim.');
            return;
        }

        // Disable input
        input.disabled = true;
        sendBtn.disabled = true;

        try {
            // Send via SignalR
            const success = await SignalRConnection.sendMessage(roomId, text);

            if (success) {
                // Clear input
                input.value = '';
                input.style.height = 'auto';
                this.updateCharacterCounter(0);

                // Reset typing
                this.isTyping = false;
                if (this.typingTimeout) {
                    clearTimeout(this.typingTimeout);
                }

                // Scroll to bottom
                Messages.scrollToBottom(true);

                CONFIG.log('Message sent');
            }

        } catch (error) {
            CONFIG.error('Error sending message:', error);
            Toast.error('Gagal mengirim pesan');
        } finally {
            // Re-enable input
            input.disabled = false;
            input.focus();
        }
    },

    /**
     * Display typing indicator for other users
     */
    showTypingIndicator(userId, displayName) {
        const container = document.getElementById('typingIndicators');
        if (!container) return;

        const currentUserId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);
        if (userId === currentUserId) return; // Don't show own typing

        // Check if already showing
        let indicator = container.querySelector(`[data-user-id="${userId}"]`);

        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'typing-indicator';
            indicator.setAttribute('data-user-id', userId);
            indicator.innerHTML = `
                <span class="typing-user">${Utils.escapeHtml(displayName)}</span> sedang mengetik
                <span class="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            `;
            container.appendChild(indicator);
        }

        // Clear existing timeout
        if (indicator.timeout) {
            clearTimeout(indicator.timeout);
        }

        // Auto-hide after timeout
        indicator.timeout = setTimeout(() => {
            this.hideTypingIndicator(userId);
        }, CONFIG.SETTINGS.TYPING_TIMEOUT);
    },

    /**
     * Hide typing indicator
     */
    hideTypingIndicator(userId) {
        const container = document.getElementById('typingIndicators');
        if (!container) return;

        const indicator = container.querySelector(`[data-user-id="${userId}"]`);
        if (indicator) {
            indicator.remove();
        }
    },

    /**
     * Clear all typing indicators
     */
    clearTypingIndicators() {
        const container = document.getElementById('typingIndicators');
        if (container) {
            container.innerHTML = '';
        }
    }
};

// Make MessageComposer available globally
window.MessageComposer = MessageComposer;
