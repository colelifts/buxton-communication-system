export type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...context
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
