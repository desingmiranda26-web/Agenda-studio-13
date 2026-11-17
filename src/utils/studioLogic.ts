import {
  ActiveReminderAlert,
  AlertWindow,
  Appointment,
  DepositMode,
  ServiceItem,
} from '../types/studio';

/**
 * Exact 13 hourly time slots from 07:00 AM to 07:00 PM (07:00 - 19:00).
 */
export const TIME_SLOTS: string[] = Array.from({ length: 13 }, (_, idx) => {
  const hour = 7 + idx;
  return `${String(hour).padStart(2, '0')}:00`;
});

export function formatTime12h(time24: string): string {
  const [hStr, mStr = '00'] = time24.split(':');
  const h = Number(hStr);
  if (Number.isNaN(h)) return time24;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${mStr} ${suffix}`;
}

export function formatCurrency(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? `$${rounded}` : `$${rounded.toFixed(2)}`;
}

export function calculateServicesTotal(
  serviceIds: string[],
  catalog: ServiceItem[]
): number {
  const map = new Map(catalog.map((s) => [s.id, s]));
  return serviceIds.reduce((sum, id) => {
    const found = map.get(id);
    return sum + (found ? found.price : 0);
  }, 0);
}

export function calculateDepositAmount(total: number, mode: DepositMode): number {
  const safeTotal = Math.max(0, total);
  switch (mode) {
    case '30%':
      return Math.round(safeTotal * 0.3 * 100) / 100;
    case '50%':
      return Math.round(safeTotal * 0.5 * 100) / 100;
    case '5$':
      return Math.min(safeTotal, 5);
    case '100%':
      return Math.round(safeTotal * 100) / 100;
    case 'pendiente':
      return 0;
  }
}

export function getAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute = 0] = timeStr.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
}

export function isSlotOccupied(
  appointments: Appointment[],
  date: string,
  time: string,
  excludeId?: string
): boolean {
  return appointments.some(
    (apt) =>
      apt.id !== excludeId &&
      apt.date === date &&
      apt.time === time &&
      apt.status !== 'cancelada'
  );
}

export function classifyAlertWindow(diffMs: number): AlertWindow {
  if (diffMs <= 0) return 'none';
  const diffMinutes = diffMs / 60000;
  if (diffMinutes <= 15) return 'imminent';
  if (diffMinutes <= 60) return '1h';
  if (diffMinutes <= 24 * 60) return '24h';
  return 'none';
}

export interface NextAppointmentCountdown {
  appointment: Appointment;
  targetDate: Date;
  diffMs: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMinutes: number;
  alertWindow: AlertWindow;
}

export function getNextUpcomingAppointment(
  appointments: Appointment[],
  now: Date
): NextAppointmentCountdown | null {
  const nowMs = now.getTime();
  const upcoming = appointments
    .filter((apt) => apt.status !== 'cancelada' && apt.status !== 'completada')
    .map((apt) => {
      const targetDate = getAppointmentDateTime(apt.date, apt.time);
      return { apt, targetDate, diffMs: targetDate.getTime() - nowMs };
    })
    .filter((item) => item.diffMs > 0)
    .sort((a, b) => a.diffMs - b.diffMs);

  if (upcoming.length === 0) return null;

  const nearest = upcoming[0];
  const totalSeconds = Math.floor(nearest.diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    appointment: nearest.apt,
    targetDate: nearest.targetDate,
    diffMs: nearest.diffMs,
    hours,
    minutes,
    seconds,
    totalMinutes: Math.ceil(nearest.diffMs / 60000),
    alertWindow: classifyAlertWindow(nearest.diffMs),
  };
}

export function getAppointmentsInAlertWindow(
  appointments: Appointment[],
  catalog: ServiceItem[],
  now: Date
): ActiveReminderAlert[] {
  const nowMs = now.getTime();
  const catalogMap = new Map(catalog.map((s) => [s.id, s.name]));
  const alerts: ActiveReminderAlert[] = [];

  for (const apt of appointments) {
    if (apt.status === 'cancelada' || apt.status === 'completada') continue;
    const target = getAppointmentDateTime(apt.date, apt.time);
    const diffMs = target.getTime() - nowMs;
    if (diffMs <= 0) continue;

    const diffMinutes = Math.ceil(diffMs / 60000);
    const windowClass = classifyAlertWindow(diffMs);

    if (windowClass === '1h' || windowClass === 'imminent') {
      alerts.push({
        key: `${apt.id}-1h`,
        appointmentId: apt.id,
        clientName: apt.clientName,
        date: apt.date,
        time: apt.time,
        windowType: '1h',
        servicesLabel: apt.serviceIds.map((id) => catalogMap.get(id) ?? id).join(', '),
        minutesRemaining: diffMinutes,
        triggeredAt: now.toISOString(),
      });
    } else if (windowClass === '24h') {
      alerts.push({
        key: `${apt.id}-24h`,
        appointmentId: apt.id,
        clientName: apt.clientName,
        date: apt.date,
        time: apt.time,
        windowType: '24h',
        servicesLabel: apt.serviceIds.map((id) => catalogMap.get(id) ?? id).join(', '),
        minutesRemaining: diffMinutes,
        triggeredAt: now.toISOString(),
      });
    }
  }

  return alerts.sort((a, b) => a.minutesRemaining - b.minutesRemaining);
}

function formatICSDateUTC(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/**
 * Generates an RFC 5545 .ics calendar payload with dual VALARM triggers:
 * -P1D (24 hours before) and -PT1H (1 hour before).
 */
export function generateAppointmentICS(
  appointment: Appointment,
  catalog: ServiceItem[]
): string {
  const start = getAppointmentDateTime(appointment.date, appointment.time);
  const serviceDetails = appointment.serviceIds
    .map((id) => catalog.find((s) => s.id === id))
    .filter((s): s is ServiceItem => Boolean(s));

  const totalDurationMinutes =
    serviceDetails.reduce((sum, s) => sum + s.durationMinutes, 0) || 60;
  const end = new Date(start.getTime() + totalDurationMinutes * 60000);

  const servicesSummary =
    serviceDetails.map((s) => `${s.name} ($${s.price})`).join(' + ') || 'Cita Studio 13';
  const summary = `13 STUDIO · ${appointment.clientName} — ${serviceDetails.map((s) => s.name).join(', ') || 'Turno'}`;
  const description = [
    `Clienta: ${appointment.clientName}`,
    `Teléfono: ${appointment.clientPhone || 'No registrado'}`,
    `Servicios: ${servicesSummary}`,
    `Total: ${formatCurrency(appointment.totalAmount)} | Pagado: ${formatCurrency(appointment.amountPaid)}`,
    `Normas Studio 13: Máx 10 min de espera. Sin niños ni acompañantes. Enviar referencia antes de asistir. Tu mirada, tus reglas.`,
  ].join('\n');

  const nowStamp = formatICSDateUTC(new Date());
  const uid = `${appointment.id}@studio13.app`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//13 STUDIO//Mirada On Point//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${formatICSDateUTC(start)}`,
    `DTEND:${formatICSDateUTC(end)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    'LOCATION:13 STUDIO',
    'STATUS:CONFIRMED',
    // Alarma 1: 24 horas antes
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio 24h · Cita en 13 STUDIO mañana',
    'TRIGGER:-P1D',
    'END:VALARM',
    // Alarma 2: 1 hora antes
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio 1h · Tu cita en 13 STUDIO inicia en 1 hora',
    'TRIGGER:-PT1H',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}
