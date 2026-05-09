import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Flame, Timer, Route, TrendingUp, Trash2, Dumbbell,
  Loader2, Activity, Filter
} from 'lucide-react';

export default function Activities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');

  const [form, setForm] = useState({
    activity_type_id: '',
    duration_minutes: '',
    distance_km: '',
    intensity: 'moderate',
    notes: '',
  });

  useEffect(() => {
    loadActivities();
    loadTypes();
  }, [filterDate]);

  const loadActivities = async () => {
    try {
      const params: any = {};
      if (filterDate) params.date = filterDate;
      const res = await api.getActivities(params);
      setActivities(res.data.activities || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTypes = async () => {
    try {
      const res = await api.getActivityTypes();
      setActivityTypes(res.data.types || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.activity_type_id || !form.duration_minutes) return;

    setSubmitting(true);
    try {
      await api.logActivity({
        activity_type_id: parseInt(form.activity_type_id),
        duration_minutes: parseInt(form.duration_minutes),
        distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
        intensity: form.intensity,
        notes: form.notes || null,
      });
      setDialogOpen(false);
      setForm({ activity_type_id: '', duration_minutes: '', distance_km: '', intensity: 'moderate', notes: '' });
      loadActivities();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this activity?')) return;
    try {
      await api.deleteActivity(id);
      loadActivities();
    } catch (err) {
      console.error(err);
    }
  };

  const groupedTypes = activityTypes.reduce((acc: any, type: any) => {
    if (!acc[type.category]) acc[type.category] = [];
    acc[type.category].push(type);
    return acc;
  }, {});

  const totalCalories = activities.reduce((sum, a) => sum + (a.calories_burned || 0), 0);
  const totalDuration = activities.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
  const totalDistance = activities.reduce((sum, a) => sum + (a.distance_km || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Activities</h1>
          <p className="text-sm text-slate-500 mt-1">Log and track your physical activities</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Log New Activity
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Activity Type</Label>
                <Select value={form.activity_type_id} onValueChange={v => setForm({ ...form, activity_type_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select activity" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(groupedTypes).map(([category, types]: [string, any]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {category}
                        </div>
                        {types.map((type: any) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name} (MET: {type.met_value})
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Input type="number" min="1" placeholder="30"
                    value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Distance (km) <span className="text-slate-400">optional</span></Label>
                  <Input type="number" step="0.1" min="0" placeholder="5.0"
                    value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Intensity</Label>
                <Select value={form.intensity} onValueChange={v => setForm({ ...form, intensity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Easy effort</SelectItem>
                    <SelectItem value="moderate">Moderate - Comfortable</SelectItem>
                    <SelectItem value="high">High - Challenging</SelectItem>
                    <SelectItem value="very_high">Very High - Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes <span className="text-slate-400">optional</span></Label>
                <Textarea placeholder="How did it feel?"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Activity'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalCalories.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Calories Burned</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Timer className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDuration}</p>
              <p className="text-sm text-slate-500">Minutes Active</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Route className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalDistance.toFixed(1)}</p>
              <p className="text-sm text-slate-500">Kilometers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <Input type="date" value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="w-48"
          placeholder="Filter by date" />
        {filterDate && (
          <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>
            Clear
          </Button>
        )}
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : activities.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No activities yet</p>
              <p className="text-sm mt-1">Log your first activity to start tracking!</p>
            </CardContent>
          </Card>
        ) : (
          activities.map((activity: any) => (
            <Card key={activity.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {activity.activity_name}
                      </p>
                      <Badge variant="outline" className="text-xs capitalize">{activity.activity_category}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5" />
                        {activity.duration_minutes} min
                      </span>
                      {activity.distance_km && (
                        <span className="flex items-center gap-1">
                          <Route className="w-3.5 h-3.5" />
                          {activity.distance_km} km
                        </span>
                      )}
                      <span className="flex items-center gap-1 capitalize">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {activity.intensity}
                      </span>
                    </div>
                    {activity.notes && (
                      <p className="text-sm text-slate-400 mt-1 truncate">{activity.notes}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-orange-600">{activity.calories_burned}</p>
                    <p className="text-xs text-slate-400">kcal</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-red-500"
                    onClick={() => handleDelete(activity.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
