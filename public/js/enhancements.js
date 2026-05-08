/**
 * Fitness Tracker Enhancements
 * Comprehensive improvements including error handling, loading states, form validation, and charts
 */

class FitnessTrackerEnhancements {
    constructor() {
        this.charts = {};
        this.validationRules = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            username: /^[a-zA-Z0-9_]{3,20}$/,
            height: { min: 100, max: 250 },
            weight: { min: 30, max: 300 },
            duration: { min: 1, max: 600 },
            calories: { min: 1, max: 5000 }
        };
        this.init();
    }

    init() {
        this.setupErrorHandling();
        this.setupLoadingStates();
        this.setupFormValidation();
        this.setupCharts();
        this.setupDarkMode();
        this.setupAutoRefresh();
    }

    /**
     * Enhanced Error Handling
     */
    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            this.showErrorModal('Unexpected Error', e.message);
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            this.showErrorModal('Network Error', 'Failed to connect to the server. Please check your internet connection.');
        });
    }

    showErrorModal(title, message, onRetry = null) {
        // Remove existing error modal
        const existingModal = document.getElementById('error-modal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'error-modal';
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3 text-center">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    </div>
                    <h3 class="text-lg leading-6 font-medium text-gray-900">${title}</h3>
                    <div class="mt-2 px-7 py-3">
                        <p class="text-sm text-gray-500">${message}</p>
                    </div>
                    <div class="items-center px-4 py-3 space-y-2">
                        ${onRetry ? `
                            <button id="retry-btn" class="w-full px-4 py-2 bg-indigo-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <i class="fas fa-redo mr-2"></i>Retry
                            </button>
                        ` : ''}
                        <button id="close-error-btn" class="w-full px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        if (onRetry) {
            document.getElementById('retry-btn').addEventListener('click', () => {
                modal.remove();
                onRetry();
            });
        }

        document.getElementById('close-error-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Loading States Management
     */
    setupLoadingStates() {
        // Add global loading spinner styles
        const style = document.createElement('style');
        style.textContent = `
            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
            }
            .loading-spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #4f46e5;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            .btn-loading {
                position: relative;
                color: transparent !important;
            }
            .btn-loading::after {
                content: '';
                position: absolute;
                width: 20px;
                height: 20px;
                top: 50%;
                left: 50%;
                margin-left: -10px;
                margin-top: -10px;
                border: 2px solid #ffffff;
                border-top: 2px solid transparent;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 4px;
            }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
    }

    showGlobalLoading(message = 'Loading...') {
        const overlay = document.createElement('div');
        overlay.id = 'global-loading';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-600 font-medium">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    }

    hideGlobalLoading() {
        const overlay = document.getElementById('global-loading');
        if (overlay) overlay.remove();
    }

    setButtonLoading(button, loading = true) {
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
        }
    }

    /**
     * Form Validation
     */
    setupFormValidation() {
        // Add validation to existing forms
        this.setupLoginFormValidation();
        this.setupRegisterFormValidation();
        this.setupActivityFormValidation();
        this.setupMealFormValidation();
    }

    setupLoginFormValidation() {
        const form = document.getElementById('login-form');
        if (!form) return;

        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        emailInput.addEventListener('blur', () => {
            this.validateField(emailInput, 'email', 'Please enter a valid email address');
        });

        passwordInput.addEventListener('blur', () => {
            if (passwordInput.value.length < 8) {
                this.showFieldError(passwordInput, 'Password must be at least 8 characters');
            } else {
                this.clearFieldError(passwordInput);
            }
        });

        form.addEventListener('submit', (e) => {
            const isEmailValid = this.validateField(emailInput, 'email', 'Please enter a valid email address');
            const isPasswordValid = passwordInput.value.length >= 8;
            
            if (!isEmailValid || !isPasswordValid) {
                e.preventDefault();
                this.showNotification('Please fix the errors before submitting', 'error');
            }
        });
    }

    setupRegisterFormValidation() {
        const form = document.getElementById('register-form');
        if (!form) return;

        const fields = [
            { id: 'first-name', name: 'First Name', required: true },
            { id: 'last-name', name: 'Last Name', required: true },
            { id: 'register-email', name: 'Email', type: 'email', required: true },
            { id: 'username', name: 'Username', type: 'username', required: true },
            { id: 'register-password', name: 'Password', type: 'password', required: true },
            { id: 'dob', name: 'Date of Birth', type: 'date', required: true },
            { id: 'height', name: 'Height', type: 'height', required: true },
            { id: 'weight', name: 'Weight', type: 'weight', required: true }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input) return;

            input.addEventListener('blur', () => {
                this.validateFieldByType(input, field.type, field.name);
            });
        });
    }

    setupActivityFormValidation() {
        const form = document.getElementById('activity-form');
        if (!form) return;

        const durationInput = document.getElementById('duration');
        const distanceInput = document.getElementById('distance');

        durationInput.addEventListener('blur', () => {
            const value = parseInt(durationInput.value);
            if (value < 1 || value > 600) {
                this.showFieldError(durationInput, 'Duration must be between 1 and 600 minutes');
            } else {
                this.clearFieldError(durationInput);
            }
        });

        distanceInput.addEventListener('blur', () => {
            const value = parseFloat(distanceInput.value);
            if (value && (value < 0 || value > 100)) {
                this.showFieldError(distanceInput, 'Distance must be between 0 and 100 km');
            } else {
                this.clearFieldError(distanceInput);
            }
        });
    }

    setupMealFormValidation() {
        const form = document.getElementById('meal-form');
        if (!form) return;

        const caloriesInput = document.getElementById('meal-calories');
        const proteinInput = document.getElementById('protein');
        const carbsInput = document.getElementById('carbs');
        const fatInput = document.getElementById('fat');

        [caloriesInput, proteinInput, carbsInput, fatInput].forEach(input => {
            if (!input) return;
            
            input.addEventListener('blur', () => {
                const value = parseFloat(input.value);
                if (value && value < 0) {
                    this.showFieldError(input, 'Value cannot be negative');
                } else {
                    this.clearFieldError(input);
                }
            });
        });
    }

    validateField(input, type, errorMessage) {
        const value = input.value.trim();
        let isValid = true;

        if (type === 'email') {
            isValid = this.validationRules.email.test(value);
        } else if (type === 'username') {
            isValid = this.validationRules.username.test(value);
        } else if (type === 'password') {
            isValid = value.length >= 8;
        }

        if (!isValid) {
            this.showFieldError(input, errorMessage);
        } else {
            this.clearFieldError(input);
        }

        return isValid;
    }

    validateFieldByType(input, type, fieldName) {
        const value = input.value.trim();
        
        if (!value) {
            this.showFieldError(input, `${fieldName} is required`);
            return false;
        }

        if (type === 'email' && !this.validationRules.email.test(value)) {
            this.showFieldError(input, `Please enter a valid ${fieldName.toLowerCase()}`);
            return false;
        }

        if (type === 'username' && !this.validationRules.username.test(value)) {
            this.showFieldError(input, `${fieldName} must be 3-20 alphanumeric characters`);
            return false;
        }

        if (type === 'password' && !this.validationRules.password.test(value)) {
            this.showFieldError(input, `${fieldName} must be at least 8 characters with uppercase, lowercase, number, and special character`);
            return false;
        }

        if (type === 'height') {
            const num = parseFloat(value);
            if (num < this.validationRules.height.min || num > this.validationRules.height.max) {
                this.showFieldError(input, `${fieldName} must be between ${this.validationRules.height.min} and ${this.validationRules.height.max} cm`);
                return false;
            }
        }

        if (type === 'weight') {
            const num = parseFloat(value);
            if (num < this.validationRules.weight.min || num > this.validationRules.weight.max) {
                this.showFieldError(input, `${fieldName} must be between ${this.validationRules.weight.min} and ${this.validationRules.weight.max} kg`);
                return false;
            }
        }

        this.clearFieldError(input);
        return true;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.remove('border-gray-300', 'focus:ring-indigo-500', 'focus:border-indigo-500');

        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error text-red-500 text-sm mt-1';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle mr-1"></i>${message}`;
        
        input.parentNode.appendChild(errorDiv);
    }

    clearFieldError(input) {
        input.classList.remove('border-red-500', 'focus:ring-red-500', 'focus:border-red-500');
        input.classList.add('border-gray-300', 'focus:ring-indigo-500', 'focus:border-indigo-500');

        const errorDiv = input.parentNode.querySelector('.field-error');
        if (errorDiv) errorDiv.remove();
    }

    /**
     * Charts Setup
     */
    setupCharts() {
        // Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => {
            this.chartsReady = true;
            this.initializeCharts();
        };
        document.head.appendChild(script);
    }

    initializeCharts() {
        // This will be called when Chart.js is loaded
        console.log('Chart.js loaded and ready');
    }

    createProgressChart(canvasId, data, labels, title) {
        if (!this.chartsReady || !window.Chart) {
            console.warn('Chart.js not loaded yet');
            return null;
        }

        const ctx = document.getElementById(canvasId).getContext('2d');
        
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    data: data,
                    borderColor: '#4f46e5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createCalorieChart(canvasId, consumed, burned, labels) {
        if (!this.chartsReady || !window.Chart) return null;

        const ctx = document.getElementById(canvasId).getContext('2d');
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Calories Consumed',
                        data: consumed,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: '#10b981',
                        borderWidth: 1
                    },
                    {
                        label: 'Calories Burned',
                        data: burned,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: '#ef4444',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Dark Mode
     */
    setupDarkMode() {
        // Check for saved preference
        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            this.enableDarkMode();
        }

        // Add dark mode toggle button to header
        this.addDarkModeToggle();
    }

    addDarkModeToggle() {
        const header = document.querySelector('nav .flex.items-center');
        if (!header) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'dark-mode-toggle';
        toggleBtn.className = 'ml-4 p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors';
        toggleBtn.innerHTML = '<i class="fas fa-moon text-gray-700"></i>';
        toggleBtn.title = 'Toggle Dark Mode';

        toggleBtn.addEventListener('click', () => {
            this.toggleDarkMode();
        });

        header.appendChild(toggleBtn);
    }

    toggleDarkMode() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            this.disableDarkMode();
        } else {
            this.enableDarkMode();
        }
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'true');
        
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-sun text-yellow-500"></i>';
        }

        // Apply dark mode styles
        this.applyDarkModeStyles();
    }

    disableDarkMode() {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'false');
        
        const toggleBtn = document.getElementById('dark-mode-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-moon text-gray-700"></i>';
        }
    }

    applyDarkModeStyles() {
        const style = document.createElement('style');
        style.id = 'dark-mode-styles';
        style.textContent = `
            .dark body {
                background-color: #1a202c;
                color: #e2e8f0;
            }
            .dark .bg-white {
                background-color: #2d3748 !important;
                color: #e2e8f0 !important;
            }
            .dark .text-gray-900 {
                color: #e2e8f0 !important;
            }
            .dark .text-gray-700 {
                color: #a0aec0 !important;
            }
            .dark .text-gray-600 {
                color: #718096 !important;
            }
            .dark .text-gray-500 {
                color: #a0aec0 !important;
            }
            .dark nav.bg-white {
                background-color: #2d3748 !important;
                border-bottom-color: #4a5568;
            }
            .dark .shadow-md, .dark .shadow-lg {
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            }
        `;
        
        // Remove existing dark mode styles if any
        const existing = document.getElementById('dark-mode-styles');
        if (existing) existing.remove();
        
        document.head.appendChild(style);
    }

    /**
     * Auto-refresh Dashboard
     */
    setupAutoRefresh() {
        // Auto-refresh dashboard data every 30 seconds
        setInterval(() => {
            if (window.fitnessTracker && window.fitnessTracker.currentUser) {
                window.fitnessTracker.loadDashboardData();
            }
        }, 30000);

        // Refresh data when user comes back to the page
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && window.fitnessTracker && window.fitnessTracker.currentUser) {
                window.fitnessTracker.loadDashboardData();
            }
        });
    }

    /**
     * Enhanced Notification System
     */
    showNotification(message, type = 'success', duration = 3000) {
        // Remove existing notifications
        const existing = document.querySelectorAll('.enhanced-notification');
        existing.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `enhanced-notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-gray-900',
            info: 'bg-blue-500 text-white'
        };

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        notification.className += ` ${colors[type] || colors.success}`;
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${icons[type] || icons.success}"></i>
                <span class="font-medium">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 hover:opacity-75">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto-remove
        if (duration > 0) {
            setTimeout(() => {
                notification.classList.add('translate-x-full');
                setTimeout(() => notification.remove(), 300);
            }, duration);
        }
    }
}

// Initialize enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessTrackerEnhancements = new FitnessTrackerEnhancements();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FitnessTrackerEnhancements;
}
