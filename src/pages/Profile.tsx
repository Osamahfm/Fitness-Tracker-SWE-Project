import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  User, Flame, Save, Loader2, TrendingUp, Target,
  Activity, AlertTriangle
} from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwMessage, setPwMessage] = useState('');

  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    age: user?.age ? String(user.age) : '',
    weight_kg: user?.weight_kg ? String(user.weight_kg) : '',
    height_cm: user?.height_cm ? String(user.height_cm) : '',
    gender: user?.gender || '',
    activity_level: user?.activity_level || 'moderately_active',
    fitness_goal: user?.fitness_goal || 'maintain_weight',
  });

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await api.updateProfile({
        full_name: form.full_name,
        age: form.age ? parseInt(form.age) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        gender: form.gender || null,
        activity_level: form.activity_level,
        fitness_goal: form.fitness_goal,
      });
      await refreshUser();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMessage('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMessage('New passwords do not match');
      return;
    }
    if (pwForm.new_password.length < 8) {
      setPwMessage('Password must be at least 8 characters');
      return;
    }
    try {
      await api.updateProfile(pwForm);
      setPwMessage('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err: any) {
      setPwMessage(err.message || 'Failed to change password');
    }
  };

  const bmr = user?.bmr || 0;
  const tdee = user?.tdee || 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Flame className="w-5 h-5" />} label="BMR" value={`${Math.round(bmr)}`} sub="kcal/day" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="TDEE" value={`${Math.round(tdee)}`} sub="kcal/day" />
        <StatCard icon={<Target className="w-5 h-5" />} label="Daily Target" value={`${user?.daily_calorie_target || 0}`} sub="kcal" />
        <StatCard icon={<Activity className="w-5 h-5" />} label="Goal" value={user?.fitness_goal?.replace('_', ' ') || 'N/A'} sub="type" />
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-white dark:bg-slate-800 border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <User className="w-4 h-4 mr-1" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
            <AlertTriangle className="w-4 h-4 mr-1" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {message}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-slate-50" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Age</Label>
                    <Input type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input type="number" step="0.1" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <Select value={form.activity_level} onValueChange={v => setForm({ ...form, activity_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="lightly_active">Lightly Active</SelectItem>
                      <SelectItem value="moderately_active">Moderately Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                      <SelectItem value="extra_active">Extra Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fitness Goal</Label>
                  <Select value={form.fitness_goal} onValueChange={v => setForm({ ...form, fitness_goal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lose_weight">Lose Weight</SelectItem>
                      <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                      <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                      <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                {pwMessage && (
                  <div className={`p-3 rounded-lg text-sm ${pwMessage.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {pwMessage}
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={pwForm.current_password}
                    onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={pwForm.new_password}
                    onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={pwForm.confirm_password}
                    onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} required />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Change Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{value} <span className="text-xs font-normal text-slate-500">{sub}</span></p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
