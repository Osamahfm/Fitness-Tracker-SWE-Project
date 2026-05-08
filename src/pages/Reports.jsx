import { useMemo, useState } from 'react';
import { useAppContext } from '../context/useAppContext';
import { CalendarDays, Download, Flame, Footprints, Search, Trash2, Timer } from 'lucide-react';
import { getUserActivityMetrics } from '../utils/userMetrics';
import { getRoleProfile } from '../utils/userRoles';

const reportsPageByRole = {
  customer: {
    dateLabel: 'Report Date',
    distanceLabel: 'Total Distance',
    durationLabel: 'Total Duration',
    caloriesLabel: 'Total Calories',
    eyebrow: 'Daily Reports',
    title: 'Saved Activity Records',
    copy: 'Review, audit, and clean up the activity history used by your dashboard.',
    canDelete: true,
    canExport: false,
    canAudit: false
  },
  trainer: {
    dateLabel: 'Review Date',
    distanceLabel: 'Client Distance',
    durationLabel: 'Client Duration',
    caloriesLabel: 'Client Calories',
    eyebrow: 'Client Analytics',
    title: 'Coaching Activity Records',
    copy: 'Filter session history, review client workload, and export coaching records.',
    canDelete: false,
    canExport: true,
    canAudit: false
  },
  admin: {
    dateLabel: 'Audit Date',
    distanceLabel: 'Stored Distance',
    durationLabel: 'Stored Duration',
    caloriesLabel: 'Calculated Calories',
    eyebrow: 'Data Reports',
    title: 'Activity Data Audit',
    copy: 'Inspect saved records, validate calculations, and export data for system checks.',
    canDelete: false,
    canExport: true,
    canAudit: true
  }
};

export default function Reports() {
  const { state, deleteActivity, showToast } = useAppContext();
  const role = getRoleProfile(state.profile.role).value;
  const pageCopy = reportsPageByRole[role] || reportsPageByRole.customer;
  const [filters, setFilters] = useState({
    search: '',
    activity: 'all',
    effort: 'all'
  });

  const metrics = getUserActivityMetrics(state.activities);
  const latestDate = metrics.latestActivity?.date || new Date().toLocaleDateString();
  const activityOptions = useMemo(
    () => [...new Set(state.activities.map((activity) => activity.label).filter(Boolean))],
    [state.activities]
  );
  const effortOptions = useMemo(
    () => [...new Set(state.activities.map((activity) => activity.effort).filter(Boolean))],
    [state.activities]
  );
  const filteredActivities = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return state.activities.filter((activity) => {
      const matchesSearch = !searchTerm
        || [activity.label, activity.date, activity.time, activity.effort]
          .some((value) => String(value || '').toLowerCase().includes(searchTerm));
      const matchesActivity = filters.activity === 'all' || activity.label === filters.activity;
      const matchesEffort = filters.effort === 'all' || activity.effort === filters.effort;

      return matchesSearch && matchesActivity && matchesEffort;
    });
  }, [filters, state.activities]);

  const filteredTotals = useMemo(() => filteredActivities.reduce(
    (totals, activity) => ({
      calories: totals.calories + Number(activity.calories || 0),
      distance: totals.distance + Number(activity.distance || 0),
      duration: totals.duration + Number(activity.duration || 0)
    }),
    { calories: 0, distance: 0, duration: 0 }
  ), [filteredActivities]);

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id);
      showToast("Activity deleted");
    } catch (error) {
      showToast(error.message, true);
    }
  };

  const exportCsv = () => {
    const header = ['Date', 'Time', 'Activity', 'Distance (km)', 'Duration (min)', 'Effort', 'Calories'];
    const rows = filteredActivities.map((activity) => [
      activity.date || latestDate,
      activity.time || '-',
      activity.label,
      activity.distance.toFixed(1),
      activity.duration,
      activity.effort,
      activity.calories
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');

    link.href = url;
    link.download = 'fitness-activity-report.csv';
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filteredActivities.length} record(s).`);
  };

  return (
    <section className="workspace">
      <div className="dashboard-grid">
        <article className="metric-card">
          <span><CalendarDays size={18} /> {pageCopy.dateLabel}</span>
          <strong>{latestDate}</strong>
          <p>Daily report generated from saved user records.</p>
        </article>
        <article className="metric-card">
          <span><Footprints size={18} /> {pageCopy.distanceLabel}</span>
          <strong>{metrics.total.distance.toFixed(1)} km</strong>
          <p>Distance from this user's manual activity entries.</p>
        </article>
        <article className="metric-card">
          <span><Timer size={18} /> {pageCopy.durationLabel}</span>
          <strong>{metrics.total.duration} min</strong>
          <p>All saved workout minutes for the current user.</p>
        </article>
        <article className="metric-card accent-card">
          <span><Flame size={18} /> {pageCopy.caloriesLabel}</span>
          <strong>{metrics.total.calories}</strong>
          <p>Calculated burned calories for the report.</p>
        </article>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <p className="eyebrow">{pageCopy.eyebrow}</p>
          <h3>{pageCopy.title}</h3>
          <p className="panel-copy">{pageCopy.copy}</p>
        </div>
        <div className="report-toolbar">
          <label className="search-field">
            <span><Search size={16} /> Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
              placeholder="Activity, date, effort"
            />
          </label>
          <label>
            <span>Activity</span>
            <select value={filters.activity} onChange={(event) => updateFilter('activity', event.target.value)}>
              <option value="all">All activities</option>
              {activityOptions.map((activity) => (
                <option key={activity} value={activity}>{activity}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Effort</span>
            <select value={filters.effort} onChange={(event) => updateFilter('effort', event.target.value)}>
              <option value="all">All effort levels</option>
              {effortOptions.map((effort) => (
                <option key={effort} value={effort}>{effort}</option>
              ))}
            </select>
          </label>
          {pageCopy.canExport && (
            <button
              className="secondary-btn toolbar-action"
              disabled={filteredActivities.length === 0}
              onClick={exportCsv}
              type="button"
            >
              <Download size={17} />
              Export CSV
            </button>
          )}
        </div>
        <div className="report-summary" aria-label="Filtered report summary">
          <span>{filteredActivities.length} record(s)</span>
          <span>{filteredTotals.distance.toFixed(1)} km</span>
          <span>{filteredTotals.duration} min</span>
          <span>{filteredTotals.calories} calories</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Activity</th>
                <th>Distance</th>
                <th>Duration</th>
                <th>Effort</th>
                <th>Calories</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.activities.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">No activity records saved yet.</div>
                  </td>
                </tr>
              ) : filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="empty-state">No records match the current filters.</div>
                  </td>
                </tr>
              ) : (
                filteredActivities.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.date || latestDate}</td>
                    <td>{activity.time || '-'}</td>
                    <td>{activity.label}</td>
                    <td>{activity.distance.toFixed(1)} km</td>
                    <td>{activity.duration} min</td>
                    <td><span className="status-badge">{activity.effort}</span></td>
                    <td><strong>{activity.calories}</strong></td>
                    <td>
                      {pageCopy.canDelete && (
                        <button
                          className="danger-action"
                          onClick={() => handleDelete(activity.id)}
                          type="button"
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
