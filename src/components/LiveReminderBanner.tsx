import React from 'react';
import {
  Bell,
  BellRing,
  CalendarPlus,
  Clock,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';
import {
  ActiveReminderAlert,
  ReminderSettings,
  ServiceItem,
} from '../types/studio';
import {
  NextAppointmentCountdown,
  formatTime12h,
} from '../utils/studioLogic';
import { StarAccent } from './StarAccent';

interface LiveReminderBannerProps {
  nextAppointment: NextAppointmentCountdown | null;
  activeAlerts: ActiveReminderAlert[];
  servicesCatalog: ServiceItem[];
  reminderSettings: ReminderSettings;
  notificationPermission: NotificationPermission | 'unsupported';
  onToggleSound: () => void;
  onRequestNotifications: () => void;
  onTestAlert: (windowType: '24h' | '1h') => void;
  onExportICS: (appointmentId: string) => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export const LiveReminderBanner: React.FC<LiveReminderBannerProps> = ({
  nextAppointment,
  activeAlerts,
  servicesCatalog,
  reminderSettings,
  notificationPermission,
  onToggleSound,
  onRequestNotifications,
  onTestAlert,
  onExportICS,
}) => {
  const serviceMap = new Map(servicesCatalog.map((s) => [s.id, s.name]));
  const alerts24h = activeAlerts.filter((a) => a.windowType === '24h');
  const alerts1h = activeAlerts.filter((a) => a.windowType === '1h');

  return (
    <section
      aria-label="Panel en vivo de próxima cita y recordatorios"
      className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-4 sm:p-6 shadow-xl border-2 border-white/80"
    >
      {/* Brand header strip + live countdown */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#0A1445]/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#0F38F5]">
            <StarAccent size={14} className="text-[#E6192E]" />
            <span>MIRADA ON POINT.</span>
            <StarAccent size={14} className="text-[#0F38F5]" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#0A1445] leading-none">
            CONTROL DE AGENDA · 13 STUDIO
          </h1>
          <p className="text-xs sm:text-sm text-[#0A1445]/75">
            Recordatorios automáticos 24h y 1h antes, avisos en navegador y exportación .ICS con doble alarma.
          </p>
        </div>

        {/* Countdown Box */}
        {nextAppointment ? (
          <div className="bg-[#0F38F5] text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/80">
                <Clock className="w-3.5 h-3.5 text-[#FFFBF2]" />
                <span>Próxima cita más cercana</span>
              </div>
              <p className="text-base font-bold text-[#FFFBF2] mt-0.5">
                {nextAppointment.appointment.clientName}
              </p>
              <p className="text-xs text-white/85 truncate max-w-[240px]">
                {nextAppointment.appointment.date} ·{' '}
                {formatTime12h(nextAppointment.appointment.time)} ·{' '}
                {nextAppointment.appointment.serviceIds
                  .map((id) => serviceMap.get(id) ?? id)
                  .join(', ')}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:border-l sm:border-white/20 sm:pl-4">
              <div className="text-center">
                <div
                  data-testid="live-countdown"
                  className="font-mono-num text-2xl sm:text-3xl font-bold tracking-tight text-white leading-none"
                >
                  {pad2(nextAppointment.hours)}:{pad2(nextAppointment.minutes)}:
                  {pad2(nextAppointment.seconds)}
                </div>
                <span className="text-[11px] font-medium text-white/80">
                  {nextAppointment.alertWindow === '1h' ||
                  nextAppointment.alertWindow === 'imminent'
                    ? 'Ventana 1h activa'
                    : nextAppointment.alertWindow === '24h'
                      ? 'Ventana 24h activa'
                      : 'Cuenta regresiva'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onExportICS(nextAppointment.appointment.id)}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-[#E6192E] hover:bg-[#C91225] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors"
                title="Descargar .ICS con alarma -24h y -1h"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>.ICS</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#F5EFE0] text-[#0A1445] rounded-2xl px-4 py-3 text-sm font-medium shrink-0">
            No hay turnos pendientes próximos. Toca una hora libre para agendar.
          </div>
        )}
      </div>

      {/* Reminder Controls & Active 24h / 1h Windows */}
      <div className="pt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Active 24h and 1h status indicators */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-semibold text-[#E6192E]">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-mono-num">
              Alerta 1h antes: {alerts1h.length}{' '}
              {alerts1h.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
          <span aria-hidden="true" className="text-[#0A1445]/30">
            |
          </span>
          <div className="flex items-center gap-2 font-semibold text-[#0F38F5]">
            <BellRing className="w-4 h-4 shrink-0" />
            <span className="font-mono-num">
              Alerta 24h antes: {alerts24h.length}{' '}
              {alerts24h.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
        </div>

        {/* Interactive Notification & Sound Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={reminderSettings.soundEnabled}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
              reminderSettings.soundEnabled
                ? 'bg-[#0A1445] text-white border-[#0A1445]'
                : 'bg-[#F5EFE0] text-[#0A1445] border-[#0A1445]/20'
            }`}
          >
            {reminderSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>
              {reminderSettings.soundEnabled ? 'Sonido activo' : 'Silenciado'}
            </span>
          </button>

          <button
            type="button"
            onClick={onRequestNotifications}
            className={`min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors whitespace-nowrap ${
              notificationPermission === 'granted'
                ? 'bg-[#0F38F5] text-white border-[#0F38F5]'
                : 'bg-white text-[#0A1445] border-[#0A1445]/25 hover:bg-[#F5EFE0]'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {notificationPermission === 'granted'
                ? 'Avisos activos'
                : notificationPermission === 'denied'
                  ? 'Modo visual'
                  : 'Activar avisos'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onTestAlert('1h')}
            className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold bg-[#E6192E] hover:bg-[#C91225] text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <BellRing className="w-4 h-4" />
            <span>Probar 1h</span>
          </button>

          <button
            type="button"
            onClick={() => onTestAlert('24h')}
            className="min-h-[40px] px-3 py-2 rounded-xl text-xs font-bold bg-[#0F38F5] hover:bg-[#0925B8] text-white flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <BellRing className="w-4 h-4" />
            <span>Probar 24h</span>
          </button>
        </div>
      </div>

      {/* Active Alert Details List when 1h or 24h appointments exist */}
      {activeAlerts.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#0A1445]/10 grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {activeAlerts.map((alert) => {
            const isUrgent = alert.windowType === '1h';
            return (
              <div
                key={alert.key}
                className={`rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-3 border ${
                  isUrgent
                    ? 'bg-[#FFF0F2] border-[#E6192E]/35 text-[#0A1445]'
                    : 'bg-[#EEF2FF] border-[#0F38F5]/25 text-[#0A1445]'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span
                      className={
                        isUrgent ? 'text-[#E6192E]' : 'text-[#0F38F5]'
                      }
                    >
                      {isUrgent ? 'RECORDATORIO 1H' : 'RECORDATORIO 24H'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-num">
                      {formatTime12h(alert.time)}
                    </span>
                  </div>
                  <p className="text-sm font-bold truncate">
                    {alert.clientName} — {alert.servicesLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onExportICS(alert.appointmentId)}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white border border-[#0A1445]/15 hover:bg-[#F5EFE0] text-xs font-bold text-[#0A1445] shrink-0"
                >
                  .ICS
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
