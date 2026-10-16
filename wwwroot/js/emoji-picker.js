/**
 * Ngariung - Emoji Picker Module
 * Handles emoji selection and insertion into message input
 */

const EmojiPicker = {
    // Subset of common emojis (bisa diperbanyak nanti)
    emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
        '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
        '😵', '🤯', '🤠', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮',
        '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢',
        '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤',
        '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
        '👆', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌',
        '💪', '🙏', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
        '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
        '🔥', '⭐', '🌟', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇'
    ],

    isOpen: false,
    targetInput: null,

    /**
     * Initialize emoji picker
     */
    init() {
        this.render();
        this.setupToggleButton();
        this.setupClickOutside();
        CONFIG.log('Emoji picker initialized');
    },

    /**
     * Render emoji picker
     */
    render() {
        const picker = document.getElementById('emojiPicker');
        if (!picker) return;

        const emojisHtml = this.emojis.map(emoji =>
            `<button class="emoji-item" type="button" data-emoji="${emoji}" aria-label="${emoji}">${emoji}</button>`
        ).join('');

        picker.innerHTML = `
            <div class="emoji-picker-header">
                <h3>Pilih Emoji</h3>
                <button class="emoji-picker-close" aria-label="Tutup">✕</button>
            </div>
            <div class="emoji-picker-body">
                ${emojisHtml}
            </div>
        `;

        // Setup emoji click handlers
        picker.querySelectorAll('.emoji-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const emoji = e.target.getAttribute('data-emoji');
                this.insertEmoji(emoji);
            });
        });

        // Setup close button
        const closeBtn = picker.querySelector('.emoji-picker-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    },

    /**
     * Setup toggle button
     */
    setupToggleButton() {
        const toggleBtn = document.getElementById('emojiBtn');
        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            if (this.isOpen) {
                this.close();
            } else {
                this.open(e.target);
            }
        });
    },

    /**
     * Open emoji picker
     */
    open(buttonElement) {
        const picker = document.getElementById('emojiPicker');
        const messageInput = document.getElementById('messageInput');

        if (!picker || !messageInput) return;

        this.targetInput = messageInput;
        this.isOpen = true;

        // Position picker above button
        const buttonRect = buttonElement.getBoundingClientRect();
        picker.style.display = 'block';
        picker.style.bottom = `${window.innerHeight - buttonRect.top + 10}px`;
        picker.style.left = `${buttonRect.left}px`;

        // Update button state
        buttonElement.setAttribute('aria-expanded', 'true');

        CONFIG.log('Emoji picker opened');
    },

    /**
     * Close emoji picker
     */
    close() {
        const picker = document.getElementById('emojiPicker');
        const toggleBtn = document.getElementById('emojiBtn');

        if (!picker) return;

        picker.style.display = 'none';
        this.isOpen = false;

        if (toggleBtn) {
            toggleBtn.setAttribute('aria-expanded', 'false');
        }

        CONFIG.log('Emoji picker closed');
    },

    /**
     * Insert emoji into target input
     */
    insertEmoji(emoji) {
        if (!this.targetInput) return;

        const cursorPos = this.targetInput.selectionStart;
        const textBefore = this.targetInput.value.substring(0, cursorPos);
        const textAfter = this.targetInput.value.substring(cursorPos);

        // Insert emoji at cursor position
        this.targetInput.value = textBefore + emoji + textAfter;

        // Move cursor after emoji
        const newCursorPos = cursorPos + emoji.length;
        this.targetInput.setSelectionRange(newCursorPos, newCursorPos);

        // Focus back to input
        this.targetInput.focus();

        // Trigger input event for character counter
        this.targetInput.dispatchEvent(new Event('input'));

        // Close picker
        this.close();

        CONFIG.log('Emoji inserted:', emoji);
    },

    /**
     * Setup click outside to close
     */
    setupClickOutside() {
        document.addEventListener('click', (e) => {
            const picker = document.getElementById('emojiPicker');
            const toggleBtn = document.getElementById('emojiBtn');

            if (this.isOpen &&
                picker &&
                !picker.contains(e.target) &&
                toggleBtn &&
                !toggleBtn.contains(e.target)) {
                this.close();
            }
        });
    }
};

// Make EmojiPicker available globally
window.EmojiPicker = EmojiPicker;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EmojiPicker.init());
} else {
    EmojiPicker.init();
}
