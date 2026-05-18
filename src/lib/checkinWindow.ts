export type CheckinWindow = {
  quarter: 1 | 2 | 3 | 4;
  label: string;
  start: Date;
  end: Date;
};

function atStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getCheckinWindows(cycleYear: number): CheckinWindow[] {
  return [
    {
      quarter: 1,
      label: "Q1",
      start: new Date(cycleYear, 6, 1), // Jul 1
      end: new Date(cycleYear, 6, 31, 23, 59, 59, 999), // Jul 31
    },
    {
      quarter: 2,
      label: "Q2",
      start: new Date(cycleYear, 9, 1), // Oct 1
      end: new Date(cycleYear, 9, 31, 23, 59, 59, 999), // Oct 31
    },
    {
      quarter: 3,
      label: "Q3",
      start: new Date(cycleYear + 1, 0, 1), // Jan 1
      end: new Date(cycleYear + 1, 0, 31, 23, 59, 59, 999), // Jan 31
    },
    {
      quarter: 4,
      label: "Q4",
      start: new Date(cycleYear + 1, 2, 1), // Mar 1
      end: new Date(cycleYear + 1, 3, 30, 23, 59, 59, 999), // Apr 30
    },
  ];
}

export function getCurrentCheckinWindow(cycleYear: number, now = new Date()) {
  const ts = now.getTime();
  return getCheckinWindows(cycleYear).find((w) => ts >= w.start.getTime() && ts <= w.end.getTime()) ?? null;
}

export function canSubmitQuarter(cycleYear: number, quarter: number, now = new Date()) {
  const win = getCurrentCheckinWindow(cycleYear, now);
  return Boolean(win && win.quarter === quarter);
}

export function formatWindow(window: CheckinWindow) {
  const s = atStartOfDay(window.start).toLocaleDateString();
  const e = atStartOfDay(window.end).toLocaleDateString();
  return `${window.label}: ${s} - ${e}`;
}

