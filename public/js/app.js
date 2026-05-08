/**
 * Fitness Tracker Frontend Application
 * Handles user authentication, activity logging, meal tracking, and dashboard updates
 */

class FitnessTracker {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = '../backend/api/';
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.checkAuthentication();
        this.updateCurrentDate();
        this.loadDashboardData();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Authentication forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('toggle-auth').addEventListener('click', () => this.toggleAuthMode());

        // Activity and meal forms
        document.getElementById('activity-form').addEventListener('submit', (e) => this.handleActivitySubmit(e));
        document.getElementById('meal-form').addEventListener('submit', (e) => this.handleMealSubmit(e));

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
    }

    /**
     * Check if user is authenticated
     */
    async checkAuthentication() {
        try {
            const response = await this.apiCall('auth/validate', 'GET');
            if (response.success) {
                this.currentUser = response.user;
                this.updateUIForAuthenticatedUser();
            } else {
                this.showAuthModal();
            }
        } catch (error) {
            this.showAuthModal();
        }
    }

    /**
     * Handle user login
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await this.apiCall('auth/login', 'POST', { email, password });
            
            if (response.success) {
                this.currentUser = response.user;
                this.closeAuthModal();
                this.updateUIForAuthenticatedUser();
                this.showNotification('Login successful!', 'success');
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Login failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle user registration
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const formData = {
            first_name: document.getElementById('first-name').value,
            last_name: document.getElementById('last-name').value,
            email: document.getElementById('register-email').value,
            username: document.getElementById('username').value,
            password: document.getElementById('register-password').value,
            date_of_birth: document.getElementById('dob').value,
            gender: document.getElementById('gender').value,
            height_cm: parseFloat(document.getElementById('height').value),
            weight_kg: parseFloat(document.getElementById('weight').value),
            activity_level: document.getElementById('activity-level').value
        };

        try {
            const response = await this.apiCall('auth/register', 'POST', formData);
            
            if (response.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.toggleAuthMode(); // Switch to login form
            }
        } catch (error) {
            this.showNotification('Registration failed: ' + error.message, 'error');
        }
    }

    /**
     * Handle activity submission
     */
    async handleActivitySubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showNotification('Please login first', 'error');
            return;
        }

        const activityData = {
            activity_type: document.getElementById('activity-type').value,
            activity_name: document.getElementById('activity-type').options[document.getElementById('activity-type').selectedIndex].text,
            duration_minutes: parseInt(document.getElementById('duration').value),
            distance_km: document.getElementById('distance').value ? parseFloat(document.getElementById('distance').value) : null,
            intensity_level: document.getElementById('intensity').value,
            activity_date: new Date().toISOString().split('T')[0]
        };

        try {
            const response = await this.apiCall('activities', 'POST', activityData);
            
            if (response.success) {
                this.showNotification('Activity logged successfully!', 'success');
                document.getElementById('activity-form').reset();
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to log activity: ' + error.message, 'error');
        }
    }

    /**
     * Handle meal submission
     */
    async handleMealSubmit(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showNotification('Please login first', 'error');
            return;
        }

        const mealData = {
            meal_type: document.getElementById('meal-type').value,
            meal_name: document.getElementById('meal-name').value,
            calories: parseInt(document.getElementById('meal-calories').value),
            protein_g: document.getElementById('protein').value ? parseFloat(document.getElementById('protein').value) : null,
            carbs_g: document.getElementById('carbs').value ? parseFloat(document.getElementById('carbs').value) : null,
            fat_g: document.getElementById('fat').value ? parseFloat(document.getElementById('fat').value) : null,
            meal_date: new Date().toISOString().split('T')[0]
        };

        try {
            const response = await this.apiCall('meals', 'POST', mealData);
            
            if (response.success) {
                this.showNotification('Meal logged successfully!', 'success');
                document.getElementById('meal-form').reset();
                this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification('Failed to log meal: ' + error.message, 'error');
        }
    }

    /**
     * Load dashboard data
     */
    async loadDashboardData() {
        if (!this.currentUser) return;

        try {
            // Load today's summary
            const summaryResponse = await this.apiCall('dashboard/today', 'GET');
            if (summaryResponse.success) {
                this.updateDashboardStats(summaryResponse.data);
            }

            // Load user goals
            const goalsResponse = await this.apiCall('goals/active', 'GET');
            if (goalsResponse.success) {
                this.updateGoalProgress(goalsResponse.data);
            }
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    /**
     * Update dashboard statistics
     */
    updateDashboardStats(data) {
        document.getElementById('calories-burned').textContent = data.total_calories_burned || 0;
        document.getElementById('activities-count').textContent = data.total_activities || 0;
        document.getElementById('calories-consumed').textContent = data.total_calories_consumed || 0;
        document.getElementById('total-duration').textContent = data.total_duration_minutes || 0;
        document.getElementById('total-distance').textContent = (data.total_distance_km || 0) + ' km';
        document.getElementById('completed-activities').textContent = data.total_activities || 0;
        document.getElementById('meals-logged').textContent = data.total_meals || 0;

        // Calculate net calories
        const netCalories = (data.total_calories_consumed || 0) - (data.total_calories_burned || 0);
        document.getElementById('net-calories').textContent = netCalories;

        // Update progress bars
        this.updateProgressBars(data);
    }

    /**
     * Update progress bars
     */
    updateProgressBars(data) {
        const calorieTarget = parseInt(document.getElementById('calorie-target').textContent);
        const caloriesBurned = data.total_calories_burned || 0;
        const caloriesConsumed = data.total_calories_consumed || 0;

        // Calories burned progress
        const caloriesBurnedProgress = Math.min((caloriesBurned / calorieTarget) * 100, 100);
        document.getElementById('calories-progress').style.width = caloriesBurnedProgress + '%';

        // Goal progress (simplified calculation)
        const goalProgress = caloriesBurned >= calorieTarget * 0.9 ? 100 : (caloriesBurned / calorieTarget) * 100;
        document.getElementById('goal-progress').textContent = Math.round(goalProgress) + '%';
        document.getElementById('goal-progress-bar').style.width = goalProgress + '%';

        // Update goal status
        const goalStatus = document.getElementById('goal-status');
        if (goalProgress >= 100) {
            goalStatus.textContent = 'Goal Achieved!';
            goalStatus.className = 'font-semibold text-green-600';
        } else if (goalProgress >= 50) {
            goalStatus.textContent = 'On Track';
            goalStatus.className = 'font-semibold text-yellow-600';
        } else {
            goalStatus.textContent = 'Behind Schedule';
            goalStatus.className = 'font-semibold text-red-600';
        }
    }

    /**
     * Update goal progress
     */
    updateGoalProgress(goal) {
        if (goal) {
            document.getElementById('calorie-target').textContent = goal.daily_calorie_target;
        }
    }

    /**
     * Update UI for authenticated user
     */
    updateUIForAuthenticatedUser() {
        if (this.currentUser) {
            document.getElementById('user-name').textContent = this.currentUser.first_name;
            // Hide login/register buttons, show user menu
            // This would be expanded in a real implementation
        }
    }

    /**
     * Toggle between login and register forms
     */
    toggleAuthMode() {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const authTitle = document.getElementById('auth-title');
        const toggleButton = document.getElementById('toggle-auth');

        if (loginForm.classList.contains('hidden')) {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            authTitle.textContent = 'Login';
            toggleButton.textContent = "Don't have an account? Register";
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            authTitle.textContent = 'Register';
            toggleButton.textContent = 'Already have an account? Login';
        }
    }

    /**
     * Show authentication modal
     */
    showAuthModal() {
        document.getElementById('auth-modal').classList.remove('hidden');
    }

    /**
     * Close authentication modal
     */
    closeAuthModal() {
        document.getElementById('auth-modal').classList.add('hidden');
    }

    /**
     * Update current date display
     */
    updateCurrentDate() {
        const currentDate = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', options);
    }

    /**
     * Handle navigation
     */
    handleNavigation(e) {
        e.preventDefault();
        
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('text-gray-900');
            link.classList.add('text-gray-500');
        });
        e.target.classList.remove('text-gray-500');
        e.target.classList.add('text-gray-900');

        // In a real implementation, this would load different sections
        const section = e.target.getAttribute('href').substring(1);
        console.log('Navigating to:', section);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageElement = document.getElementById('notification-message');

        messageElement.textContent = message;

        // Set icon and color based on type
        if (type === 'success') {
            icon.className = 'fas fa-check-circle text-green-400 text-xl';
        } else if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle text-red-400 text-xl';
        } else {
            icon.className = 'fas fa-info-circle text-blue-400 text-xl';
        }

        // Show notification
        notification.classList.remove('translate-x-full');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideNotification();
        }, 3000);
    }

    /**
     * Hide notification
     */
    hideNotification() {
        const notification = document.getElementById('notification');
        notification.classList.add('translate-x-full');
    }

    /**
     * Make API calls
     */
    async apiCall(endpoint, method = 'GET', data = null) {
        const url = this.apiBaseUrl + endpoint;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API call failed');
        }

        return await response.json();
    }
}

// Global functions for HTML onclick handlers
function closeAuthModal() {
    window.fitnessTracker.closeAuthModal();
}

function hideNotification() {
    window.fitnessTracker.hideNotification();
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessTracker = new FitnessTracker();
});
