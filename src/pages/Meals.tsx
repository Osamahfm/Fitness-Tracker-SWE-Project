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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus, UtensilsCrossed, Flame, TrendingUp, Trash2,
  Loader2, Beef, Wheat, Droplets, Leaf, Lightbulb, ChefHat,
  Target, Apple
} from 'lucide-react';

export default function Meals() {
  const [meals, setMeals] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [macroTargets, setMacroTargets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [activeTab, setActiveTab] = useState('log');

  const [form, setForm] = useState({
    name: '', meal_type: 'breakfast', calories: '', protein_g: '', carbs_g: '', fats_g: '', fiber_g: '', notes: '',
  });

  useEffect(() => {
    loadMeals();
    loadRecommendations();
  }, [filterDate]);

  const loadMeals = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterDate) params.date = filterDate;
      const res = await api.getMeals(params);
      setMeals(res.data.meals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const res = await api.getMealRecommendations();
      setRecommendations(res.data.recommendations || []);
      setMacroTargets(res.data.macro_targets);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.logMeal({
        name: form.name,
        meal_type: form.meal_type,
        calories: parseInt(form.calories),
        protein_g: form.protein_g ? parseFloat(form.protein_g) : 0,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : 0,
        fats_g: form.fats_g ? parseFloat(form.fats_g) : 0,
        fiber_g: form.fiber_g ? parseFloat(form.fiber_g) : 0,
        notes: form.notes || null,
      });
      setDialogOpen(false);
      setForm({ name: '', meal_type: 'breakfast', calories: '', protein_g: '', carbs_g: '', fats_g: '', fiber_g: '', notes: '' });
      loadMeals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this meal?')) return;
    try {
      await api.deleteMeal(id);
      loadMeals();
    } catch (err) {
      console.error(err);
    }
  };

  const totalCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
  const totalProtein = meals.reduce((sum, m) => sum + (m.protein_g || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbs_g || 0), 0);
  const totalFats = meals.reduce((sum, m) => sum + (m.fats_g || 0), 0);

  const groupedRecs = recommendations.reduce((acc: any, rec: any) => {
    if (!acc[rec.meal_type]) acc[rec.meal_type] = [];
    acc[rec.meal_type].push(rec);
    return acc;
  }, {});

  const mealTypeIcons: Record<string, any> = {
    breakfast: <Apple className="w-4 h-4" />,
    lunch: <UtensilsCrossed className="w-4 h-4" />,
    dinner: <ChefHat className="w-4 h-4" />,
    snack: <Leaf className="w-4 h-4" />,
    pre_workout: <TrendingUp className="w-4 h-4" />,
    post_workout: <Beef className="w-4 h-4" />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Meals</h1>
          <p className="text-sm text-slate-500 mt-1">Log meals and get personalized recommendations</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Log Meal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-emerald-600" />
                Log New Meal
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Meal Name</Label>
                <Input placeholder="e.g., Grilled Chicken Salad" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select value={form.meal_type} onValueChange={v => setForm({ ...form, meal_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="pre_workout">Pre-Workout</SelectItem>
                    <SelectItem value="post_workout">Post-Workout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Calories</Label>
                  <Input type="number" min="0" placeholder="350" value={form.calories}
                    onChange={e => setForm({ ...form, calories: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Protein (g)</Label>
                  <Input type="number" step="0.1" min="0" placeholder="25" value={form.protein_g}
                    onChange={e => setForm({ ...form, protein_g: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Carbs (g)</Label>
                  <Input type="number" step="0.1" min="0" placeholder="40" value={form.carbs_g}
                    onChange={e => setForm({ ...form, carbs_g: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fats (g)</Label>
                  <Input type="number" step="0.1" min="0" placeholder="12" value={form.fats_g}
                    onChange={e => setForm({ ...form, fats_g: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Fiber (g)</Label>
                  <Input type="number" step="0.1" min="0" placeholder="5" value={form.fiber_g}
                    onChange={e => setForm({ ...form, fiber_g: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes <span className="text-slate-400">optional</span></Label>
                <Textarea placeholder="Any additional notes..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Log Meal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Macro Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroCard icon={<Flame className="w-5 h-5" />} label="Calories" value={totalCalories} color="emerald" />
        <MacroCard icon={<Beef className="w-5 h-5" />} label="Protein" value={`${totalProtein.toFixed(1)}g`} color="blue" />
        <MacroCard icon={<Wheat className="w-5 h-5" />} label="Carbs" value={`${totalCarbs.toFixed(1)}g`} color="amber" />
        <MacroCard icon={<Droplets className="w-5 h-5" />} label="Fats" value={`${totalFats.toFixed(1)}g`} color="rose" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white dark:bg-slate-800 border">
          <TabsTrigger value="log" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <UtensilsCrossed className="w-4 h-4 mr-1" /> My Meals
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <Lightbulb className="w-4 h-4 mr-1" /> Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="log" className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-48" />
            {filterDate && <Button variant="ghost" size="sm" onClick={() => setFilterDate('')}>Clear</Button>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>
          ) : meals.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center text-slate-400">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No meals logged</p>
                <p className="text-sm mt-1">Start tracking your nutrition!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {meals.map((meal: any) => (
                <Card key={meal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        {mealTypeIcons[meal.meal_type] || <UtensilsCrossed className="w-5 h-5 text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-slate-900 dark:text-white truncate">{meal.name}</p>
                          <Badge variant="outline" className="text-xs capitalize">{meal.meal_type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                          <span>P: {meal.protein_g}g</span>
                          <span>C: {meal.carbs_g}g</span>
                          <span>F: {meal.fats_g}g</span>
                          <span>Fi: {meal.fiber_g}g</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-emerald-600">{meal.calories}</p>
                        <p className="text-xs text-slate-400">kcal</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500"
                        onClick={() => handleDelete(meal.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4 space-y-6">
          {/* Macro Targets */}
          {macroTargets && (
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">Macro Targets</p>
                    <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-2">{macroTargets.description}</p>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-600">{macroTargets.protein_pct}%</p>
                        <p className="text-xs text-slate-500">Protein</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-amber-600">{macroTargets.carbs_pct}%</p>
                        <p className="text-xs text-slate-500">Carbs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-rose-600">{macroTargets.fats_pct}%</p>
                        <p className="text-xs text-slate-500">Fats</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grouped Recommendations */}
          {Object.entries(groupedRecs).map(([type, recs]: [string, any]) => (
            <div key={type}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3 capitalize flex items-center gap-2">
                {mealTypeIcons[type] || <UtensilsCrossed className="w-4 h-4" />}
                {type.replace('_', ' ')}
              </h3>
              <div className="space-y-3">
                {recs.map((rec: any, i: number) => (
                  <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setForm({
                        name: rec.name, meal_type: rec.meal_type,
                        calories: String(rec.calories || rec.adjusted_calories || ''),
                        protein_g: String(rec.protein_g || rec.adjusted_protein || ''),
                        carbs_g: String(rec.carbs_g || rec.adjusted_carbs || ''),
                        fats_g: String(rec.fats_g || rec.adjusted_fats || ''),
                        fiber_g: '', notes: rec.recipe || '',
                      });
                      setDialogOpen(true);
                    }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{rec.name}</p>
                          <p className="text-xs text-slate-500 mt-1">{rec.description}</p>
                          {rec.recipe && (
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{rec.recipe}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-emerald-600">
                            {rec.adjusted_calories || rec.calories} kcal
                          </p>
                          <p className="text-xs text-slate-400">
                            P:{Math.round(rec.protein_g || rec.adjusted_protein || 0)}g
                            C:{Math.round(rec.carbs_g || rec.adjusted_carbs || 0)}g
                            F:{Math.round(rec.fats_g || rec.adjusted_fats || 0)}g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MacroCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
  };
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
