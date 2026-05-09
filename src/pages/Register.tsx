import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Flame, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    age: '',
    weight_kg: '',
    height_cm: '',
    gender: '',
    activity_level: 'moderately_active',
    fitness_goal: 'maintain_weight',
  });

  const update = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        age: form.age ? parseInt(form.age) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : null,
        gender: form.gender || null,
        activity_level: form.activity_level,
        fitness_goal: form.fitness_goal,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
        setError('All fields are required');
        return;
      }
      if (form.password !== form.confirm_password) {
        setError('Passwords do not match');
        return;
      }
    }
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-gray-100 p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">FitTrack</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Pro</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map(s => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <CardTitle className="text-xl font-semibold">
              {step === 1 && 'Create Account'}
              {step === 2 && 'Body Metrics'}
              {step === 3 && 'Fitness Goals'}
            </CardTitle>
            <CardDescription className="text-sm text-slate-500">
              {step === 1 && 'Enter your account details'}
              {step === 2 && 'Help us personalize your experience'}
              {step === 3 && 'Set your fitness objectives'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input value={form.full_name} onChange={e => update('full_name', e.target.value)}
                      placeholder="John Doe" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                      placeholder="you@example.com" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Password</Label>
                    <Input type="password" value={form.password} onChange={e => update('password', e.target.value)}
                      placeholder="Min 8 characters" required className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Confirm Password</Label>
                    <Input type="password" value={form.confirm_password} onChange={e => update('confirm_password', e.target.value)}
                      placeholder="Repeat password" required className="h-11" />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Age</Label>
                      <Input type="number" value={form.age} onChange={e => update('age', e.target.value)}
                        placeholder="25" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Weight (kg)</Label>
                      <Input type="number" step="0.1" value={form.weight_kg} onChange={e => update('weight_kg', e.target.value)}
                        placeholder="70" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Height (cm)</Label>
                      <Input type="number" step="0.1" value={form.height_cm} onChange={e => update('height_cm', e.target.value)}
                        placeholder="175" className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Gender</Label>
                    <Select value={form.gender} onValueChange={v => update('gender', v)}>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Activity Level</Label>
                    <Select value={form.activity_level} onValueChange={v => update('activity_level', v)}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary (Desk job)</SelectItem>
                        <SelectItem value="lightly_active">Lightly Active (1-2 days/week)</SelectItem>
                        <SelectItem value="moderately_active">Moderately Active (3-5 days/week)</SelectItem>
                        <SelectItem value="very_active">Very Active (6-7 days/week)</SelectItem>
                        <SelectItem value="extra_active">Extra Active (Athlete)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Primary Fitness Goal</Label>
                    <Select value={form.fitness_goal} onValueChange={v => update('fitness_goal', v)}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lose_weight">Lose Weight</SelectItem>
                        <SelectItem value="maintain_weight">Maintain Weight</SelectItem>
                        <SelectItem value="gain_muscle">Gain Muscle</SelectItem>
                        <SelectItem value="body_recomposition">Body Recomposition</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900">
                    <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2 text-sm">Goal Summary</h4>
                    <div className="space-y-1 text-sm text-emerald-700 dark:text-emerald-400">
                      <p>Name: {form.full_name || 'Not set'}</p>
                      <p>Activity: {form.activity_level.replace('_', ' ')}</p>
                      <p>Goal: {form.fitness_goal.replace('_', ' ')}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-2">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-11">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={nextStep} className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
                  </Button>
                )}
              </div>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
