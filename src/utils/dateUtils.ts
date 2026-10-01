export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateReadable(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTime12h(time24: string): string {
  if (!time24) return '';
  const [hoursStr, minutesStr] = time24.split(':');
  let h = parseInt(hoursStr, 10);
  const m = parseInt(minutesStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  const mm = String(m).padStart(2, '0');
  return `${h}:${mm} ${ampm}`;
}

export function calculateDurationFromTimes(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (endMinutes <= startMinutes) {
    return 0;
  }
  return endMinutes - startMinutes;
}

export function timeToMinutes(time24: string): number {
  if (!time24) return 0;
  const [h, m] = time24.split(':').map(Number);
  return (isNaN(h) ? 0 : h * 60) + (isNaN(m) ? 0 : m);
}

export function checkTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  // Overlap if max(aStart, bStart) < min(aEnd, bEnd)
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

export function formatSecondsToHHMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getWeekDays(referenceDateStr: string): { dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] {
  const [year, month, day] = referenceDateStr.split('-').map(Number);
  const ref = new Date(year, month - 1, day);
  
  // Find Monday of the current week (ISO: Monday is 1, Sunday is 0)
  const currentDayOfWeek = ref.getDay(); // 0 is Sunday, 1 is Monday...
  const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + distanceToMonday);

  const todayStr = getTodayDateString();
  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dt}`;

    weekDays.push({
      dateStr,
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: dateStr === todayStr,
    });
  }

  return weekDays;
}

export function addDaysToDateString(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dt = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dt}`;
}

export function getNextWeekendDates(): { saturday: string; sunday: string } {
  const today = new Date();
  const day = today.getDay(); // 0 is Sunday, 6 is Saturday
  const diffToSat = (6 - day + 7) % 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + (diffToSat === 0 ? 7 : diffToSat));
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dt}`;
  };

  return { saturday: format(sat), sunday: format(sun) };
}
