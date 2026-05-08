# Fitness Tracker - Role-Based Access Control Matrix

## Overview
The Fitness Tracker now implements complete role-based access control (RBAC) with three distinct user roles. Each role has **completely unique access permissions and UI**—no two roles share the same feature set.

---

## Role Permissions Matrix

| Feature | Customer | Trainer | Admin |
|---------|----------|---------|-------|
| **Personal Dashboard** | ✅ Yes | ❌ No | ❌ No |
| **Activity Logging** | ✅ Yes | ❌ No | ❌ No (QA only) |
| **Personal Reports** | ✅ Yes | ❌ No | ❌ No |
| **Set Reminders** | ✅ Yes | ❌ No | ❌ No |
| **Nutrition Guidance** | ✅ Yes | ❌ No | ❌ No |
| **Delete Activities** | ✅ Yes | ❌ No | ❌ No |
| **Fitness Goals** | ✅ Can set | ❌ Cannot | ❌ Cannot |
| **Client Coaching** | ❌ No | ✅ Yes | ❌ No |
| **Client Analytics** | ❌ No | ✅ Yes | ❌ No |
| **Meal Planning** | ❌ No | ✅ Yes | ❌ No |
| **Export Data** | ❌ No | ✅ Yes | ✅ Yes |
| **System Audit** | ❌ No | ❌ No | ✅ Yes |
| **Health Monitoring** | ❌ No | ❌ No | ✅ Yes |
| **UAT Sign-Off** | ❌ No | ❌ No | ✅ Yes |
| **Manage Users** | ❌ No | ❌ No | ✅ Yes |
| **Modify Roles** | ❌ No | ❌ No | ✅ Yes |
| **Change Role** | ✅ Yes | ❌ No | ❌ No |

---

## Navigation Routes by Role

### 🔵 Customer Workspace
**Routes:** `/` (Dashboard) | `/activity` (Workout) | `/reports` (Analytics) | `/recommendations` (Nutrition) | `/alarms` (Alarms) | `/profile` (Profile)
- **UI Title:** "Customer Activity Workspace"
- **Topbar:** "Fitness Tracker"
- **Focus:** Personal fitness data, activity tracking, meal recommendations
- **Cannot access:** System Readiness, Trainer features, Admin tools

### 🟣 Trainer Workspace
**Routes:** `/` (Coaching Hub) | `/activity` (Session Builder) | `/reports` (Client Analytics) | `/recommendations` (Meal Plans) | `/profile` (Trainer Profile)
- **UI Title:** "Trainer Coaching Workspace"
- **Topbar:** "Trainer Portal - Client Coaching"
- **Focus:** Client session management, coaching analytics, meal guidance
- **Cannot access:** Reminders, Readiness, Admin tools, Personal tracking

### 🔴 Admin Workspace
**Routes:** `/` (System Hub) | `/activity` (Activity QA) | `/reports` (Data Reports) | `/readiness` (Readiness) | `/profile` (Admin Profile)
- **UI Title:** "Admin System Workspace"
- **Topbar:** "Backend Developer & Software Engineer"
- **Focus:** System health, data validation, UAT approval, monitoring
- **Cannot access:** Nutrition, Meal planning, Reminders, Trainer/Customer features

---

## Profile Customization by Role

### Customer Profile
- ✅ Can change: Name, Role, Goal, Weight
- ❌ Cannot change: Email
- Fields shown: Full name, Email, Account role, Fitness goal, Body weight

### Trainer Profile
- ✅ Can change: Name, Weight
- ❌ Cannot change: Email, Role, Goal
- Fields shown: Full name, Email, Body weight
- Note: Role and Goal are locked to prevent accidental changes

### Admin Profile
- ✅ Can change: Name
- ❌ Cannot change: Email, Role, Goal, Weight
- Fields shown: Full name, Email only
- Note: Strict lockdown on configuration

---

## Reports Page - Role-Specific Functionality

### Customer Reports
- **Label:** "Saved Activity Records"
- **Can:** Delete own activities ✅
- **Can:** Export CSV ❌
- **Can:** Audit data ❌

### Trainer Reports
- **Label:** "Coaching Activity Records"
- **Can:** Delete activities ❌
- **Can:** Export CSV ✅
- **Can:** Audit data ❌

### Admin Reports
- **Label:** "Activity Data Audit"
- **Can:** Delete activities ❌
- **Can:** Export CSV ✅
- **Can:** Audit data ✅

---

## Access Control Implementation

### 1. **Protected Routes** (App.jsx)
- Every route wrapped with `<ProtectedRoute>` component
- Unauthorized users redirected to dashboard
- Unauthenticated users redirected to login

### 2. **Permission Helpers** (userRoles.js)
```javascript
hasPermission(role, permission)      // Check single permission
canAccessPage(role, page)            // Check page access
hasFeature(role, featureName)        // Check feature availability
```

### 3. **Page-Level Checks**
- ActivityInput.jsx: Prevents non-logging roles from accessing activity creation
- Alarms.jsx: Customers only
- MealsAndGoals.jsx: Customers and Trainers only
- SystemReadiness.jsx: Admins only
- Reports.jsx: Shows/hides delete & export buttons based on role

### 4. **UI Customization**
- Conditional button rendering
- Role-specific labels and descriptions
- Dynamic navigation based on role
- Profile avatar colors by role

---

## Key Differences - At a Glance

| Aspect | Customer | Trainer | Admin |
|--------|----------|---------|-------|
| **Primary Function** | Track own fitness | Coach clients | Maintain system |
| **Data Focus** | Personal activities | Client sessions | System metrics |
| **Navigation Items** | 6 routes | 5 routes | 5 routes (different) |
| **Write Permissions** | Own activities | None | None |
| **Delete Permissions** | Own activities | None | None |
| **Export Permissions** | None | ✅ CSV export | ✅ CSV + audit |
| **System Access** | None | None | ✅ Full access |
| **Profile Edits** | 5 fields | 2 fields | 1 field |
| **Color Theme** | Blue | Purple | Red |

---

## Feature Gates by Role

### Personal Fitness Tracking
- ✅ Customer (primary feature)
- ❌ Trainer
- ❌ Admin

### Client Coaching & Management
- ❌ Customer
- ✅ Trainer (primary feature)
- ❌ Admin

### System Administration & Audit
- ❌ Customer
- ❌ Trainer
- ✅ Admin (primary feature)

---

## Testing Role-Based Access

To verify the RBAC system works correctly:

1. **Register as Customer**: Access fitness tracking features, cannot access Admin tools
2. **Register as Trainer**: Cannot log personal activities, cannot access System Readiness
3. **Register as Admin**: Cannot access Alarms/Nutrition, can access Readiness and Audit
4. **Role Change Prevention**: Attempt to change role as Trainer (should be blocked)
5. **URL Access Test**: Try to navigate to `/readiness` as Customer (should redirect)
6. **Feature Visibility**: Export button missing for Customer in Reports, Delete button hidden for Trainer

---

## Conclusion

This role-based access control system ensures that:
- ✅ Each role has **completely unique capabilities**
- ✅ No feature overlap between roles
- ✅ UI adapts to role-specific workflows
- ✅ Access is enforced at routing and component levels
- ✅ Users cannot accidentally access unauthorized features
