import { Link } from 'react-router-dom';
import { useAppContext } from '../context/useAppContext';
import { Activity, ArrowRight, CalendarCheck2, Flame, Footprints, ShieldCheck, Target, Timer, Trophy, Zap } from 'lucide-react';
import { getActivityInsights, getDailyCalorieTarget, getUserActivityMetrics } from '../utils/userMetrics';
import { getRoleDashboardMessage, getRoleInterface, getRoleProfile } from '../utils/userRoles';

export default function Dashboard() {
  const { state } = useAppContext();

  const metrics = getUserActivityMetrics(state.activities);
  const dailyCalorieTarget = getDailyCalorieTarget(state.profile);
  const insights = getActivityInsights(state.activities, dailyCalorieTarget);
  const progress = Math.min(Math.round((metrics.today.calories / dailyCalorieTarget) * 100), 100);
  const latestActivity = metrics.latestActivity;
  const hasWeeklyData = metrics.weeklyActivity.some((day) => day.count > 0);
  const roleProfile = getRoleProfile(state.profile.role);
  const roleInterface = getRoleInterface(state.profile.role);
  const roleMessage = getRoleDashboardMessage(state.profile.role, state.profile.name);
  const metricCards = [
    {
      key: 'calories',
      Icon: Flame,
      label: roleInterface.metrics.calories.label,
      value: metrics.today.calories,
      copy: roleInterface.metrics.calories.copy(metrics.today.count),
      accent: true
    },
    {
      key: 'distance',
      Icon: Footprints,
      label: roleInterface.metrics.distance.label,
      value: `${metrics.today.distance.toFixed(1)} km`,
      copy: roleInterface.metrics.distance.copy
    },
    {
      key: 'time',
      Icon: Timer,
      label: roleInterface.metrics.time.label,
      value: `${metrics.week.duration} min`,
      copy: roleInterface.metrics.time.copy
    },
    {
      key: 'goal',
      Icon: Target,
      label: roleInterface.metrics.goal.label,
      value: state.profile.goal.replace('User ', ''),
      copy: roleInterface.metrics.goal.copy
    }
  ];

  return (
    <section className="home-screen">
      <div className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Hello, {state.profile.name}</p>
          <h3>{roleProfile.label} workspace</h3>
          <p>{roleMessage}</p>
          <span className="hero-role-tag"><ShieldCheck size={15} /> {roleProfile.description}</span>
        </div>
        <div className="activity-ring" style={{ '--progress': `${progress * 3.6}deg` }}>
          <div>
            <strong>{progress}%</strong>
            <span>today's goal</span>
          </div>
        </div>
      </div>

      <section className="role-action-grid" aria-label={`${roleProfile.label} quick actions`}>
        {roleInterface.actions.map((action) => (
          <Link key={action.to} className="role-action-card" to={action.to}>
            <div>
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </div>
            <ArrowRight size={18} />
          </Link>
        ))}
      </section>

      <section className="insight-strip" aria-label="Personal activity insights">
        <article>
          <CalendarCheck2 size={20} />
          <div>
            <span>{roleInterface.insights.activeDays}</span>
            <strong>{insights.activeDays}/7</strong>
          </div>
        </article>
        <article>
          <Trophy size={20} />
          <div>
            <span>{roleInterface.insights.bestDay}</span>
            <strong>{insights.bestDay?.calories ? `${insights.bestDay.label} ${insights.bestDay.calories}` : 'Pending'}</strong>
          </div>
        </article>
        <article>
          <Zap size={20} />
          <div>
            <span>{roleInterface.insights.streak}</span>
            <strong>{insights.streak} day{insights.streak === 1 ? '' : 's'}</strong>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        {metricCards.map(({ key, Icon, label, value, copy, accent }) => (
          <article key={key} className={`metric-card ${accent ? 'accent-card' : ''}`}>
            <span><Icon size={18} /> {label}</span>
            <strong>{value}</strong>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="workspace two-column">
        <div className="panel">
          <div className="panel-heading">
            <p className="eyebrow">{roleInterface.chart.eyebrow}</p>
            <h3>{roleInterface.chart.title}</h3>
            <p className="panel-copy">{roleInterface.chart.copy}</p>
          </div>
          <div className={`bar-chart ${hasWeeklyData ? '' : 'empty-chart'}`} aria-label="Weekly activity chart">
            {metrics.weeklyActivity.map((day) => (
              <span
                key={day.key}
                style={{ '--height': `${day.height}%` }}
                title={`${day.label}: ${day.calories} calories`}
              >
                <small>{day.label}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="panel focus-panel">
          <div className="panel-heading">
            <p className="eyebrow">{roleInterface.focus.eyebrow}</p>
            <h3>{latestActivity?.label || roleInterface.focus.emptyTitle}</h3>
          </div>
          <div className="session-card">
            <Activity size={28} />
            <div>
              <strong>{latestActivity ? `${latestActivity.calories} calories` : roleInterface.focus.emptyValue}</strong>
              <span>{latestActivity ? `${latestActivity.distance.toFixed(1)} km in ${latestActivity.duration} min` : roleInterface.focus.emptyCopy}</span>
            </div>
          </div>
          <div className="coach-card">
            <span>{roleInterface.focus.badge(insights.consistencyScore)}</span>
            <p>{insights.focusMessage}</p>
            <small>{roleInterface.focus.detail(insights)}</small>
          </div>
        </div>
      </section>
    </section>
  );
}
