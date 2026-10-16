/**
 * Ngariung - Auth Page Module
 * Handles login and registration forms on auth.html
 */

const AuthPage = {
    /**
     * Initialize auth page
     */
    init() {
        // Redirect if already authenticated
        if (!Auth.skipIfAuthenticated()) {
            return;
        }

        this.setupTabs();
        this.setupPasswordToggles();
        this.setupForms();

        CONFIG.log('Auth page initialized');
    },

    /**
     * Setup tab switching between login and register
     */
    setupTabs() {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginPanel = document.getElementById('loginPanel');
        const registerPanel = document.getElementById('registerPanel');

        if (!loginTab || !registerTab || !loginPanel || !registerPanel) return;

        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginPanel.classList.add('active');
            registerPanel.classList.remove('active');

            loginTab.setAttribute('aria-selected', 'true');
            registerTab.setAttribute('aria-selected', 'false');
        });

        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerPanel.classList.add('active');
            loginPanel.classList.remove('active');

            registerTab.setAttribute('aria-selected', 'true');
            loginTab.setAttribute('aria-selected', 'false');
        });
    },

    /**
     * Setup password visibility toggles
     */
    setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');

        toggleButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                const input = document.getElementById(targetId);

                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                    button.textContent = '🙈';
                    button.setAttribute('aria-label', 'Sembunyikan password');
                } else {
                    input.type = 'password';
                    button.textContent = '👁️';
                    button.setAttribute('aria-label', 'Tampilkan password');
                }
            });
        });
    },

    /**
     * Setup form submissions
     */
    setupForms() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const email = form.email.value.trim();
        const password = form.password.value;

        // Clear previous errors
        this.clearFormErrors(form);

        // Validate
        if (!Utils.isValidEmail(email)) {
            this.showFormError(form, 'loginEmail', 'Format email tidak valid');
            return;
        }

        if (!Utils.isValidPassword(password)) {
            this.showFormError(form, 'loginPassword', 'Password minimal 6 karakter');
            return;
        }

        // Set loading state
        const submitBtn = document.getElementById('loginSubmit');
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await Utils.apiFetch(CONFIG.API.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            // Save session
            Auth.saveSession(response.token, response.userId, response.displayName);

            // Show success
            Toast.success('Login berhasil! Mengalihkan...');

            // Redirect to app
            setTimeout(() => {
                Auth.redirectToApp();
            }, 500);

        } catch (error) {
            CONFIG.error('Login error:', error);

            let errorMessage = 'Login gagal. Silakan coba lagi.';

            if (error.status === 401) {
                errorMessage = 'Email atau password salah';
            } else if (error.status === 429) {
                errorMessage = error.data?.error || 'Terlalu banyak percobaan. Silakan tunggu.';
            } else if (error.data) {
                errorMessage = Utils.formatApiError(error.data);
            }

            this.showFormError(form, 'loginForm', errorMessage);
            Toast.error(errorMessage);
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },

    /**
     * Handle register form submission
     */
    async handleRegister(e) {
        e.preventDefault();

        const form = e.target;
        const displayName = form.displayName.value.trim();
        const email = form.email.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        // Clear previous errors
        this.clearFormErrors(form);

        // Validate
        let hasError = false;

        if (!Utils.isValidDisplayName(displayName)) {
            this.showFormError(form, 'registerDisplayName', `Nama tampilan harus ${CONFIG.SETTINGS.MIN_DISPLAY_NAME_LENGTH}-${CONFIG.SETTINGS.MAX_DISPLAY_NAME_LENGTH} karakter`);
            hasError = true;
        }

        if (!Utils.isValidEmail(email)) {
            this.showFormError(form, 'registerEmail', 'Format email tidak valid');
            hasError = true;
        }

        if (!Utils.isValidPassword(password)) {
            this.showFormError(form, 'registerPassword', `Password minimal ${CONFIG.SETTINGS.MIN_PASSWORD_LENGTH} karakter`);
            hasError = true;
        }

        if (password !== confirmPassword) {
            this.showFormError(form, 'registerConfirmPassword', 'Password tidak cocok');
            hasError = true;
        }

        if (hasError) return;

        // Set loading state
        const submitBtn = document.getElementById('registerSubmit');
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await Utils.apiFetch(CONFIG.API.AUTH.REGISTER, {
                method: 'POST',
                body: JSON.stringify({ email, password, displayName })
            });

            // Save session
            Auth.saveSession(response.token, response.userId, response.displayName);

            // Show success
            Toast.success('Registrasi berhasil! Mengalihkan...');

            // Redirect to app
            setTimeout(() => {
                Auth.redirectToApp();
            }, 500);

        } catch (error) {
            CONFIG.error('Register error:', error);

            let errorMessage = 'Registrasi gagal. Silakan coba lagi.';

            if (error.status === 400 && error.data) {
                errorMessage = Utils.formatApiError(error.data);
            } else if (error.data) {
                errorMessage = Utils.formatApiError(error.data);
            }

            this.showFormError(form, 'registerForm', errorMessage);
            Toast.error(errorMessage);
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    },

    /**
     * Show form error
     */
    showFormError(form, fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}Error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        const input = form.querySelector(`[name="${fieldName.replace(/(login|register)/, '').replace('Form', '')}"]`);
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

        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.classList.remove('error');
            input.removeAttribute('aria-invalid');
        });
    },

    /**
     * Set button loading state
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.setAttribute('data-original-text', button.textContent);
            button.innerHTML = '<div class="spinner"></div> Memproses...';
        } else {
            button.disabled = false;
            const originalText = button.getAttribute('data-original-text');
            if (originalText) {
                button.textContent = originalText;
            }
        }
    }
};

// Initialize when DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AuthPage.init());
} else {
    AuthPage.init();
}
