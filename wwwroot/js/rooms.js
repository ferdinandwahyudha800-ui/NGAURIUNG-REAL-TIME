/**
 * Ngariung - Rooms Module
 * Handles room list display and room selection
 */

const Rooms = {
    currentRoomId: null,
    rooms: [],

    /**
     * Initialize rooms module
     */
    init() {
        this.setupCreateRoomButton();
        this.setupDMButton();
        this.loadRooms();
        CONFIG.log('Rooms module initialized');
    },

    /**
     * Load user rooms from API
     */
    async loadRooms() {
        const listContainer = document.getElementById('roomsList');
        if (!listContainer) return;

        // Show loading
        listContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Memuat ruang...</p>
            </div>
        `;

        try {
            const rooms = await Utils.apiFetch(CONFIG.API.ROOMS.LIST);
            this.rooms = rooms;
            this.renderRooms(rooms);

            // Auto-select last room or first room
            if (rooms.length > 0) {
                const lastRoomId = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_ROOM);
                const roomToSelect = lastRoomId ?
                    rooms.find(r => r.id === lastRoomId) :
                    rooms[0];

                if (roomToSelect) {
                    this.selectRoom(roomToSelect.id);
                }
            }
        } catch (error) {
            CONFIG.error('Error loading rooms:', error);
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat ruang</p>
                    <button class="btn btn-secondary btn-sm" onclick="Rooms.loadRooms()">Coba Lagi</button>
                </div>
            `;
            Toast.error('Gagal memuat daftar ruang');
        }
    },

    /**
     * Render rooms list
     */
    renderRooms(rooms) {
        const listContainer = document.getElementById('roomsList');
        if (!listContainer) return;

        if (rooms.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada ruang</p>
                    <p class="text-muted">Buat ruang baru untuk mulai ngobrol</p>
                </div>
            `;
            return;
        }

        // Sort by last message time
        const sortedRooms = [...rooms].sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt) : new Date(0);
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt) : new Date(0);
            return timeB - timeA;
        });

        const roomsHtml = sortedRooms.map(room => {
            const unreadBadge = room.unreadCount > 0 ?
                `<span class="unread-badge">${room.unreadCount}</span>` : '';

            const roomIcon = room.type === 'Direct' ? '💬' : '🏠';

            const lastMessageTime = room.lastMessageAt ?
                Utils.formatTime(room.lastMessageAt) : '';

            return `
                <div class="room-item" data-room-id="${room.id}" role="listitem">
                    <div class="room-icon">${roomIcon}</div>
                    <div class="room-details">
                        <div class="room-name-row">
                            <span class="room-name">${Utils.escapeHtml(room.name)}</span>
                            ${unreadBadge}
                        </div>
                        <div class="room-meta">
                            <span class="room-members">${room.memberCount} anggota</span>
                            ${lastMessageTime ? `<span class="room-time">${lastMessageTime}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = roomsHtml;

        // Setup click handlers
        listContainer.querySelectorAll('.room-item').forEach(item => {
            item.addEventListener('click', () => {
                const roomId = item.getAttribute('data-room-id');
                this.selectRoom(roomId);
            });
        });
    },

    /**
     * Select and open a room
     */
    async selectRoom(roomId) {
        if (this.currentRoomId === roomId) return;

        CONFIG.log('Selecting room:', roomId);
        this.currentRoomId = roomId;

        // Update UI selection
        document.querySelectorAll('.room-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-room-id') === roomId);
        });

        // Save last room
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_ROOM, roomId);

        // Hide welcome state
        const welcomeState = document.getElementById('welcomeState');
        if (welcomeState) {
            welcomeState.style.display = 'none';
        }

        // Load room details
        try {
            const room = await Utils.apiFetch(CONFIG.API.ROOMS.GET(roomId));

            // Update header
            const roomName = document.getElementById('roomName');
            const roomMembers = document.getElementById('roomMembers');

            if (roomName) {
                roomName.textContent = room.name;
            }

            if (roomMembers) {
                roomMembers.textContent = `${room.members.length} anggota`;
            }

            // Join SignalR room
            await SignalRConnection.joinRoom(roomId);

            // Load messages
            await Messages.loadMessages(roomId);

            // Load members
            Members.displayMembers(room.members);

            // Clear unread badge
            this.clearUnreadBadge(roomId);

            // Mobile: show chat area, hide sidebar
            this.toggleMobileView(true);

        } catch (error) {
            CONFIG.error('Error selecting room:', error);
            Toast.error('Gagal membuka ruang');
        }
    },

    /**
     * Clear unread badge for room
     */
    clearUnreadBadge(roomId) {
        const roomItem = document.querySelector(`.room-item[data-room-id="${roomId}"]`);
        if (!roomItem) return;

        const badge = roomItem.querySelector('.unread-badge');
        if (badge) {
            badge.remove();
        }

        // Update room data
        const room = this.rooms.find(r => r.id === roomId);
        if (room) {
            room.unreadCount = 0;
        }
    },

    /**
     * Toggle mobile view (show chat, hide sidebar)
     */
    toggleMobileView(showChat) {
        const sidebar = document.getElementById('sidebar');
        const appContainer = document.getElementById('appContainer');

        if (window.innerWidth < 768) {
            if (showChat) {
                appContainer?.classList.add('chat-active');
            } else {
                appContainer?.classList.remove('chat-active');
            }
        }
    },

    /**
     * Setup create room button
     */
    setupCreateRoomButton() {
        const createBtn = document.getElementById('createRoomBtn');
        if (!createBtn) return;

        createBtn.addEventListener('click', () => {
            Modals.open('createRoomModal');
        });

        // Setup create room form
        const form = document.getElementById('createRoomForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateRoom(e));
        }
    },

    /**
     * Handle create room form submission
     */
    async handleCreateRoom(e) {
        e.preventDefault();

        const form = e.target;
        const name = form.name.value.trim();
        const description = form.description.value.trim();
        const type = form.querySelector('input[name="type"]:checked').value;

        // Validate
        Modals.clearFormErrors(form);

        if (!Utils.isValidRoomName(name)) {
            Modals.showFormError('createRoomForm', 'roomName',
                `Nama ruang harus ${CONFIG.SETTINGS.MIN_ROOM_NAME_LENGTH}-${CONFIG.SETTINGS.MAX_ROOM_NAME_LENGTH} karakter, huruf, angka, dash, atau underscore`);
            return;
        }

        // Set loading
        Modals.setSubmitLoading('createRoomSubmit', true);

        try {
            const newRoom = await Utils.apiFetch(CONFIG.API.ROOMS.CREATE, {
                method: 'POST',
                body: JSON.stringify({ name, description, type })
            });

            Toast.success(`Ruang "${newRoom.name}" berhasil dibuat`);

            // Close modal
            Modals.close('createRoomModal');

            // Reload rooms
            await this.loadRooms();

            // Select new room
            this.selectRoom(newRoom.id);

        } catch (error) {
            CONFIG.error('Error creating room:', error);

            let errorMessage = 'Gagal membuat ruang';
            if (error.status === 400 && error.data) {
                errorMessage = Utils.formatApiError(error.data);
            } else if (error.status === 429) {
                errorMessage = 'Terlalu banyak ruang dibuat. Tunggu sebentar.';
            }

            Modals.showFormError('createRoomForm', 'roomName', errorMessage);
            Toast.error(errorMessage);
        } finally {
            Modals.setSubmitLoading('createRoomSubmit', false);
        }
    },

    /**
     * Setup DM button
     */
    setupDMButton() {
        const dmBtn = document.getElementById('startDmBtn');
        if (!dmBtn) return;

        dmBtn.addEventListener('click', async () => {
            Modals.open('usersModal');
            await this.loadUsers();
        });

        // Setup user search
        const searchInput = document.getElementById('userSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.filterUsers(e.target.value);
            }, 300));
        }
    },

    /**
     * Load users for DM
     */
    async loadUsers() {
        const listContainer = document.getElementById('usersList');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Memuat pengguna...</p>
            </div>
        `;

        try {
            const users = await Utils.apiFetch(CONFIG.API.USERS.LIST);
            this.renderUsers(users);
        } catch (error) {
            CONFIG.error('Error loading users:', error);
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Gagal memuat pengguna</p>
                </div>
            `;
        }
    },

    /**
     * Render users list
     */
    renderUsers(users) {
        const listContainer = document.getElementById('usersList');
        if (!listContainer) return;

        const currentUserId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);

        // Filter out current user
        const otherUsers = users.filter(u => u.userId !== currentUserId);

        if (otherUsers.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada pengguna lain</p>
                </div>
            `;
            return;
        }

        const usersHtml = otherUsers.map(user => {
            const initials = Utils.getInitials(user.displayName);
            const avatarColor = Utils.stringToColor(user.displayName);
            const statusIcon = user.status === 'Online' ? '🟢' : '⚪';

            return `
                <div class="user-item" data-user-id="${user.userId}" data-user-name="${Utils.escapeHtml(user.displayName)}" role="listitem">
                    <div class="user-avatar" style="background-color: ${avatarColor}">
                        ${initials}
                    </div>
                    <div class="user-info">
                        <span class="user-name">${Utils.escapeHtml(user.displayName)}</span>
                        <span class="user-status">${statusIcon} ${user.status}</span>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = usersHtml;
        listContainer.setAttribute('data-all-users', JSON.stringify(otherUsers));

        // Setup click handlers
        listContainer.querySelectorAll('.user-item').forEach(item => {
            item.addEventListener('click', () => {
                const userId = item.getAttribute('data-user-id');
                this.startDirectMessage(userId);
            });
        });
    },

    /**
     * Filter users based on search
     */
    filterUsers(query) {
        const listContainer = document.getElementById('usersList');
        if (!listContainer) return;

        const allUsers = JSON.parse(listContainer.getAttribute('data-all-users') || '[]');
        const filtered = allUsers.filter(user =>
            user.displayName.toLowerCase().includes(query.toLowerCase())
        );

        this.renderUsers(filtered);
    },

    /**
     * Start direct message with user
     */
    async startDirectMessage(userId) {
        try {
            const response = await Utils.apiFetch(CONFIG.API.USERS.DM(userId), {
                method: 'POST'
            });

            Modals.close('usersModal');

            // Reload rooms to include new DM
            await this.loadRooms();

            // Select the DM room
            this.selectRoom(response.roomId);

        } catch (error) {
            CONFIG.error('Error starting DM:', error);
            Toast.error('Gagal memulai pesan pribadi');
        }
    }
};

// Make Rooms available globally
window.Rooms = Rooms;
