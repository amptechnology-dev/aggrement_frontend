import type { RentPeriod } from "@/types/agreement.types";

export const todayIso = (): string => new Date().toISOString().slice(0, 10);

export const findNextIncrease = (schedule: RentPeriod[] | undefined): RentPeriod | null => {
  if (!schedule) return null;
  const today = todayIso();
  return schedule.find((p) => p.from > today) ?? null;
};