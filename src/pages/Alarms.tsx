import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Bell, Clock, Trash2, Loader2, Activity, Target,
  UtensilsCrossed, Sparkles
} from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
};

export default function Alarms() {
  const [alarms, setAlarms] = useState<any[]>([]);
  const [todayAlarms, setTodayAlarms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', alarm_type: 'activity_reminder',
    scheduled_time: '08:00', selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  });

  useEffect(() => {
    loadAlarms();
    loadTodayAlarms();
  }, []);

  const loadAlarms = async () => {
    try {
      const res = await api.getAlarms();
      setAlarms(res.data.alarms || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayAlarms = async () => {
    try {
      const res = await api.getTodayAlarms();
      setTodayAlarms(res.data.alarms || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAlarm({
        title: form.title,
        description: form.description || null,
        alarm_type: form.alarm_type,
        scheduled_time: form.scheduled_time + ':00',
        scheduled_days: form.selectedDays,
      });
      setDialogOpen(false);
      setForm({ title: '', description: '', alarm_type: 'activity_reminder', scheduled_time: '08:00', selectedDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] });
      loadAlarms();
      loadTodayAlarms();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDay = (day: string) => {
    setForm(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day]
    }));
  };

  const toggleAlarm = async (alarm: any) => {
    try {
      await api.updateAlarm(alarm.id, { ...alarm, is_active: !alarm.is_active });
      loadAlarms();
      loadTodayAlarms();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await api.deleteAlarm(id);
      loadAlarms();
      loadTodayAlarms();
    } catch (err) {
      console.error(err);
    }
  };

  const typeIcons: Record<string, any> = {
    activity_reminder: <Activity className="w-4 h-4" />,
    goal_reminder: <Target className="w-4 h-4" />,
    meal_reminder: <UtensilsCrossed className="w-4 h-4" />,
    custom: <Sparkles className="w-4 h-4" />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reminders</h1>
          <p className="text-sm text-slate-500 mt-1">Set up activity alerts and notifications</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> New Reminder
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                Create Reminder
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="e.g., Morning Run" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-slate-400">optional</span></Label>
                <Textarea placeholder="Additional details..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Reminder Type</Label>
                <Select value={form.alarm_type} onValueChange={v => setForm({ ...form, alarm_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activity_reminder">Activity Reminder</SelectItem>
                    <SelectItem value="goal_reminder">Goal Reminder</SelectItem>
                    <SelectItem value="meal_reminder">Meal Reminder</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Scheduled Time</Label>
                <Input type="time" value={form.scheduled_time}
                  onChange={e => setForm({ ...form, scheduled_time: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Repeat Days</Label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        form.selectedDays.includes(day)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Create Reminder</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Reminders */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-600" />
            <CardTitle className="text-lg font-semibold">Today&apos;s Reminders</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {todayAlarms.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">No reminders scheduled for today</p>
          ) : (
            <div className="space-y-2">
              {todayAlarms.map((alarm: any) => (
                <div key={alarm.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{alarm.title}</p>
                    <p className="text-xs text-slate-500">
                      {alarm.scheduled_time?.substring(0, 5)} &middot; {alarm.alarm_type.replace('_', ' ')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alarm.scheduled_time?.substring(0, 5)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Alarms */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All Reminders</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
        ) : alarms.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-12 text-center text-slate-400">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No reminders yet</p>
              <p className="text-sm mt-1">Create your first reminder!</p>
            </CardContent>
          </Card>
        ) : (
          alarms.map((alarm: any) => (
            <Card key={alarm.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    alarm.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}>
                    {typeIcons[alarm.alarm_type] || <Bell className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-semibold truncate ${alarm.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                        {alarm.title}
                      </p>
                      {!alarm.is_active && <Badge variant="outline" className="text-xs">Paused</Badge>}
                    </div>
                    {alarm.description && (
                      <p className="text-sm text-slate-500 truncate">{alarm.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">{alarm.alarm_type.replace('_', ' ')}</Badge>
                      <span className="text-xs text-slate-400">
                        {alarm.scheduled_time?.substring(0, 5)}
                      </span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {DAYS.map(day => (
                        <span key={day} className={`text-xs px-1.5 py-0.5 rounded ${
                          alarm.scheduled_days?.includes(day)
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}>
                          {DAY_LABELS[day]}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch checked={alarm.is_active} onCheckedChange={() => toggleAlarm(alarm)} />
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"
                      onClick={() => handleDelete(alarm.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
