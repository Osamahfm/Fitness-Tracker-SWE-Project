/**
 * PulseFit — main application controller
 */
/* global Chart */

class FitnessTracker {
    constructor() {
        this.currentUser = null;
        this.apiBaseUrl = this.detectApiBase();
        this.charts = {};
        this.activeView = 'dashboard';
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.init();
    }

    detectApiBase() {
        const path = window.location.pathname || '';
        if (path.includes('/public/')) {
            return './api/';
        }
        return '/api/';
    }

    init() {
        this.bindLanding();
        this.bindSidebar();
        this.bindAuthModal();
        this.bindWellness();
        this.bindProfile();
        this.bindWorkoutsUi();
        this.bindWeightForm();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.setMotivationQuote();
        this.checkAuthentication();
    }

    setMotivationQuote() {
        const quotes = [
            'Consistency beats intensity when intensity isn\'t consistent.',
            'Small daily improvements are the key to staggering long-term results.',
            'Your body can stand almost anything — it\'s your mind you must convince.',
            'Train in silence, let results make the noise.',
        ];
        const el = document.getElementById('motivation-quote');
        if (el) el.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    }

    bindLanding() {
        const open = () => this.openAuthModal('login');
        ['landing-signin', 'landing-cta', 'hero-primary', 'landing-bottom-cta'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', open);
        });
    }

    bindSidebar() {
        document.querySelectorAll('.sidebar-link[data-nav]').forEach((btn) => {
            btn.addEventListener('click', () => this.navigateTo(btn.getAttribute('data-nav')));
        });
        const mob = document.getElementById('mobile-menu-btn');
        const side = document.getElementById('sidebar');
        const bd = document.getElementById('sidebar-backdrop');
        const close = () => {
            side?.classList.add('-translate-x-full');
            bd?.classList.add('hidden');
        };
        mob?.addEventListener('click', () => {
            side?.classList.remove('-translate-x-full');
            bd?.classList.remove('hidden');
        });
        bd?.addEventListener('click', close);
        document.getElementById('sidebar-logout')?.addEventListener('click', () => this.logout());
        document.getElementById('theme-toggle')?.addEventListener('click', () => {
            document.body.classList.toggle('theme-light');
            const on = document.body.classList.contains('theme-light');
            localStorage.setItem('pulsefit-theme', on ? 'light' : 'dark');
            this.showNotification(on ? 'Light theme on' : 'Dark theme on', 'info');
        });
        if (localStorage.getItem('pulsefit-theme') === 'light') {
            document.body.classList.add('theme-light');
        }
    }

    navigateTo(view) {
        this.activeView = view;
        document.querySelectorAll('.view-panel').forEach((p) => p.classList.add('hidden'));
        const map = {
            dashboard: 'view-dashboard',
            workouts: 'view-workouts',
            nutrition: 'view-nutrition',
            analytics: 'view-analytics',
            profile: 'view-profile',
        };
        const id = map[view];
        if (id) document.getElementById(id)?.classList.remove('hidden');

        document.querySelectorAll('.sidebar-link').forEach((l) => {
            const active = l.getAttribute('data-nav') === view;
            l.classList.toggle('ring-2', active);
            l.classList.toggle('ring-accent-cyan/40', active);
            l.classList.toggle('bg-white/5', active);
        });

        document.getElementById('sidebar')?.classList.add('-translate-x-full');
        document.getElementById('sidebar-backdrop')?.classList.add('hidden');

        if (view === 'workouts') this.loadWorkouts();
        if (view === 'analytics') this.loadAnalyticsView();
        if (view === 'nutrition') this.refreshNutritionView();
        if (view === 'profile') this.loadProfileForm();
    }

    bindAuthModal() {
        document.querySelectorAll('.auth-tab').forEach((tab) => {
            tab.addEventListener('click', () => {
                const name = tab.getAttribute('data-auth-tab');
                document.querySelectorAll('.auth-tab').forEach((t) => {
                    t.classList.remove('bg-accent-cyan/20', 'text-white');
                    t.classList.add('text-slate-400');
                });
                tab.classList.add('bg-accent-cyan/20', 'text-white');
                tab.classList.remove('text-slate-400');
                document.getElementById('auth-panel-login')?.classList.toggle('hidden', name !== 'login');
                document.getElementById('auth-panel-register')?.classList.toggle('hidden', name !== 'register');
                document.getElementById('auth-panel-forgot')?.classList.toggle('hidden', name !== 'forgot');
            });
        });
        document.getElementById('auth-modal-backdrop')?.addEventListener('click', (e) => {
            if (e.target?.id === 'auth-modal-backdrop') this.closeAuthModal();
        });

        document.getElementById('forgot-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email')?.value?.trim();
            if (!email) return;
            try {
                const res = await this.apiCall('auth/forgot-password', 'POST', { email });
                let msg = res.message || 'Request received.';
                if (res.demo_token) msg += ' Demo token: ' + res.demo_token;
                this.showNotification(msg, 'success');
            } catch (err) {
                this.showNotification(err.message || 'Request failed', 'error');
            }
        });

        document.getElementById('reset-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('reset-token')?.value?.trim();
            const new_password = document.getElementById('reset-new-pw')?.value;
            try {
                const res = await this.apiCall('auth/reset-password', 'POST', { token, new_password });
                if (res.success) {
                    this.showNotification(res.message || 'Password updated', 'success');
                } else {
                    this.showNotification(res.message || 'Reset failed', 'error');
                }
            } catch (err) {
                this.showNotification(err.message || 'Reset failed', 'error');
            }
        });
    }

    openAuthTab(tab) {
        document.querySelector(`[data-auth-tab="${tab}"]`)?.click();
    }

    openAuthModal(tab = 'login') {
        document.getElementById('auth-modal')?.classList.remove('hidden');
        this.openAuthTab(tab);
    }

    bindWellness() {
        document.getElementById('wellness-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!this.currentUser) return;
            const payload = {
                steps: parseInt(document.getElementById('wellness-steps')?.value || '0', 10),
                water_ml: parseInt(document.getElementById('wellness-water')?.value || '0', 10),
                sleep_hours: document.getElementById('wellness-sleep')?.value
                    ? parseFloat(document.getElementById('wellness-sleep').value) : null,
                resting_heart_rate: document.getElementById('wellness-hr')?.value
                    ? parseInt(document.getElementById('wellness-hr').value, 10) : null,
                log_date: new Date().toISOString().split('T')[0],
            };
            try {
                await this.apiCall('wellness/today', 'POST', payload);
                this.showNotification('Wellness updated', 'success');
                this.loadDashboardData();
            } catch (err) {
                if (err.message?.includes('fetch') || err.message?.includes('Failed')) {
                    this.showNotification('Wellness API unavailable — run schema_enhancements.sql', 'error');
                } else {
                    this.showNotification(err.message, 'error');
                }
            }
        });
    }

    bindProfile() {
        document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const body = {
                first_name: document.getElementById('pf-first').value,
                last_name: document.getElementById('pf-last').value,
                height_cm: parseFloat(document.getElementById('pf-height').value),
                weight_kg: parseFloat(document.getElementById('pf-weight').value),
                activity_level: document.getElementById('pf-activity').value,
            };
            try {
                await this.apiCall('profile', 'PUT', body);
                const cur = document.getElementById('pf-current-pw').value;
                const neu = document.getElementById('pf-new-pw').value;
                if (cur && neu) {
                    await this.apiCall('auth/change-password', 'POST', { current_password: cur, new_password: neu });
                }
                this.showNotification('Profile saved', 'success');
                await this.checkAuthentication();
            } catch (err) {
                this.showNotification(err.message || 'Save failed', 'error');
            }
        });
    }

    bindWeightForm() {
        document.getElementById('weight-log-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const w = parseFloat(e.target.weight.value);
            try {
                await this.apiCall('analytics/stats', 'POST', { weight_kg: w, recorded_date: new Date().toISOString().split('T')[0] });
                this.showNotification('Weight logged', 'success');
                this.loadAnalyticsView();
                this.loadDashboardData();
            } catch (err) {
                this.showNotification(err.message || 'Could not log weight', 'error');
            }
        });
    }

    bindWorkoutsUi() {
        const search = document.getElementById('workout-search');
        const cf = document.getElementById('workout-cat-filter');
        const df = document.getElementById('workout-diff-filter');
        const requery = () => this.loadWorkouts();
        [search, cf, df].forEach((el) => el?.addEventListener('input', requery));
        df?.addEventListener('change', requery);
        document.getElementById('workout-modal-close')?.addEventListener('click', () => {
            document.getElementById('workout-modal').classList.add('hidden');
            document.getElementById('workout-modal').classList.remove('flex');
            this.stopWorkoutTimer();
        });
        document.getElementById('wm-timer-start')?.addEventListener('click', () => this.startWorkoutTimer());
    }

    startWorkoutTimer() {
        if (this.timerInterval) {
            this.stopWorkoutTimer();
            return;
        }
        this.timerSeconds = 0;
        this.timerInterval = setInterval(() => {
            this.timerSeconds += 1;
            const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
            const s = String(this.timerSeconds % 60).padStart(2, '0');
            const el = document.getElementById('wm-timer-display');
            if (el) el.textContent = `${m}:${s}`;
        }, 1000);
        document.getElementById('wm-timer-start').textContent = 'Stop timer';
    }

    stopWorkoutTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const btn = document.getElementById('wm-timer-start');
        if (btn) btn.textContent = 'Start timer';
    }

    async loadWorkouts() {
        const grid = document.getElementById('workout-grid');
        const empty = document.getElementById('workout-empty');
        if (!grid) return;
        const q = new URLSearchParams();
        const s = document.getElementById('workout-search')?.value?.trim();
        const c = document.getElementById('workout-cat-filter')?.value;
        const d = document.getElementById('workout-diff-filter')?.value;
        if (s) q.set('search', s);
        if (c) q.set('category', c);
        if (d) q.set('difficulty', d);
        const qs = q.toString();
        try {
            const res = await this.apiCall(`workouts/catalog${qs ? `?${qs}` : ''}`, 'GET');
            const catSel = document.getElementById('workout-cat-filter');
            if (catSel && catSel.options.length <= 1 && res.categories?.length) {
                res.categories.forEach((cat) => {
                    const opt = document.createElement('option');
                    opt.value = cat;
                    opt.textContent = cat;
                    catSel.appendChild(opt);
                });
            }
            if (!res.workouts?.length) {
                grid.innerHTML = '';
                empty?.classList.remove('hidden');
                return;
            }
            empty?.classList.add('hidden');
            grid.innerHTML = res.workouts.map((w) => `
                <div class="glass rounded-2xl p-5 border border-white/10 card-hover cursor-pointer workout-card" data-id="${w.workout_id}">
                    <p class="text-xs uppercase text-accent-cyan mb-1">${this.escapeHtml(w.category)}</p>
                    <h3 class="font-bold text-lg">${this.escapeHtml(w.name)}</h3>
                    <p class="text-sm text-slate-400 mt-2 line-clamp-2">${this.escapeHtml(w.description || '')}</p>
                    <div class="flex flex-wrap gap-2 mt-4 text-xs">
                        <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10">${this.escapeHtml(w.difficulty)}</span>
                        <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10">${w.duration_minutes} min</span>
                        <span class="px-2 py-1 rounded-lg bg-white/5 border border-white/10">~${w.calories_estimate} kcal</span>
                    </div>
                </div>`).join('');
            grid.querySelectorAll('.workout-card').forEach((card) => {
                card.addEventListener('click', () => this.openWorkoutDetail(card.getAttribute('data-id')));
            });
        } catch (e) {
            grid.innerHTML = `<p class="text-slate-500 text-sm col-span-full">Could not load workouts. Import <code class="text-accent-cyan">schema_enhancements.sql</code>.</p>`;
        }
    }

    async openWorkoutDetail(id) {
        try {
            const res = await this.apiCall(`workouts/catalog/${id}`, 'GET');
            const w = res.workout;
            document.getElementById('wm-title').textContent = w.name;
            document.getElementById('wm-meta').textContent = `${w.category} · ${w.difficulty} · ${w.duration_minutes} min · ~${w.calories_estimate} kcal`;
            document.getElementById('wm-desc').textContent = w.description || '';
            const ul = document.getElementById('wm-exercises');
            ul.innerHTML = (w.exercises || []).map((ex) => {
                const bits = typeof ex === 'object' && ex
                    ? Object.entries(ex).map(([k, v]) => `${k}: ${v}`).join(' · ')
                    : String(ex);
                return `<li class="flex gap-2"><i class="fas fa-check text-accent-green mt-1"></i><span class="text-slate-300">${this.escapeHtml(bits)}</span></li>`;
            }).join('');
            document.getElementById('wm-timer-display').textContent = '00:00';
            this.stopWorkoutTimer();
            const modal = document.getElementById('workout-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } catch (e) {
            this.showNotification('Could not open workout', 'error');
        }
    }

    escapeHtml(s) {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    async loadAnalyticsView() {
        try {
            const res = await this.apiCall('analytics/stats', 'GET');
            const hist = res.data?.weight_history || [];
            const labels = hist.map((h) => h.date);
            const weights = hist.map((h) => h.weight_kg);
            const bmis = hist.map((h) => h.bmi).filter((x) => x != null);

            this.destroyChart('weight');
            const wctx = document.getElementById('weight-chart');
            if (wctx && window.Chart) {
                this.charts.weight = new Chart(wctx, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [{
                            label: 'Weight (kg)',
                            data: weights,
                            borderColor: '#22d3ee',
                            backgroundColor: 'rgba(34,211,238,0.1)',
                            fill: true,
                            tension: 0.35,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                        scales: {
                            x: { ticks: { color: '#64748b', maxRotation: 45 } },
                            y: { ticks: { color: '#64748b' }, beginAtZero: false },
                        },
                    },
                });
            }

            const insight = document.getElementById('analytics-insight');
            if (insight) {
                if (!hist.length) {
                    insight.textContent = 'Log weight from your profile or analytics to unlock the trend.';
                } else {
                    insight.textContent = `Tracking ${hist.length} entries — keep logging weekly for smoother trends.`;
                }
            }

            this.destroyChart('goalRing');
            const gctx = document.getElementById('goal-chart');
            if (gctx && window.Chart && this.lastDashboardData) {
                const burned = this.lastDashboardData.total_calories_burned || 0;
                const target = parseInt(document.getElementById('calorie-target')?.textContent || '2000', 10);
                const pct = Math.min(100, Math.round((burned / Math.max(target, 1)) * 100));
                this.charts.goalRing = new Chart(gctx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Progress', 'Remaining'],
                        datasets: [{
                            data: [pct, Math.max(0, 100 - pct)],
                            backgroundColor: ['#34d399', 'rgba(148,163,184,0.2)'],
                            borderWidth: 0,
                        }],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '65%',
                        plugins: {
                            legend: { labels: { color: '#94a3b8' } },
                        },
                    },
                });
            }
        } catch (e) {
            console.warn('analytics view', e);
        }
    }

    refreshNutritionView() {
        if (!this.lastDashboardData) return;
        const n = this.lastDashboardData.nutrition_breakdown || {};
        const p = Math.round(n.protein || 0);
        const c = Math.round(n.carbs || 0);
        const f = Math.round(n.fat || 0);
        const pe = document.getElementById('macro-p');
        const ce = document.getElementById('macro-c');
        const fe = document.getElementById('macro-f');
        if (pe) pe.textContent = `${p}g`;
        if (ce) ce.textContent = `${c}g`;
        if (fe) fe.textContent = `${f}g`;

        this.destroyChart('macro');
        const ctx = document.getElementById('macro-chart');
        if (ctx && window.Chart && (p + c + f) > 0) {
            this.charts.macro = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Protein', 'Carbs', 'Fat'],
                    datasets: [{
                        data: [p, c, f],
                        backgroundColor: ['#fb7185', '#fbbf24', '#22d3ee'],
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } },
                },
            });
        }

        const tips = document.getElementById('meal-tips');
        if (tips) {
            tips.innerHTML = [
                'Prioritize protein at breakfast to stabilize energy.',
                'Pair carbs with movement days; lighten carbs on rest days.',
                'Hydrate before meals — often thirst masks hunger cues.',
            ].map((t) => `<li class="flex gap-2"><i class="fas fa-leaf text-accent-green mt-1"></i>${t}</li>`).join('');
        }
    }

    destroyChart(name) {
        if (this.charts[name]) {
            this.charts[name].destroy();
            delete this.charts[name];
        }
    }

    async loadProfileForm() {
        try {
            const res = await this.apiCall('profile', 'GET');
            const u = res.user;
            if (!u) return;
            document.getElementById('pf-first').value = u.first_name || '';
            document.getElementById('pf-last').value = u.last_name || '';
            document.getElementById('pf-height').value = u.height_cm || '';
            document.getElementById('pf-weight').value = u.weight_kg || '';
            document.getElementById('pf-activity').value = u.activity_level || 'moderate';
        } catch (e) {
            console.warn(e);
        }
    }

    async logout() {
        try {
            await this.apiCall('auth/logout', 'POST', {});
        } catch (e) { /* ignore */ }
        this.currentUser = null;
        document.getElementById('app-view')?.classList.add('hidden');
        document.getElementById('landing-view')?.classList.remove('hidden');
        this.showNotification('Logged out', 'info');
    }

    setupEventListeners() {
        document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('activity-form')?.addEventListener('submit', (e) => this.handleActivitySubmit(e));
        document.getElementById('meal-form')?.addEventListener('submit', (e) => this.handleMealSubmit(e));
    }

    async checkAuthentication() {
        try {
            const response = await this.apiCall('auth/validate', 'GET');
            if (response.success) {
                this.currentUser = response.user;
                document.getElementById('landing-view')?.classList.add('hidden');
                document.getElementById('app-view')?.classList.remove('hidden');
                this.updateUIForAuthenticatedUser();
                await this.loadRoleBasedInterface();
                await this.loadDashboardData();
            } else {
                this.showGuest();
            }
        } catch {
            this.showGuest();
        }
    }

    showGuest() {
        document.getElementById('landing-view')?.classList.remove('hidden');
        document.getElementById('app-view')?.classList.add('hidden');
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await this.apiCall('auth/login', 'POST', { email, password });
            if (response.success) {
                this.currentUser = response.user;
                this.closeAuthModal();
                document.getElementById('landing-view')?.classList.add('hidden');
                document.getElementById('app-view')?.classList.remove('hidden');
                this.updateUIForAuthenticatedUser();
                this.showNotification('Welcome back!', 'success');
                await this.loadRoleBasedInterface();
                await this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification(error.message || 'Login failed', 'error');
        }
    }

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
            activity_level: document.getElementById('activity-level').value,
        };
        try {
            const response = await this.apiCall('auth/register', 'POST', formData);
            if (response.success) {
                this.showNotification('Registration successful — sign in.', 'success');
                this.openAuthTab('login');
            }
        } catch (error) {
            this.showNotification(error.message || 'Registration failed', 'error');
        }
    }

    async handleActivitySubmit(e) {
        e.preventDefault();
        if (!this.currentUser) {
            this.showNotification('Sign in first', 'error');
            return;
        }
        const activityData = {
            activity_type: document.getElementById('activity-type').value,
            activity_name: document.getElementById('activity-type').options[document.getElementById('activity-type').selectedIndex].text,
            duration_minutes: parseInt(document.getElementById('duration').value, 10),
            distance_km: document.getElementById('distance').value ? parseFloat(document.getElementById('distance').value) : null,
            intensity_level: document.getElementById('intensity').value,
            activity_date: new Date().toISOString().split('T')[0],
        };
        try {
            const response = await this.apiCall('activities', 'POST', activityData);
            if (response.success) {
                this.showNotification('Activity saved', 'success');
                document.getElementById('activity-form')?.reset();
                await this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification(error.message || 'Failed', 'error');
        }
    }

    async handleMealSubmit(e) {
        e.preventDefault();
        if (!this.currentUser) {
            this.showNotification('Sign in first', 'error');
            return;
        }
        const mealData = {
            meal_type: document.getElementById('meal-type').value,
            meal_name: document.getElementById('meal-name').value,
            calories: parseInt(document.getElementById('meal-calories').value, 10),
            protein_g: document.getElementById('protein').value ? parseFloat(document.getElementById('protein').value) : null,
            carbs_g: document.getElementById('carbs').value ? parseFloat(document.getElementById('carbs').value) : null,
            fat_g: document.getElementById('fat').value ? parseFloat(document.getElementById('fat').value) : null,
            meal_date: new Date().toISOString().split('T')[0],
        };
        try {
            const response = await this.apiCall('meals', 'POST', mealData);
            if (response.success) {
                this.showNotification('Meal saved', 'success');
                document.getElementById('meal-form')?.reset();
                await this.loadDashboardData();
            }
        } catch (error) {
            this.showNotification(error.message || 'Failed', 'error');
        }
    }

    async loadDashboardData() {
        if (!this.currentUser) return;
        try {
            const summaryResponse = await this.apiCall('dashboard/today', 'GET');
            if (summaryResponse.success) {
                this.lastDashboardData = summaryResponse.data;
                this.updateDashboardStats(summaryResponse.data);
            }
            const goalsResponse = await this.apiCall('goals/active', 'GET');
            if (goalsResponse.success) {
                this.updateGoalProgress(goalsResponse.goal);
            }
            await this.loadWellnessDisplay();
            await this.loadWeeklyCharts();
            this.renderAchievements();
            if (this.activeView === 'nutrition') this.refreshNutritionView();
        } catch (error) {
            console.error(error);
        }
    }

    async loadWellnessDisplay() {
        try {
            const res = await this.apiCall('wellness/today', 'GET');
            if (!res.success || !res.data) return;
            const d = res.data;
            const steps = parseInt(d.steps || 0, 10);
            document.getElementById('dash-steps').textContent = steps.toLocaleString();
            const sp = Math.min(100, (steps / 10000) * 100);
            const sb = document.getElementById('steps-progress');
            if (sb) sb.style.width = `${sp}%`;

            const water = parseInt(d.water_ml || 0, 10);
            document.getElementById('dash-water').textContent = water.toLocaleString();
            const wp = Math.min(100, (water / 2500) * 100);
            const wb = document.getElementById('water-progress');
            if (wb) wb.style.width = `${wp}%`;

            const sleep = d.sleep_hours != null ? parseFloat(d.sleep_hours) : null;
            document.getElementById('dash-sleep').textContent = sleep != null && !Number.isNaN(sleep) ? sleep.toFixed(1) : '—';

            const hr = d.resting_heart_rate;
            document.getElementById('dash-hr').textContent = hr != null ? hr : '—';

            document.getElementById('wellness-steps').value = steps || '';
            document.getElementById('wellness-water').value = water || '';
            if (sleep != null) document.getElementById('wellness-sleep').value = sleep;
            if (hr != null) document.getElementById('wellness-hr').value = hr;

            if (this.currentUser) {
                const h = parseFloat(this.currentUser.height_cm) / 100;
                const w = parseFloat(this.currentUser.weight_kg);
                if (h > 0 && w > 0) {
                    const bmi = w / (h * h);
                    const el = document.getElementById('dash-bmi');
                    if (el) el.textContent = bmi.toFixed(1);
                    const lab = document.getElementById('dash-bmi-label');
                    let lbl = 'Normal';
                    if (bmi < 18.5) lbl = 'Low';
                    else if (bmi >= 25) lbl = 'Above range';
                    if (lab) lab.textContent = lbl;
                }
            }
        } catch {
            /* wellness table may not exist */
        }
    }

    updateDashboardStats(data) {
        document.getElementById('calories-burned').textContent = data.total_calories_burned || 0;
        document.getElementById('activities-count').textContent = data.total_activities || 0;
        document.getElementById('calories-consumed').textContent = data.total_calories_consumed || 0;
        document.getElementById('total-duration').textContent = data.total_duration_minutes || 0;
        document.getElementById('total-distance').textContent = `${data.total_distance_km || 0} km`;

        const netCalories = (data.total_calories_consumed || 0) - (data.total_calories_burned || 0);
        const netEl = document.getElementById('net-calories');
        if (netEl) netEl.textContent = netCalories;

        this.updateProgressBars(data);
    }

    updateProgressBars(data) {
        const calorieTarget = parseInt(document.getElementById('calorie-target').textContent, 10) || 2000;
        const caloriesBurned = data.total_calories_burned || 0;
        const caloriesBurnedProgress = Math.min((caloriesBurned / calorieTarget) * 100, 100);
        const cp = document.getElementById('calories-progress');
        if (cp) cp.style.width = `${caloriesBurnedProgress}%`;

        const goalProgress = caloriesBurned >= calorieTarget * 0.9
            ? 100
            : Math.min((caloriesBurned / calorieTarget) * 100, 100);
        const gp = document.getElementById('goal-progress');
        if (gp) gp.textContent = `${Math.round(goalProgress)}%`;
        const gbar = document.getElementById('goal-progress-bar');
        if (gbar) gbar.style.width = `${goalProgress}%`;
    }

    updateGoalProgress(goal) {
        if (goal && goal.daily_calorie_target) {
            document.getElementById('calorie-target').textContent = goal.daily_calorie_target;
        }
    }

    updateUIForAuthenticatedUser() {
        if (this.currentUser) {
            const el = document.getElementById('user-name');
            if (el) el.textContent = this.currentUser.first_name || 'Athlete';
        }
    }

    closeAuthModal() {
        document.getElementById('auth-modal')?.classList.add('hidden');
    }

    updateCurrentDate() {
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const el = document.getElementById('current-date');
        if (el) el.textContent = new Date().toLocaleDateString('en-US', opts);
    }

    async loadWeeklyCharts() {
        try {
            const weekly = await this.apiCall('dashboard/weekly', 'GET');
            if (!weekly.success) return;
            const days = weekly.data.daily_data || [];
            const labels = days.map((d) => d.day_name);
            const burned = days.map((d) => d.calories_burned || 0);
            const consumed = days.map((d) => d.calories_consumed || 0);
            const activityMin = days.map((d) => d.duration || 0);

            this.destroyChart('weekly');
            const p1 = document.getElementById('progress-chart');
            if (p1 && window.Chart) {
                this.charts.weekly = new Chart(p1, {
                    type: 'line',
                    data: {
                        labels,
                        datasets: [
                            {
                                label: 'Active min',
                                data: activityMin,
                                borderColor: '#22d3ee',
                                backgroundColor: 'rgba(34,211,238,0.15)',
                                fill: true,
                                tension: 0.35,
                            },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                        scales: {
                            x: { ticks: { color: '#64748b' } },
                            y: { ticks: { color: '#64748b' }, beginAtZero: true },
                        },
                    },
                });
            }

            this.destroyChart('calorie');
            const p2 = document.getElementById('calorie-chart');
            if (p2 && window.Chart) {
                this.charts.calorie = new Chart(p2, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [
                            { label: 'Consumed', data: consumed, backgroundColor: 'rgba(52,211,153,0.7)' },
                            { label: 'Burned', data: burned, backgroundColor: 'rgba(248,113,113,0.7)' },
                        ],
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { labels: { color: '#94a3b8' } } },
                        scales: {
                            x: { ticks: { color: '#64748b' }, stacked: false },
                            y: { ticks: { color: '#64748b' }, beginAtZero: true },
                        },
                    },
                });
            }
        } catch (e) {
            console.warn('weekly charts', e);
        }
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        const empty = document.getElementById('achievements-empty');
        if (!container) return;
        const data = this.lastDashboardData || {};
        const badges = [];
        if ((data.total_activities || 0) >= 1) {
            badges.push({ icon: 'fa-person-running', title: 'First move', desc: 'Logged an activity', color: 'text-cyan-300' });
        }
        if ((data.total_calories_burned || 0) >= 500) {
            badges.push({ icon: 'fa-fire', title: 'Burn streak', desc: '500+ kcal out', color: 'text-orange-300' });
        }
        if ((data.total_meals || 0) >= 1) {
            badges.push({ icon: 'fa-utensils', title: 'Fuel log', desc: 'Tracked a meal', color: 'text-emerald-300' });
        }
        const steps = parseInt(document.getElementById('dash-steps')?.textContent?.replace(/,/g, '') || '0', 10);
        if (steps >= 8000) {
            badges.push({ icon: 'fa-shoe-prints', title: 'Walker', desc: '8k+ steps', color: 'text-blue-300' });
        }
        if (badges.length === 0) {
            container.innerHTML = '';
            empty?.classList.remove('hidden');
            return;
        }
        empty?.classList.add('hidden');
        container.innerHTML = badges.map((b) => `
            <div class="glass rounded-2xl p-4 border border-white/10 text-center animate-fade-up">
                <i class="fas ${b.icon} text-2xl ${b.color} mb-2"></i>
                <p class="text-sm font-semibold">${b.title}</p>
                <p class="text-xs text-slate-500 mt-1">${b.desc}</p>
            </div>`).join('');
    }

    async loadRoleBasedInterface() {
        if (!this.currentUser) return;
        const role = this.currentUser.role || 'customer';
        await this.loadNavigation(role);
        this.updateSectionsForRole(role);
        if (role === 'trainer') await this.loadTrainerData();
        else if (role === 'admin') await this.loadAdminData();
    }

    async loadNavigation(role) {
        const navMenu = document.getElementById('navigation-menu');
        if (!navMenu) return;
        const navigationItems = this.getNavigationForRole(role);
        navMenu.innerHTML = navigationItems.map((item) => `
            <span class="text-xs font-medium text-slate-500 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                <i class="${item.icon} mr-1 opacity-70"></i>${item.name}
            </span>`).join('');
    }

    getNavigationForRole(role) {
        const navigation = {
            customer: [
                { name: 'Dashboard', href: '#dashboard', icon: 'fas fa-gauge-high' },
                { name: 'Workouts', href: '#workouts', icon: 'fas fa-dumbbell' },
                { name: 'Nutrition', href: '#nutrition', icon: 'fas fa-apple-whole' },
                { name: 'Analytics', href: '#analytics', icon: 'fas fa-chart-pie' },
            ],
            trainer: [
                { name: 'Clients', href: '#clients', icon: 'fas fa-users' },
                { name: 'Progress', href: '#progress', icon: 'fas fa-chart-line' },
            ],
            admin: [
                { name: 'Users', href: '#users', icon: 'fas fa-users-cog' },
                { name: 'Reports', href: '#system-reports', icon: 'fas fa-chart-bar' },
            ],
        };
        return navigation[role] || navigation.customer;
    }

    updateSectionsForRole(role) {
        document.getElementById('trainer-section')?.classList.add('hidden');
        document.getElementById('admin-section')?.classList.add('hidden');
        document.querySelectorAll('.view-panel').forEach((v) => v.classList.add('hidden'));
        const sidebarCust = document.getElementById('sidebar-nav-customer');
        if (role === 'trainer') {
            document.getElementById('trainer-section')?.classList.remove('hidden');
            sidebarCust?.classList.add('hidden');
        } else if (role === 'admin') {
            document.getElementById('admin-section')?.classList.remove('hidden');
            sidebarCust?.classList.add('hidden');
        } else {
            sidebarCust?.classList.remove('hidden');
            document.getElementById('view-dashboard')?.classList.remove('hidden');
            this.navigateTo('dashboard');
        }
    }

    async loadTrainerData() {
        try {
            const clientsResponse = await this.apiCall('trainers?endpoint=clients', 'GET');
            if (clientsResponse.success) {
                this.displayClients(clientsResponse.clients);
                const cc = document.getElementById('client-count');
                if (cc) cc.textContent = clientsResponse.total ?? 0;
            }
            const availableResponse = await this.apiCall('trainers?endpoint=available-clients', 'GET');
            if (availableResponse.success) {
                this.displayAvailableClients(availableResponse.available_clients);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async loadAdminData() {
        try {
            const usersResponse = await this.apiCall('users', 'GET');
            if (usersResponse.success) {
                this.displayUsers(usersResponse.users);
                const tu = document.getElementById('total-users');
                if (tu) tu.textContent = usersResponse.total ?? 0;
            }
        } catch (error) {
            console.error(error);
        }
    }

    displayClients(clients) {
        const clientsList = document.getElementById('clients-list');
        if (!clientsList) return;
        if (!clients || clients.length === 0) {
            clientsList.innerHTML = '<p class="text-slate-500 text-sm">No clients assigned yet.</p>';
            return;
        }
        clientsList.innerHTML = clients.map((client) => `
            <div class="glass rounded-xl p-4 border border-white/10">
                <div class="flex justify-between items-center gap-2 flex-wrap">
                    <div>
                        <h4 class="font-semibold">${this.escapeHtml(client.first_name)} ${this.escapeHtml(client.last_name)}</h4>
                        <p class="text-xs text-slate-500">${this.escapeHtml(client.email)}</p>
                    </div>
                    <button type="button" onclick="viewClientProgress(${client.client_id})" class="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-200 text-sm">View</button>
                </div>
            </div>`).join('');
    }

    displayAvailableClients(clients) {
        const availableDiv = document.getElementById('available-clients');
        if (!availableDiv) return;
        if (!clients || clients.length === 0) {
            availableDiv.innerHTML = '<p class="text-slate-500 text-sm">No available clients.</p>';
            return;
        }
        availableDiv.innerHTML = clients.map((client) => `
            <div class="flex justify-between items-center p-3 glass rounded-xl border border-white/10 gap-2 flex-wrap">
                <span class="text-sm">${this.escapeHtml(client.first_name)} ${this.escapeHtml(client.last_name)}</span>
                <button type="button" onclick="assignClient(${client.user_id})" class="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-sm">Assign</button>
            </div>`).join('');
    }

    displayUsers(users) {
        const usersTable = document.getElementById('users-table');
        if (!usersTable) return;
        if (!users || users.length === 0) {
            usersTable.innerHTML = '<p class="text-slate-500">No users found.</p>';
            return;
        }
        usersTable.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full text-sm">
                    <thead><tr class="text-left text-slate-500 border-b border-white/10">
                        <th class="py-2 pr-4">User</th><th class="py-2">Role</th><th class="py-2">Status</th><th class="py-2">Action</th>
                    </tr></thead>
                    <tbody>
                        ${users.map((user) => `
                            <tr class="border-b border-white/5">
                                <td class="py-3 pr-4">
                                    <div class="font-medium">${this.escapeHtml(user.first_name)} ${this.escapeHtml(user.last_name)}</div>
                                    <div class="text-xs text-slate-500">${this.escapeHtml(user.email)}</div>
                                </td>
                                <td class="py-3">${this.escapeHtml(user.role)}</td>
                                <td class="py-3">${user.is_active ? 'Active' : 'Inactive'}</td>
                                <td class="py-3">
                                    <button type="button" onclick="toggleUserStatus(${user.user_id}, ${!user.is_active})" class="text-rose-300 hover:underline text-xs">Toggle</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageElement = document.getElementById('notification-message');
        if (messageElement) messageElement.textContent = message;
        if (icon) {
            if (type === 'success') icon.className = 'fas fa-check-circle text-accent-green text-xl mt-0.5';
            else if (type === 'error') icon.className = 'fas fa-exclamation-circle text-red-400 text-xl mt-0.5';
            else icon.className = 'fas fa-info-circle text-cyan-300 text-xl mt-0.5';
        }
        notification?.classList.remove('is-hidden');
        setTimeout(() => this.hideNotification(), 3500);
    }

    hideNotification() {
        document.getElementById('notification')?.classList.add('is-hidden');
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const url = this.apiBaseUrl + endpoint;
        const options = {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        };
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        const response = await fetch(url, options);
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            const err = json.error || json.message || 'Request failed';
            throw new Error(typeof err === 'string' ? err : JSON.stringify(err));
        }
        return json;
    }
}

function closeAuthModal() {
    window.fitnessTracker.closeAuthModal();
}

function hideNotification() {
    window.fitnessTracker.hideNotification();
}

function viewClientProgress(clientId) {
    window.fitnessTracker.apiCall(`trainers?endpoint=client-progress&client_id=${clientId}`, 'GET')
        .then((r) => window.fitnessTracker.showNotification('Loaded client progress', 'info'))
        .catch(() => window.fitnessTracker.showNotification('Could not load progress', 'error'));
}

function assignClient(clientId) {
    window.fitnessTracker.apiCall('trainers?action=assign-client', 'POST', { client_id: clientId })
        .then(() => {
            window.fitnessTracker.showNotification('Assigned', 'success');
            window.fitnessTracker.loadTrainerData();
        })
        .catch(() => window.fitnessTracker.showNotification('Assign failed', 'error'));
}

function loadUsers(role) {
    window.fitnessTracker.apiCall(`users?role=${role}`, 'GET')
        .then((r) => { if (r.success) window.fitnessTracker.displayUsers(r.users); })
        .catch(() => window.fitnessTracker.showNotification('Load failed', 'error'));
}

function loadSystemReport(type) {
    window.fitnessTracker.showNotification(`Report: ${type}`, 'info');
}

function toggleUserStatus(userId, activate) {
    const action = activate ? 'activate' : 'deactivate';
    window.fitnessTracker.apiCall(`users?id=${userId}&action=${action}`, 'DELETE')
        .then(() => {
            window.fitnessTracker.showNotification('Updated', 'success');
            window.fitnessTracker.loadAdminData();
        })
        .catch(() => window.fitnessTracker.showNotification('Failed', 'error'));
}

document.addEventListener('DOMContentLoaded', () => {
    window.fitnessTracker = new FitnessTracker();
});
