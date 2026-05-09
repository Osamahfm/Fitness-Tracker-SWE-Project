# FitTrack Pro - Fitness Tracker Platform

A full-stack fitness tracking web application built with React + TypeScript frontend and PHP 8.x backend.

## Tech Stack

### Frontend
- React 19 + TypeScript + Vite
- Tailwind CSS + shadcn/ui components
- React Router v7

### Backend
- PHP 8.1+ with OOP design patterns
- MySQL 8.x database
- JWT authentication
- RESTful JSON API

### Design Patterns Used
- **Singleton** - Database connection manager
- **Repository** - Data access layer (User, Activity, Meal, Goal, Alarm, DailyReport)
- **Strategy** - Calorie calculation engine (MET-based with intensity multipliers)
- **Factory** - Model creation from database arrays
- **Service Layer** - Business logic (MealRecommendationEngine, CalorieCalculationContext)

## Features (Requirements Mapping)

| Requirement | Feature | Status |
|-------------|---------|--------|
| R1 - Activity Logging | Log activities with distance, duration, type | ✅ Complete |
| R2 - Goal Tracking & Recommendations | Create goals, get AI recommendations | ✅ Complete |
| R3 - Meal Interface & Recommendations | Log meals, get goal-based recommendations | ✅ Complete |
| R4 - Calorie Calculation Engine | MET-based strategy with intensity/distance | ✅ Complete |
| R5 - User Registration | Multi-step registration with profile | ✅ Complete |
| R6 - Activity Alarms | Schedule reminders with day selection | ✅ Complete |
| R7 - Daily Reports | Dashboard with summary, macros, goals | ✅ Complete |
| R8 - Reliability | Modular PHP architecture | ✅ Complete |
| R9 - Performance | Optimized queries, lazy loading | ✅ Complete |
| R10 - User Validation | Form validation, JWT auth | ✅ Complete |

## Database Schema

### Tables
1. **users** - User accounts with profile, body metrics, fitness goals
2. **activity_types** - 29 activity types with MET values
3. **activities** - Logged user activities with auto calorie calculation
4. **meals** - Logged meals with macro breakdown
5. **meal_recommendations** - Pre-seeded meal suggestions per goal type
6. **goals** - User fitness goals with progress tracking
7. **activity_alarms** - Scheduled reminders
8. **daily_reports** - Cached daily summaries
9. **user_sessions** - JWT session tracking

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with JWT
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/password` - Change password

### Activities
- `GET/POST /api/activities` - List/Create activities
- `GET /api/activities/types` - Get activity types
- `GET /api/activities/summary` - Get daily/weekly summary
- `DELETE /api/activities/:id` - Delete activity

### Meals
- `GET/POST /api/meals` - List/Create meals
- `GET /api/meals/recommendations` - Get meal recommendations
- `GET /api/meals/meal-plan` - Generate daily meal plan
- `DELETE /api/meals/:id` - Delete meal

### Goals
- `GET/POST /api/goals` - List/Create goals
- `PUT /api/goals/:id/progress` - Update progress
- `PUT /api/goals/:id/status` - Update status
- `GET /api/goals/recommendations` - Get goal recommendations
- `DELETE /api/goals/:id` - Delete goal

### Alarms
- `GET/POST /api/alarms` - List/Create alarms
- `GET /api/alarms/today` - Get today's alarms
- `PUT /api/alarms/:id` - Update alarm
- `DELETE /api/alarms/:id` - Delete alarm

### Dashboard
- `GET /api/dashboard` - Main dashboard data
- `GET /api/dashboard/weekly` - Weekly overview
- `GET /api/dashboard/stats` - Overall statistics

## Setup Instructions

### 1. Database Setup
```sql
mysql -u root -p < db/schema.sql
```

### 2. PHP Backend Setup
```bash
cd api
composer install
# Configure web server to point to api/public/ as document root
# Or use PHP built-in server:
php -S localhost:8080 -t public/
```

### 3. Frontend Setup
```bash
npm install
npm run dev    # Development
npm run build  # Production
```

### 4. Environment Configuration
Edit `.env` file:
```
VITE_API_URL=http://localhost:8080
```

Update `api/src/Config/Database.php` with your MySQL credentials.

## Calorie Calculation

The calorie engine uses the **Strategy Pattern** with MET-based calculations:

```
Calories = MET * Weight(kg) * Duration(hours) * Intensity_Multiplier

Intensity Multipliers:
- Low: 0.75x
- Moderate: 1.0x (default)
- High: 1.25x
- Very High: 1.55x

Distance bonus (for distance-based activities):
Blended: 70% MET-based + 30% Distance-based
```

## Meal Recommendations

Meals are recommended based on fitness goal:
- **Lose Weight**: Higher protein, lower calories (deficit -500 kcal)
- **Maintain**: Balanced macros at TDEE
- **Gain Muscle**: Higher carbs and protein (surplus +300 kcal)
- **Body Recomposition**: High protein at TDEE
