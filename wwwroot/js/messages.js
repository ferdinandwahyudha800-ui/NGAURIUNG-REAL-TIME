/**
 * Ngariung - Messages Module
 * Handles message display, infinite scroll, and message grouping
 */

const Messages = {
    currentRoomId: null,
    messages: [],
    isLoadingMore: false,
    hasMore: true,
    observer: null,

    /**
     * Initialize messages module
     */
    init() {
        this.setupScrollButton();
        this.setupIntersectionObserver();
        CONFIG.log('Messages module initialized');
    },

    /**
     * Load messages for a room
     */
    async loadMessages(roomId, before = null) {
        if (!roomId) return;

        this.currentRoomId = roomId;
        const messagesList = document.getElementById('messagesList');

        if (!messagesList) return;

        // Show loading for initial load
        if (!before) {
            messagesList.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Memuat pesan...</p>
                </div>
            `;
            this.messages = [];
        }

        try {
            const params = new URLSearchParams({
                limit: CONFIG.SETTINGS.MESSAGES_PER_PAGE.toString()
            });

            if (before) {
                params.append('before', before);
            }

            const response = await Utils.apiFetch(
                `${CONFIG.API.ROOMS.MESSAGES(roomId)}?${params}`
            );

            this.hasMore = response.hasMore;
            const newMessages = response.messages || [];

            if (before) {
                // Prepend older messages
                this.messages = [...newMessages, ...this.messages];
            } else {
                // Initial load
                this.messages = newMessages;
            }

            this.renderMessages();

            // Scroll to bottom on initial load
            if (!before) {
                this.scrollToBottom(false);
            }

            // Mark as read
            await SignalRConnection.markRead(roomId);

        } catch (error) {
            CONFIG.error('Error loading messages:', error);

            if (!before) {
                messagesList.innerHTML = `
                    <div class="empty-state">
                        <p>Gagal memuat pesan</p>
                        <button class="btn btn-secondary btn-sm" onclick="Messages.loadMessages('${roomId}')">Coba Lagi</button>
                    </div>
                `;
            }

            Toast.error('Gagal memuat pesan');
        }
    },

    /**
     * Render messages with grouping
     */
    renderMessages() {
        const messagesList = document.getElementById('messagesList');
        if (!messagesList) return;

        if (this.messages.length === 0) {
            messagesList.innerHTML = `
                <div class="empty-state">
                    <div class="welcome-icon">💬</div>
                    <p>Belum ada pesan</p>
                    <p class="text-muted">Mulai percakapan dengan mengirim pesan pertama</p>
                </div>
            `;
            return;
        }

        const currentUserId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);
        const grouped = this.groupMessages(this.messages);

        const messagesHtml = grouped.map(group => {
            const isOwn = group.senderId === currentUserId;
            const initials = Utils.getInitials(group.senderName);
            const avatarColor = Utils.stringToColor(group.senderName);

            const messagesInGroup = group.messages.map((msg, idx) => {
                const time = Utils.formatMessageTime(msg.createdAt);
                return `
                    <div class="message-bubble" data-message-id="${msg.id}">
                        <div class="message-text">${this.formatMessageBody(msg.body)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                `;
            }).join('');

            return `
                <div class="message-group ${isOwn ? 'message-own' : ''}">
                    ${!isOwn ? `
                        <div class="message-avatar" style="background-color: ${avatarColor}">
                            ${initials}
                        </div>
                    ` : ''}
                    <div class="message-content">
                        ${!isOwn ? `<div class="message-sender">${Utils.escapeHtml(group.senderName)}</div>` : ''}
                        ${messagesInGroup}
                    </div>
                </div>
            `;
        }).join('');

        messagesList.innerHTML = messagesHtml;

        // Setup intersection observer on first message for infinite scroll
        if (this.hasMore && this.messages.length > 0) {
            const firstMessage = messagesList.querySelector('.message-group');
            if (firstMessage && this.observer) {
                this.observer.observe(firstMessage);
            }
        }
    },

    /**
     * Group consecutive messages from same sender
     */
    groupMessages(messages) {
        const groups = [];
        let currentGroup = null;

        messages.forEach(msg => {
            // Start new group if sender changed or more than 5 minutes gap
            const shouldStartNewGroup = !currentGroup ||
                currentGroup.senderId !== msg.senderId ||
                (new Date(msg.createdAt) - new Date(currentGroup.lastTime)) > 300000; // 5 min

            if (shouldStartNewGroup) {
                currentGroup = {
                    senderId: msg.senderId,
                    senderName: msg.senderName,
                    messages: [msg],
                    lastTime: msg.createdAt
                };
                groups.push(currentGroup);
            } else {
                currentGroup.messages.push(msg);
                currentGroup.lastTime = msg.createdAt;
            }
        });

        return groups;
    },

    /**
     * Format message body (convert URLs to links, preserve newlines)
     */
    formatMessageBody(body) {
        // Escape HTML first
        let formatted = Utils.escapeHtml(body);

        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

        // Convert newlines to <br>
        formatted = formatted.replace(/\n/g, '<br>');

        return formatted;
    },

    /**
     * Add new message (from SignalR)
     */
    addMessage(message) {
        if (message.roomId !== this.currentRoomId) return;

        // Check if message already exists
        if (this.messages.find(m => m.id === message.id)) {
            return;
        }

        // Add to messages array
        this.messages.push(message);

        // Check if user is at bottom
        const messagesScroll = document.getElementById('messagesScroll');
        const wasAtBottom = Utils.isScrolledToBottom(messagesScroll);

        // Re-render
        this.renderMessages();

        // Scroll to bottom if was at bottom
        if (wasAtBottom) {
            this.scrollToBottom(true);
        } else {
            // Show scroll button
            this.showScrollButton();
        }

        // Mark as read if at bottom
        if (wasAtBottom) {
            SignalRConnection.markRead(this.currentRoomId);
        }

        // Play notification sound (optional)
        const currentUserId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);
        if (message.senderId !== currentUserId) {
            this.playNotificationSound();
        }
    },

    /**
     * Setup scroll to bottom button
     */
    setupScrollButton() {
        const scrollBtn = document.getElementById('scrollToBottom');
        const messagesScroll = document.getElementById('messagesScroll');

        if (!scrollBtn || !messagesScroll) return;

        scrollBtn.addEventListener('click', () => {
            this.scrollToBottom(true);
            scrollBtn.style.display = 'none';
        });

        // Show/hide button on scroll
        messagesScroll.addEventListener('scroll', Utils.throttle(() => {
            if (Utils.isScrolledToBottom(messagesScroll)) {
                scrollBtn.style.display = 'none';

                // Mark as read when scrolled to bottom
                if (this.currentRoomId) {
                    SignalRConnection.markRead(this.currentRoomId);
                }
            }
        }, 200));
    },

    /**
     * Show scroll to bottom button
     */
    showScrollButton() {
        const scrollBtn = document.getElementById('scrollToBottom');
        if (scrollBtn) {
            scrollBtn.style.display = 'flex';
        }
    },

    /**
     * Scroll to bottom
     */
    scrollToBottom(smooth = true) {
        const messagesScroll = document.getElementById('messagesScroll');
        Utils.scrollToBottom(messagesScroll, smooth);
    },

    /**
     * Setup intersection observer for infinite scroll
     */
    setupIntersectionObserver() {
        const options = {
            root: document.getElementById('messagesScroll'),
            rootMargin: '100px',
            threshold: 0.1
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.hasMore && !this.isLoadingMore) {
                    this.loadMoreMessages();
                }
            });
        }, options);
    },

    /**
     * Load more messages (infinite scroll)
     */
    async loadMoreMessages() {
        if (!this.currentRoomId || !this.hasMore || this.isLoadingMore) return;

        this.isLoadingMore = true;
        CONFIG.log('Loading more messages...');

        // Get oldest message timestamp
        const oldestMessage = this.messages[0];
        if (!oldestMessage) {
            this.isLoadingMore = false;
            return;
        }

        // Save scroll position
        const messagesScroll = document.getElementById('messagesScroll');
        const previousScrollHeight = messagesScroll?.scrollHeight || 0;

        try {
            await this.loadMessages(this.currentRoomId, oldestMessage.createdAt);

            // Restore scroll position (stay at same message)
            if (messagesScroll) {
                const newScrollHeight = messagesScroll.scrollHeight;
                messagesScroll.scrollTop = newScrollHeight - previousScrollHeight;
            }

        } catch (error) {
            CONFIG.error('Error loading more messages:', error);
        } finally {
            this.isLoadingMore = false;
        }
    },

    /**
     * Play notification sound (optional)
     */
    playNotificationSound() {
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.value = 0.1;

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silent fail
        }
    },

    /**
     * Clear messages
     */
    clear() {
        this.currentRoomId = null;
        this.messages = [];
        this.hasMore = true;

        const messagesList = document.getElementById('messagesList');
        if (messagesList) {
            messagesList.innerHTML = '';
        }
    }
};

// Make Messages available globally
window.Messages = Messages;
