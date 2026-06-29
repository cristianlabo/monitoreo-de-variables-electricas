/** Argentina (UTC-3). Usar siempre en SSR y cliente para evitar mostrar UTC en Vercel. */
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";

const baseOptions: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  hour12: false,
};

export function formatDateTime(
  value: string | number | Date
): string {
  return new Date(value).toLocaleString("es-AR", {
    ...baseOptions,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatDateTimeShort(
  value: string | number | Date
): string {
  return new Date(value).toLocaleString("es-AR", {
    ...baseOptions,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(
  value: string | number | Date
): string {
  return new Date(value).toLocaleDateString("es-AR", {
    ...baseOptions,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(
  value: string | number | Date
): string {
  return new Date(value).toLocaleTimeString("es-AR", {
    ...baseOptions,
    hour: "2-digit",
    minute: "2-digit",
  });
}
