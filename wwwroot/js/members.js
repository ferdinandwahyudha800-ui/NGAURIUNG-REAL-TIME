/**
 * Ngariung - Members Module
 * Handles members panel display and toggle
 */

const Members = {
    currentMembers: [],

    /**
     * Initialize members module
     */
    init() {
        this.setupToggleButton();
        this.setupCloseButton();
        this.setupMobileBack();
        CONFIG.log('Members module initialized');
    },

    /**
     * Setup members toggle button
     */
    setupToggleButton() {
        const toggleBtn = document.getElementById('membersToggle');
        const panel = document.getElementById('membersPanel');

        if (!toggleBtn || !panel) return;

        toggleBtn.addEventListener('click', () => {
            const isOpen = panel.classList.contains('open');

            if (isOpen) {
                this.closePanel();
            } else {
                this.openPanel();
            }
        });
    },

    /**
     * Setup close button
     */
    setupCloseButton() {
        const closeBtn = document.getElementById('closeMembersBtn');

        if (!closeBtn) return;

        closeBtn.addEventListener('click', () => {
            this.closePanel();
        });
    },

    /**
     * Setup mobile back button
     */
    setupMobileBack() {
        const backBtn = document.getElementById('backBtn');

        if (!backBtn) return;

        backBtn.addEventListener('click', () => {
            // On mobile, go back to sidebar
            Rooms.toggleMobileView(false);
        });
    },

    /**
     * Open members panel
     */
    openPanel() {
        const panel = document.getElementById('membersPanel');
        const toggleBtn = document.getElementById('membersToggle');

        if (!panel) return;

        panel.classList.add('open');

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'true');
        }

        CONFIG.log('Members panel opened');
    },

    /**
     * Close members panel
     */
    closePanel() {
        const panel = document.getElementById('membersPanel');
        const toggleBtn = document.getElementById('membersToggle');

        if (!panel) return;

        panel.classList.remove('open');

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
        }

        CONFIG.log('Members panel closed');
    },

    /**
     * Display members list
     */
    displayMembers(members) {
        const listContainer = document.getElementById('membersList');
        if (!listContainer) return;

        this.currentMembers = members;

        if (!members || members.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Belum ada anggota</p>
                </div>
            `;
            return;
        }

        // Sort: Owner first, then by status (Online first), then by name
        const sortedMembers = [...members].sort((a, b) => {
            // Owner first
            if (a.role === 'Owner' && b.role !== 'Owner') return -1;
            if (a.role !== 'Owner' && b.role === 'Owner') return 1;

            // Then by status
            const statusOrder = { 'Online': 0, 'Busy': 1, 'Away': 2, 'Offline': 3 };
            const statusDiff = (statusOrder[a.status] || 3) - (statusOrder[b.status] || 3);
            if (statusDiff !== 0) return statusDiff;

            // Then by name
            return a.displayName.localeCompare(b.displayName);
        });

        const membersHtml = sortedMembers.map(member => {
            const initials = Utils.getInitials(member.displayName);
            const avatarColor = Utils.stringToColor(member.displayName);

            const statusIcons = {
                'Online': '🟢',
                'Busy': '🔴',
                'Away': '🟡',
                'Offline': '⚪'
            };
            const statusIcon = statusIcons[member.status] || '⚪';

            const roleLabel = member.role === 'Owner' ? '<span class="member-role-badge">Owner</span>' : '';

            return `
                <div class="member-item" data-user-id="${member.userId}" role="listitem">
                    <div class="member-avatar" style="background-color: ${avatarColor}">
                        ${initials}
                    </div>
                    <div class="member-info">
                        <div class="member-name">
                            ${Utils.escapeHtml(member.displayName)}
                            ${roleLabel}
                        </div>
                        <div class="member-status">
                            ${statusIcon} ${member.status}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        listContainer.innerHTML = membersHtml;

        CONFIG.log('Members displayed:', members.length);
    },

    /**
     * Update member status
     */
    updateMemberStatus(userId, status) {
        const member = this.currentMembers.find(m => m.userId === userId);
        if (member) {
            member.status = status;
            this.displayMembers(this.currentMembers);
        }
    },

    /**
     * Add member to list
     */
    addMember(member) {
        if (!this.currentMembers.find(m => m.userId === member.userId)) {
            this.currentMembers.push(member);
            this.displayMembers(this.currentMembers);
        }
    },

    /**
     * Remove member from list
     */
    removeMember(userId) {
        this.currentMembers = this.currentMembers.filter(m => m.userId !== userId);
        this.displayMembers(this.currentMembers);
    },

    /**
     * Clear members list
     */
    clear() {
        this.currentMembers = [];
        const listContainer = document.getElementById('membersList');
        if (listContainer) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <p>Pilih ruang untuk melihat anggota</p>
                </div>
            `;
        }
    }
};

// Make Members available globally
window.Members = Members;
