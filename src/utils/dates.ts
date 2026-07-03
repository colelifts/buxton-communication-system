const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

export function nowIso(now = new Date()): string {
  return now.toISOString();
}

export function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function daysSince(value: string | undefined, now = new Date()): number {
  const parsed = parseDate(value);
  if (!parsed) return Number.POSITIVE_INFINITY;
  return Math.floor((now.getTime() - parsed.getTime()) / dayMs);
}

export function hoursUntil(value: string | undefined, now = new Date()): number {
  const parsed = parseDate(value);
  if (!parsed) return Number.POSITIVE_INFINITY;
  return (parsed.getTime() - now.getTime()) / hourMs;
}

export function hasDate(value?: string): boolean {
  return Boolean(parseDate(value));
}
