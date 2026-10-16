/**
 * Ngariung - Modals Module
 * Handles opening, closing, and managing modal dialogs
 */

const Modals = {
    openModals: new Set(),

    /**
     * Initialize modal system
     */
    init() {
        this.setupCloseHandlers();
        this.setupEscapeKey();
        CONFIG.log('Modals initialized');
    },

    /**
     * Open a modal
     */
    open(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) {
            CONFIG.error('Modal not found:', modalId);
            return;
        }

        // Show modal
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');

        // Add to open modals set
        this.openModals.add(modalId);

        // Prevent body scroll
        if (this.openModals.size === 1) {
            document.body.style.overflow = 'hidden';
        }

        // Focus first input or close button
        requestAnimationFrame(() => {
            const firstInput = modal.querySelector('input, textarea, select, button');
            if (firstInput) {
                firstInput.focus();
            }
        });

        CONFIG.log('Modal opened:', modalId);
    },

    /**
     * Close a modal
     */
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Hide modal
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        // Remove from open modals
        this.openModals.delete(modalId);

        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
            this.clearFormErrors(form);
        }

        // Restore body scroll if no modals open
        if (this.openModals.size === 0) {
            document.body.style.overflow = '';
        }

        CONFIG.log('Modal closed:', modalId);
    },

    /**
     * Setup close handlers for all modals
     */
    setupCloseHandlers() {
        // Close buttons and overlay clicks
        document.addEventListener('click', (e) => {
            if (e.target.hasAttribute('data-close-modal') ||
                e.target.classList.contains('modal-close')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.close(modal.id);
                }
            }
        });
    },

    /**
     * Setup ESC key to close modals
     */
    setupEscapeKey() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.openModals.size > 0) {
                // Close the last opened modal
                const lastModalId = Array.from(this.openModals).pop();
                this.close(lastModalId);
            }
        });
    },

    /**
     * Show form error message
     */
    showFormError(formId, fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        // Add error class to input
        const input = document.querySelector(`#${formId} [name="${fieldName}"]`);
        if (input) {
            input.classList.add('error');
            input.setAttribute('aria-invalid', 'true');
        }
    },

    /**
     * Clear form errors
     */
    clearFormErrors(form) {
        const errorElements = form.querySelectorAll('.form-error');
        errorElements.forEach(el => {
            el.textContent = '';
            el.style.display = 'none';
        });

        const errorInputs = form.querySelectorAll('.error');
        errorInputs.forEach(input => {
            input.classList.remove('error');
            input.removeAttribute('aria-invalid');
        });
    },

    /**
     * Set loading state on submit button
     */
    setSubmitLoading(buttonId, isLoading) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.setAttribute('data-original-text', button.textContent);
            button.textContent = 'Memproses...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        }
    }
};

// Make Modals available globally
window.Modals = Modals;

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Modals.init());
} else {
    Modals.init();
}
