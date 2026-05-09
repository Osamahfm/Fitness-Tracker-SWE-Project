// API Client for FitTrack Pro PHP Backend
import { mockRequest } from './mockApi';

const USE_MOCK = true; // Set to false when PHP backend is available

class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('fittrack_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('fittrack_token', token);
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('fittrack_token');
  }

  private async request(method: string, endpoint: string, body?: object): Promise<any> {
    // Use mock API for demo/deployment
    if (USE_MOCK) {
      return mockRequest(method, endpoint, body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error: any) {
      console.error(`API Error [${method} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  // Auth
  async register(userData: any) {
    return this.request('POST', '/auth/register', userData);
  }

  async login(credentials: { email: string; password: string }) {
    return this.request('POST', '/auth/login', credentials);
  }

  async getMe() {
    return this.request('GET', '/auth/me');
  }

  async updateProfile(data: any) {
    return this.request('PUT', '/auth/profile', data);
  }

  // Activities
  async getActivities(params?: { date?: string; start_date?: string; end_date?: string }) {
    let url = '/activities';
    if (params) {
      const qs = new URLSearchParams(params as Record<string, string>);
      url += `?${qs}`;
    }
    return this.request('GET', url);
  }

  async logActivity(data: any) {
    return this.request('POST', '/activities', data);
  }

  async getActivityTypes() {
    return this.request('GET', '/activities/types');
  }

  async getActivitySummary(params?: { date?: string; period?: string }) {
    let url = '/activities/summary';
    if (params) {
      const qs = new URLSearchParams(params as Record<string, string>);
      url += `?${qs}`;
    }
    return this.request('GET', url);
  }

  async deleteActivity(id: number) {
    return this.request('DELETE', `/activities/${id}`);
  }

  // Meals
  async getMeals(params?: { date?: string }) {
    let url = '/meals';
    if (params?.date) url += `?date=${params.date}`;
    return this.request('GET', url);
  }

  async logMeal(data: any) {
    return this.request('POST', '/meals', data);
  }

  async getMealRecommendations(type?: string) {
    let url = '/meals/recommendations';
    if (type) url += `?type=${type}`;
    return this.request('GET', url);
  }

  async getMealPlan(caloriesBurned: number, caloriesConsumed: number) {
    return this.request('GET', `/meals/meal-plan?calories_burned=${caloriesBurned}&calories_consumed=${caloriesConsumed}`);
  }

  async deleteMeal(id: number) {
    return this.request('DELETE', `/meals/${id}`);
  }

  // Goals
  async getGoals(status?: string) {
    let url = '/goals';
    if (status) url += `?status=${status}`;
    return this.request('GET', url);
  }

  async createGoal(data: any) {
    return this.request('POST', '/goals', data);
  }

  async updateGoalProgress(id: number, currentValue: number) {
    return this.request('PUT', `/goals/${id}/progress`, { current_value: currentValue });
  }

  async updateGoalStatus(id: number, status: string) {
    return this.request('PUT', `/goals/${id}/status`, { status });
  }

  async deleteGoal(id: number) {
    return this.request('DELETE', `/goals/${id}`);
  }

  async getGoalRecommendations() {
    return this.request('GET', '/goals/recommendations');
  }

  // Alarms
  async getAlarms() {
    return this.request('GET', '/alarms');
  }

  async createAlarm(data: any) {
    return this.request('POST', '/alarms', data);
  }

  async updateAlarm(id: number, data: any) {
    return this.request('PUT', `/alarms/${id}`, data);
  }

  async deleteAlarm(id: number) {
    return this.request('DELETE', `/alarms/${id}`);
  }

  async getTodayAlarms() {
    return this.request('GET', '/alarms/today');
  }

  // Dashboard
  async getDashboard(date?: string) {
    let url = '/dashboard';
    if (date) url += `?date=${date}`;
    return this.request('GET', url);
  }

  async getWeeklyOverview() {
    return this.request('GET', '/dashboard/weekly');
  }

  async getStats() {
    return this.request('GET', '/dashboard/stats');
  }
}

export const api = new ApiClient('');
