import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, Target, Trash2, Loader2, TrendingUp, Pause, Play,
  Award, Lightbulb, Zap, Route, Flame, Dumbbell
} from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('my_goals');

  const [form, setForm] = useState({
    title: '', description: '', goal_type: 'weekly_duration',
    target_value: '', unit: 'minutes', start_date: '', end_date: '',
    reminders_enabled: true,
  });

  useEffect(() => {
    loadGoals();
    loadRecommendations();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getGoals();
      setGoals(res.data.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await api.getGoalRecommendations();
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createGoal({
        title: form.title,
        description: form.description || null,
        goal_type: form.goal_type,
        target_value: parseFloat(form.target_value),
        unit: form.unit,
        start_date: form.start_date || new Date().toISOString().split('T')[0],
        end_date: form.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        reminders_enabled: form.reminders_enabled,
      });
      setDialogOpen(false);
      setForm({
        title: '', description: '', goal_type: 'weekly_duration',
        target_value: '', unit: 'minutes', start_date: '', end_date: '',
        reminders_enabled: true,
      });
      loadGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.updateGoalStatus(id, newStatus);
      loadGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.deleteGoal(id);
      loadGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdopt = (rec: any) => {
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + rec.suggested_duration_days);

    setForm({
      title: rec.title,
      description: rec.description,
      goal_type: rec.type,
      target_value: String(rec.target_value),
      unit: rec.unit,
      start_date: now.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
      reminders_enabled: true,
    });
    setActiveTab('my_goals');
    setDialogOpen(true);
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  const goalIcons: Record<string, any> = {
    weekly_distance: <Route className="w-5 h-5" />,
    weekly_duration: <TrendingUp className="w-5 h-5" />,
    weekly_calories: <Flame className="w-5 h-5" />,
    weight_target: <Target className="w-5 h-5" />,
    daily_steps: <Zap className="w-5 h-5" />,
    custom: <Dumbbell className="w-5 h-5" />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Goals</h1>
          <p className="text-sm text-slate-500 mt-1">Set and track your fitness targets</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Create New Goal
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Title</Label>
                <Input placeholder="e.g., Run 50km this month" value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Description <span className="text-slate-400">optional</span></Label>
                <Textarea placeholder="Why is this goal important to you?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Goal Type</Label>
                <Select value={form.goal_type} onValueChange={v => setForm({ ...form, goal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly_distance">Weekly Distance</SelectItem>
                    <SelectItem value="weekly_duration">Weekly Duration</SelectItem>
                    <SelectItem value="weekly_calories">Weekly Calories</SelectItem>
                    <SelectItem value="weight_target">Weight Target</SelectItem>
                    <SelectItem value="daily_steps">Daily Steps</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input type="number" step="0.1" min="0.1" placeholder="50"
                    value={form.target_value} onChange={e => setForm({ ...form, target_value: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input placeholder="km, min, kg, kcal" value={form.unit}
                    onChange={e => setForm({ ...form, unit: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Enable Reminders</Label>
                <Switch checked={form.reminders_enabled}
                  onCheckedChange={v => setForm({ ...form, reminders_enabled: v })} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-800 border">
          <TabsTrigger value="my_goals" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Target className="w-4 h-4 mr-1" /> My Goals ({activeGoals.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Award className="w-4 h-4 mr-1" /> Completed ({completedGoals.length})
          </TabsTrigger>
          <TabsTrigger value="recommended" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Lightbulb className="w-4 h-4 mr-1" /> Recommended
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my_goals" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : activeGoals.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No active goals</p>
                <p className="text-sm mt-1">Create a goal or adopt a recommended one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeGoals.map((goal: any) => (
                <GoalCard key={goal.id} goal={goal} icon={goalIcons[goal.goal_type] || goalIcons.custom}
                  onToggle={() => toggleStatus(goal.id, goal.status)}
                  onDelete={() => handleDelete(goal.id)} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedGoals.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No completed goals yet</p>
                <p className="text-sm mt-1">Keep pushing, you'll get there!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedGoals.map((goal: any) => (
                <GoalCard key={goal.id} goal={goal} icon={goalIcons[goal.goal_type] || goalIcons.custom}
                  onToggle={() => toggleStatus(goal.id, goal.status)}
                  onDelete={() => handleDelete(goal.id)} completed />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommended" className="mt-4 space-y-4">
          {recommendations.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No recommendations yet</p>
                <p className="text-sm mt-1">Log some activities first!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec: any, i: number) => (
                <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAdopt(rec)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        {goalIcons[rec.type] || <Lightbulb className="w-5 h-5 text-emerald-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{rec.title}</p>
                        <p className="text-sm text-slate-500 mt-1">{rec.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="outline" className="text-xs">{rec.target_value} {rec.unit}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{rec.category}</Badge>
                          <span className="text-xs text-emerald-600 font-medium">Click to adopt</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GoalCard({ goal, icon, onToggle, onDelete, completed }: {
  goal: any; icon: React.ReactNode; onToggle: () => void; onDelete: () => void; completed?: boolean;
}) {
  const statusColors: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    paused: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <Card className={`border-0 shadow-sm ${completed ? 'opacity-80' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{goal.title}</p>
              <Badge variant="outline" className={`text-xs capitalize ${statusColors[goal.status] || ''}`}>
                {goal.status}
              </Badge>
            </div>
            {goal.description && (
              <p className="text-sm text-slate-500 mt-1">{goal.description}</p>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500">
                  {goal.current_value} / {goal.target_value} {goal.unit}
                </span>
                <span className="text-xs font-medium text-slate-700">{goal.progress_percentage}%</span>
              </div>
              <Progress value={goal.progress_percentage} className="h-2" />
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {new Date(goal.start_date).toLocaleDateString()} - {new Date(goal.end_date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            {!completed && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onToggle}
                title={goal.status === 'active' ? 'Pause' : 'Resume'}>
                {goal.status === 'active' ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-5 text-emerald-500" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
