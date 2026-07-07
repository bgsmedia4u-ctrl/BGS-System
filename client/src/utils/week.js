/**
 * Week boundary helpers for academic week (Monday to Saturday).
 */

export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const diff = day === 0 ? -6 : 1 - day; // if Sunday, go back 6 days
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatWeekLabel(weekStart) {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 5); // Saturday

  const opts = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-IN', opts);
  const endStr = end.toLocaleDateString('en-IN', { ...opts, year: 'numeric' });

  return `${startStr} – ${endStr}`;
}

export function isWithinEditWindow(weekStartDate) {
  const currentWeekStart = getWeekStart();
  const reportWeekStart = new Date(weekStartDate);
  reportWeekStart.setHours(0, 0, 0, 0);
  return reportWeekStart.getTime() === currentWeekStart.getTime();
}

export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
