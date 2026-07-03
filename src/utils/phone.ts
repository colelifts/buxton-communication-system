export function normalizePhone(phone?: string): string {
  if (!phone) return "";
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.slice(1).replace(/\D/g, "")}`;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export function samePhone(a?: string, b?: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
