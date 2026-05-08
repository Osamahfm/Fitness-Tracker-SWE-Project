/**
 * Fitness Tracker Frontend Application
 * Handles user authentication, activity logging, meal tracking, and dashboard updates
 */

class FitnessTracker {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = './api/';
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
                this.loadRoleBasedInterface();
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

    /**
     * Load role-based interface
     */
    async loadRoleBasedInterface() {
        if (!this.currentUser) return;

        const userRole = this.currentUser.role || 'customer';
        
        // Load role-based navigation
        await this.loadNavigation(userRole);
        
        // Show/hide sections based on role
        this.updateSectionsForRole(userRole);
        
        // Load role-specific data
        if (userRole === 'trainer') {
            this.loadTrainerData();
        } else if (userRole === 'admin') {
            this.loadAdminData();
        }
    }

    /**
     * Load navigation based on user role
     */
    async loadNavigation(role) {
        try {
            // For now, use predefined navigation (in a real app, this would come from API)
            const navigationItems = this.getNavigationForRole(role);
            const navMenu = document.getElementById('navigation-menu');
            
            navMenu.innerHTML = navigationItems.map(item => `
                <a href="${item.href}" class="nav-link text-gray-500 hover:text-gray-900 hover:bg-indigo-50 px-3 py-2 rounded-md text-sm font-medium">
                    <i class="${item.icon} mr-1"></i>${item.name}
                </a>
            `).join('');
            
            // Re-attach navigation event listeners
            navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => this.handleNavigation(e));
            });
            
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }

    /**
     * Get navigation items for role
     */
    getNavigationForRole(role) {
        const navigation = {
            customer: [
                {name: 'Dashboard', href: '#dashboard', icon: 'fas fa-home'},
                {name: 'Activities', href: '#activities', icon: 'fas fa-running'},
                {name: 'Meals', href: '#meals', icon: 'fas fa-utensils'},
                {name: 'Goals', href: '#goals', icon: 'fas fa-bullseye'},
                {name: 'Reports', href: '#reports', icon: 'fas fa-chart-line'}
            ],
            trainer: [
                {name: 'Dashboard', href: '#dashboard', icon: 'fas fa-home'},
                {name: 'My Clients', href: '#clients', icon: 'fas fa-users'},
                {name: 'Workout Plans', href: '#workout-plans', icon: 'fas fa-dumbbell'},
                {name: 'Client Progress', href: '#progress', icon: 'fas fa-chart-line'},
                {name: 'Activities', href: '#activities', icon: 'fas fa-running'},
                {name: 'Meals', href: '#meals', icon: 'fas fa-utensils'},
                {name: 'Goals', href: '#goals', icon: 'fas fa-bullseye'}
            ],
            admin: [
                {name: 'Dashboard', href: '#dashboard', icon: 'fas fa-home'},
                {name: 'User Management', href: '#users', icon: 'fas fa-users-cog'},
                {name: 'Role Management', href: '#roles', icon: 'fas fa-user-shield'},
                {name: 'Trainer Assignments', href: '#assignments', icon: 'fas fa-user-check'},
                {name: 'System Reports', href: '#system-reports', icon: 'fas fa-chart-bar'},
                {name: 'Activities', href: '#activities', icon: 'fas fa-running'},
                {name: 'Meals', href: '#meals', icon: 'fas fa-utensils'},
                {name: 'Goals', href: '#goals', icon: 'fas fa-bullseye'}
            ]
        };

        return navigation[role] || navigation.customer;
    }

    /**
     * Update sections visibility based on role
     */
    updateSectionsForRole(role) {
        // Hide all role-specific sections
        document.getElementById('trainer-section').classList.add('hidden');
        document.getElementById('admin-section').classList.add('hidden');
        
        // Show relevant section
        if (role === 'trainer') {
            document.getElementById('trainer-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        } else if (role === 'admin') {
            document.getElementById('admin-section').classList.remove('hidden');
            document.getElementById('dashboard-section').classList.add('hidden');
        } else {
            // Customer - show regular dashboard
            document.getElementById('dashboard-section').classList.remove('hidden');
        }
    }

    /**
     * Load trainer-specific data
     */
    async loadTrainerData() {
        try {
            // Load trainer's clients
            const clientsResponse = await this.apiCall('trainers?endpoint=clients', 'GET');
            if (clientsResponse.success) {
                this.displayClients(clientsResponse.clients);
                document.getElementById('client-count').textContent = clientsResponse.total;
            }

            // Load available clients for assignment
            const availableResponse = await this.apiCall('trainers?endpoint=available-clients', 'GET');
            if (availableResponse.success) {
                this.displayAvailableClients(availableResponse.available_clients);
            }

        } catch (error) {
            console.error('Failed to load trainer data:', error);
        }
    }

    /**
     * Load admin-specific data
     */
    async loadAdminData() {
        try {
            // Load all users
            const usersResponse = await this.apiCall('users', 'GET');
            if (usersResponse.success) {
                this.displayUsers(usersResponse.users);
                document.getElementById('total-users').textContent = usersResponse.total;
            }
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    /**
     * Display clients list
     */
    displayClients(clients) {
        const clientsList = document.getElementById('clients-list');
        if (!clients || clients.length === 0) {
            clientsList.innerHTML = '<p class="text-gray-500">No clients assigned yet.</p>';
            return;
        }

        clientsList.innerHTML = clients.map(client => `
            <div class="border rounded-lg p-3 hover:bg-gray-50">
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold">${client.first_name} ${client.last_name}</h4>
                        <p class="text-sm text-gray-500">${client.email}</p>
                        <p class="text-xs text-gray-400">Assigned: ${new Date(client.assigned_at).toLocaleDateString()}</p>
                    </div>
                    <button onclick="viewClientProgress(${client.client_id})" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                        View Progress
                    </button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Display available clients for assignment
     */
    displayAvailableClients(clients) {
        const availableDiv = document.getElementById('available-clients');
        if (!clients || clients.length === 0) {
            availableDiv.innerHTML = '<p class="text-gray-500">No available clients.</p>';
            return;
        }

        availableDiv.innerHTML = clients.map(client => `
            <div class="flex justify-between items-center p-2 border rounded">
                <div>
                    <span class="font-medium">${client.first_name} ${client.last_name}</span>
                    <span class="text-sm text-gray-500 ml-2">${client.email}</span>
                </div>
                <button onclick="assignClient(${client.user_id})" class="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700">
                    Assign
                </button>
            </div>
        `).join('');
    }

    /**
     * Display users table (admin)
     */
    displayUsers(users) {
        const usersTable = document.getElementById('users-table');
        if (!users || users.length === 0) {
            usersTable.innerHTML = '<p class="text-gray-500">No users found.</p>';
            return;
        }

        usersTable.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${users.map(user => `
                            <tr>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div class="text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
                                        <div class="text-sm text-gray-500">${user.email}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${this.getRoleColor(user.role)}-100 text-${this.getRoleColor(user.role)}-800">
                                        ${user.role}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-${user.is_active ? 'green' : 'red'}-100 text-${user.is_active ? 'green' : 'red'}-800">
                                        ${user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    ${new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onclick="toggleUserStatus(${user.user_id}, ${!user.is_active})" class="text-${user.is_active ? 'red' : 'green'}-600 hover:text-${user.is_active ? 'red' : 'green'}-900 mr-2">
                                        ${user.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Get role color for styling
     */
    getRoleColor(role) {
        const colors = {
            customer: 'blue',
            trainer: 'green',
            admin: 'red'
        };
        return colors[role] || 'gray';
    }
}

// Global functions for HTML onclick handlers
function closeAuthModal() {
    window.fitnessTracker.closeAuthModal();
}

function hideNotification() {
    window.fitnessTracker.hideNotification();
}

// Trainer functions
function viewClientProgress(clientId) {
    window.fitnessTracker.viewClientProgress(clientId);
}

function assignClient(clientId) {
    window.fitnessTracker.assignClient(clientId);
}

// Admin functions
function loadUsers(role) {
    window.fitnessTracker.loadUsersByRole(role);
}

function loadSystemReport(type) {
    window.fitnessTracker.loadSystemReport(type);
}

function toggleUserStatus(userId, activate) {
    window.fitnessTracker.toggleUserStatus(userId, activate);
}

// Add these methods to the FitnessTracker class
FitnessTracker.prototype.viewClientProgress = async function(clientId) {
    try {
        const response = await this.apiCall(`trainers?endpoint=client-progress&client_id=${clientId}`, 'GET');
        if (response.success) {
            // Display client progress in a modal or dedicated section
            this.showNotification('Loading client progress...', 'info');
            console.log('Client progress:', response);
        }
    } catch (error) {
        this.showNotification('Failed to load client progress', 'error');
    }
};

FitnessTracker.prototype.assignClient = async function(clientId) {
    try {
        const response = await this.apiCall('trainers?action=assign-client', 'POST', { client_id: clientId });
        if (response.success) {
            this.showNotification('Client assigned successfully!', 'success');
            this.loadTrainerData(); // Refresh trainer data
        }
    } catch (error) {
        this.showNotification('Failed to assign client', 'error');
    }
};

FitnessTracker.prototype.loadUsersByRole = async function(role) {
    try {
        const response = await this.apiCall(`users?role=${role}`, 'GET');
        if (response.success) {
            this.displayUsers(response.users);
        }
    } catch (error) {
        this.showNotification('Failed to load users', 'error');
    }
};

FitnessTracker.prototype.loadSystemReport = async function(type) {
    try {
        this.showNotification(`Loading ${type} report...`, 'info');
        // This would load system reports
        console.log('Loading system report:', type);
    } catch (error) {
        this.showNotification('Failed to load report', 'error');
    }
};

FitnessTracker.prototype.toggleUserStatus = async function(userId, activate) {
    try {
        const action = activate ? 'activate' : 'deactivate';
        const response = await this.apiCall(`users?id=${userId}&action=${action}`, 'DELETE');
        if (response.success) {
            this.showNotification(`User ${action}d successfully!`, 'success');
            this.loadAdminData(); // Refresh admin data
        }
    } catch (error) {
        this.showNotification(`Failed to ${action} user`, 'error');
    }
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fitnessTracker = new FitnessTracker();
});
