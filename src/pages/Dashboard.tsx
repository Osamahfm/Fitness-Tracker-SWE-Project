import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Flame, Activity, UtensilsCrossed, Target, Bell,
  TrendingUp, Zap, Sunrise, ArrowUpRight,
  ArrowDownRight, Minus, Loader2, CalendarDays, ChevronLeft,
  ChevronRight, Dumbbell, Heart, AlertCircle
} from 'lucide-react';

interface DashboardData {
  date: string;
  user: any;
  daily_report: any;
  activities: any[];
  meals: any[];
  goals: any[];
  today_alarms: any[];
  recommendations: any[];
  weekly_activity: any[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadDashboard();
  }, [selectedDate]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard(selectedDate);
      setData(res.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const report = data?.daily_report;
  const netCalories = report?.net_calories ?? 0;
  const isSurplus = netCalories > 0;
  const isBalanced = netCalories === 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Athlete'}!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-9 w-9">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
              })}
            </span>
          </div>
          <Button variant="outline" size="icon" onClick={() => changeDate(1)} className="h-9 w-9">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Calories Burned"
          value={report?.activities?.total_calories_burned ?? 0}
          unit="kcal"
          color="orange"
          sub={`${report?.activities?.total_count ?? 0} activities`}
        />
        <StatCard
          icon={<UtensilsCrossed className="w-5 h-5" />}
          label="Calories Consumed"
          value={report?.meals?.total_calories_consumed ?? 0}
          unit="kcal"
          color="emerald"
          sub={`${report?.meals?.total_count ?? 0} meals`}
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Net Balance"
          value={Math.abs(netCalories)}
          unit="kcal"
          color={isSurplus ? 'red' : isBalanced ? 'slate' : 'green'}
          sub={isSurplus ? 'Surplus' : isBalanced ? 'Balanced' : 'Deficit'}
          trend={isSurplus ? 'up' : isBalanced ? 'neutral' : 'down'}
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Daily Target"
          value={user?.daily_calorie_target ?? 2000}
          unit="kcal"
          color="blue"
          sub={`TDEE: ${Math.round(user?.tdee ?? 0)} kcal`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Activities & Meals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Activities */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg font-semibold">Today's Activities</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data?.activities?.length || 0} logged
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data?.activities && data.activities.length > 0 ? (
                <div className="space-y-3">
                  {data.activities.slice(0, 5).map((activity: any) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Dumbbell className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {activity.activity_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {activity.duration_minutes} min &middot; {activity.intensity}
                          {activity.distance_km ? ` \u00b7 ${activity.distance_km} km` : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-orange-600">
                          {activity.calories_burned} kcal
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No activities logged today</p>
                  <p className="text-xs mt-1">Log your first workout to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Meals */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg font-semibold">Today's Meals</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {data?.meals?.length || 0} logged
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {data?.meals && data.meals.length > 0 ? (
                <div className="space-y-3">
                  {data.meals.slice(0, 5).map((meal: any) => (
                    <div key={meal.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <Sunrise className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                          {meal.name}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">{meal.meal_type}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-emerald-600">
                          {meal.calories} kcal
                        </p>
                        <p className="text-xs text-slate-400">
                          P:{Math.round(meal.protein_g)}g C:{Math.round(meal.carbs_g)}g F:{Math.round(meal.fats_g)}g
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meals logged today</p>
                  <p className="text-xs mt-1">Track your nutrition to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Goals & Alarms */}
        <div className="space-y-6">
          {/* Active Goals */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg font-semibold">Active Goals</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data?.goals && data.goals.length > 0 ? (
                <div className="space-y-4">
                  {data.goals.slice(0, 4).map((goal: any) => (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{goal.title}</p>
                        <span className="text-xs text-slate-500">{goal.progress_percentage}%</span>
                      </div>
                      <Progress value={goal.progress_percentage} className="h-2" />
                      <p className="text-xs text-slate-400 mt-1">
                        {goal.current_value} / {goal.target_value} {goal.unit}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No active goals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Alarms */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg font-semibold">Today's Reminders</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {data?.today_alarms && data.today_alarms.length > 0 ? (
                <div className="space-y-2">
                  {data.today_alarms.map((alarm: any) => (
                    <div key={alarm.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900">
                      <Bell className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300 truncate">{alarm.title}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {alarm.scheduled_time?.substring(0, 5)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No reminders for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macro Breakdown */}
          {report?.meals && (report.meals.protein_g > 0 || report.meals.carbs_g > 0) && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg font-semibold">Macro Breakdown</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <MacroBar label="Protein" value={report.meals.protein_g} color="bg-blue-500" />
                  <MacroBar label="Carbs" value={report.meals.carbs_g} color="bg-amber-500" />
                  <MacroBar label="Fats" value={report.meals.fats_g} color="bg-rose-500" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meal Recommendations */}
          {data?.recommendations && data.recommendations.length > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg font-semibold">Recommended</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.recommendations.slice(0, 3).map((rec: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{rec.name}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 capitalize">{rec.meal_type} &middot; {rec.calories} kcal</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Daily Summary Text */}
      {report?.summary_text && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">Daily Summary</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">{report.summary_text}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color, sub, trend }: {
  icon: React.ReactNode; label: string; value: number; unit: string;
  color: string; sub: string; trend?: 'up' | 'down' | 'neutral';
}) {
  const colorMap: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
            {icon}
          </div>
          {trend && (
            trend === 'up' ? <ArrowUpRight className="w-4 h-4 text-red-500" /> :
            trend === 'down' ? <ArrowDownRight className="w-4 h-4 text-green-500" /> :
            <Minus className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
          </p>
          <p className="text-sm text-slate-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MacroBar({ label, value, color }: { label: string; value: number; color: string }) {
  const maxVal = Math.max(value, 50);
  const pct = Math.min(100, (value / maxVal) * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-xs text-slate-500">{Math.round(value)}g</span>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
