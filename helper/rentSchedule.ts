import type { RentPeriod } from "@/types/agreement.types";

const DAY_MS = 24 * 60 * 60 * 1000;

const parseDate = (value: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
};

const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * DAY_MS);

const addYears = (d: Date, n: number): Date => {
  const r = new Date(d.getTime());
  r.setUTCFullYear(r.getUTCFullYear() + n);
  if (r.getUTCDate() !== d.getUTCDate()) r.setUTCDate(0);
  return r;
};

const iso = (d: Date): string => d.toISOString().slice(0, 10);
const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface ScheduleInput {
  monthlyRent: string;
  effectiveFrom: string;
  validityYears: string;
  rentIncreaseEveryYears: string;
  rentIncreasePercent: string;
}

export interface SchedulePreview {
  endDate: string;
  periods: RentPeriod[];
}

export const previewSchedule = (input: ScheduleInput): SchedulePreview | null => {
  const start = parseDate(input.effectiveFrom);
  const rent = Number(input.monthlyRent);
  const years = Number(input.validityYears);
  const every = Number(input.rentIncreaseEveryYears);
  const percent = Number(input.rentIncreasePercent);

  if (!start || !(rent > 0) || !Number.isInteger(years) || years < 1 || years > 99) return null;
  if (!Number.isFinite(every) || !Number.isFinite(percent) || every < 0 || percent < 0) return null;

  const end = addDays(addYears(start, years), -1);

  if (!(every > 0) || !(percent > 0)) {
    return {
      endDate: iso(end),
      periods: [{ period: 1, from: iso(start), to: iso(end), monthlyRent: round2(rent), increasePercent: 0 }],
    };
  }

  const periods: RentPeriod[] = [];
  for (let i = 0; i < 100; i++) {
    const from = i === 0 ? start : addYears(start, every * i);
    if (from > end) break;
    const lastDay = addDays(addYears(start, every * (i + 1)), -1);
    periods.push({
      period: i + 1,
      from: iso(from),
      to: iso(lastDay > end ? end : lastDay),
      monthlyRent: round2(rent * Math.pow(1 + percent / 100, i)),
      increasePercent: i === 0 ? 0 : percent,
    });
  }
  return { endDate: iso(end), periods };
};