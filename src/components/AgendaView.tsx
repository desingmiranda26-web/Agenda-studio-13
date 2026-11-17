import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  CheckCircle2,
  CreditCard,
  Phone,
  Plus,
  XCircle,
} from 'lucide-react';
import { Appointment, ServiceItem } from '../types/studio';
import {
  TIME_SLOTS,
  formatCurrency,
  formatTime12h,
} from '../utils/studioLogic';
import { formatLocalDateISO } from '../data/studioData';
import { StarAccent } from './StarAccent';

interface AgendaViewProps {
  appointments: Appointment[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  servicesCatalog: ServiceItem[];
  onBookFreeSlot: (date: string, time: string) => void;
  onMarkCompleted: (id: string) => void;
  onRegisterFullPayment: (id: string) => void;
  onCancelAppointment: (id: string) => void;
  onExportICS: (id: string) => void;
}

const DAY_NAMES_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const AgendaView: React.FC<AgendaViewProps> = ({
  appointments,
  selectedDate,
  onSelectDate,
  servicesCatalog,
  onBookFreeSlot,
  onMarkCompleted,
  onRegisterFullPayment,
  onCancelAppointment,
  onExportICS,
}) => {
  const [subView, setSubView] = useState<'dia' | 'lista'>('dia');

  const serviceMap = useMemo(
    () => new Map(servicesCatalog.map((s) => [s.id, s])),
    [servicesCatalog]
  );

  const upcomingDays = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return {
        iso: formatLocalDateISO(d),
        dayLabel: i === 0 ? 'Hoy' : i === 1 ? 'Mañana' : DAY_NAMES_ES[d.getDay()],
        dayNumber: d.getDate(),
      };
    });
  }, []);

  const dayAppointments = useMemo(
    () =>
      appointments.filter(
        (apt) => apt.date === selectedDate && apt.status !== 'cancelada'
      ),
    [appointments, selectedDate]
  );

  const slotMap = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const apt of dayAppointments) {
      map.set(apt.time, apt);
    }
    return map;
  }, [dayAppointments]);

  const stats = useMemo(() => {
    const occupiedCount = TIME_SLOTS.filter((t) => slotMap.has(t)).length;
    const freeCount = TIME_SLOTS.length - occupiedCount;
    const collected = dayAppointments.reduce((s, a) => s + a.amountPaid, 0);
    const pending = dayAppointments.reduce(
      (s, a) => s + Math.max(0, a.totalAmount - a.amountPaid),
      0
    );
    return { occupiedCount, freeCount, collected, pending };
  }, [dayAppointments, slotMap]);

  const allSortedAppointments = useMemo(() => {
    return [...appointments]
      .filter((a) => a.status !== 'cancelada')
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }, [appointments]);

  const renderAppointmentCard = (apt: Appointment, showDate: boolean) => {
    const pendingBalance = Math.max(0, apt.totalAmount - apt.amountPaid);
    const servicesText = apt.serviceIds
      .map((id) => serviceMap.get(id)?.name ?? id)
      .join(' + ');

    return (
      <div
        key={apt.id}
        data-testid={`appointment-card-${apt.id}`}
        className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-4 shadow-md border border-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="font-mono-num text-sm text-[#0F38F5]">
              {formatTime12h(apt.time)}
            </span>
            {showDate && (
              <>
                <span aria-hidden="true" className="text-[#0A1445]/30">
                  ·
                </span>
                <span className="font-mono-num text-[#0A1445]/80">
                  {apt.date}
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-[#0A1445]/30">
              ·
            </span>
            <span
              className={
                apt.status === 'completada'
                  ? 'text-emerald-700'
                  : apt.status === 'abonada'
                    ? 'text-[#0F38F5]'
                    : 'text-[#E6192E]'
              }
            >
              {apt.status === 'completada'
                ? 'Completada'
                : apt.status === 'abonada'
                  ? 'Abono registrado'
                  : 'Confirmada'}
            </span>
          </div>

          <h3 className="text-lg font-extrabold text-[#0A1445] leading-tight">
            {apt.clientName}
          </h3>

          <p className="text-sm font-medium text-[#0A1445]/85">
            {servicesText}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#0A1445]/70">
            {apt.clientPhone && (
              <span className="inline-flex items-center gap-1 font-mono-num">
                <Phone className="w-3.5 h-3.5" />
                {apt.clientPhone}
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono-num font-semibold text-[#0A1445]">
              Total: {formatCurrency(apt.totalAmount)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-emerald-700 font-semibold">
              Pagado: {formatCurrency(apt.amountPaid)}
            </span>
            {pendingBalance > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono-num text-[#E6192E] font-bold">
                  Resta: {formatCurrency(pendingBalance)}
                </span>
              </>
            )}
          </div>

          {apt.notes && (
            <p className="text-xs text-[#0A1445]/65 italic">
              Nota: {apt.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {pendingBalance > 0 && apt.status !== 'completada' && (
            <button
              type="button"
              onClick={() => onRegisterFullPayment(apt.id)}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-[#0F38F5] hover:bg-[#0925B8] text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Liquidar {formatCurrency(pendingBalance)}</span>
            </button>
          )}

          {apt.status !== 'completada' && (
            <button
              type="button"
              onClick={() => onMarkCompleted(apt.id)}
              className="min-h-[40px] px-3 py-2 rounded-xl bg-[#F5EFE0] hover:bg-[#EAE0CA] text-[#0A1445] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Completar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onExportICS(apt.id)}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#0A1445]/20 hover:bg-[#F5EFE0] text-[#0A1445] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            aria-label={`Exportar cita de ${apt.clientName} a archivo .ICS`}
          >
            <CalendarPlus className="w-3.5 h-3.5 text-[#0F38F5]" />
            <span>.ICS</span>
          </button>

          <button
            type="button"
            onClick={() => onCancelAppointment(apt.id)}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-white border border-[#E6192E]/25 hover:bg-[#FFF0F2] text-[#E6192E] text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            aria-label={`Cancelar cita de ${apt.clientName}`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Liberar</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-4 shadow-md">
          <p className="text-xs font-semibold text-[#0A1445]/65 uppercase tracking-wide">
            Citas del día
          </p>
          <p className="font-display text-3xl font-bold font-mono-num text-[#0F38F5] mt-1">
            {stats.occupiedCount}
          </p>
        </div>
        <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-4 shadow-md">
          <p className="text-xs font-semibold text-[#0A1445]/65 uppercase tracking-wide">
            Horas libres (7am–7pm)
          </p>
          <p className="font-display text-3xl font-bold font-mono-num text-[#0A1445] mt-1">
            {stats.freeCount}
          </p>
        </div>
        <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-4 shadow-md">
          <p className="text-xs font-semibold text-[#0A1445]/65 uppercase tracking-wide">
            Cobrado en fecha
          </p>
          <p className="font-display text-3xl font-bold font-mono-num text-emerald-700 mt-1">
            {formatCurrency(stats.collected)}
          </p>
        </div>
        <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-4 shadow-md">
          <p className="text-xs font-semibold text-[#0A1445]/65 uppercase tracking-wide">
            Saldo por cobrar
          </p>
          <p className="font-display text-3xl font-bold font-mono-num text-[#E6192E] mt-1">
            {formatCurrency(stats.pending)}
          </p>
        </div>
      </div>

      {/* Date Scroller & Sub-View Switcher */}
      <div className="bg-[#0925B8]/60 border border-white/20 rounded-3xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <StarAccent size={16} className="text-white" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#FFFBF2] tracking-wide">
              HORARIOS 7:00 AM — 7:00 PM
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-[#0A1445]/40 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setSubView('dia')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  subView === 'dia'
                    ? 'bg-[#FFFBF2] text-[#0A1445]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Vista Día (7am–7pm)
              </button>
              <button
                type="button"
                onClick={() => setSubView('lista')}
                className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  subView === 'lista'
                    ? 'bg-[#FFFBF2] text-[#0A1445]'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Todas ({allSortedAppointments.length})
              </button>
            </div>

            <label className="relative flex items-center">
              <span className="sr-only">Seleccionar fecha</span>
              <Calendar className="w-4 h-4 text-[#0A1445] absolute left-3 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) onSelectDate(e.target.value);
                }}
                className="min-h-[40px] pl-9 pr-3 py-1.5 rounded-xl bg-[#FFFBF2] text-[#0A1445] text-xs font-bold font-mono-num border border-white focus-visible:outline-2 focus-visible:outline-[#E6192E]"
              />
            </label>
          </div>
        </div>

        {/* Horizontal 7-Day Selector */}
        {subView === 'dia' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {upcomingDays.map((day) => {
              const isSelected = day.iso === selectedDate;
              return (
                <button
                  key={day.iso}
                  type="button"
                  onClick={() => onSelectDate(day.iso)}
                  className={`min-h-[52px] min-w-[74px] px-3 py-2 rounded-2xl flex flex-col items-center justify-center transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-[#E6192E] text-white border-[#E6192E] shadow-lg'
                      : 'bg-[#FFFBF2]/10 text-white border-white/20 hover:bg-[#FFFBF2]/20'
                  }`}
                >
                  <span className="text-[11px] font-semibold opacity-90">
                    {day.dayLabel}
                  </span>
                  <span className="font-mono-num text-base font-bold">
                    {day.dayNumber}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Timeline or All List */}
      {subView === 'dia' ? (
        <div
          data-testid="day-timeline"
          className="space-y-3"
        >
          {TIME_SLOTS.map((slot) => {
            const booked = slotMap.get(slot);
            if (booked) {
              return (
                <div key={slot} data-testid={`slot-${slot}`}>
                  {renderAppointmentCard(booked, false)}
                </div>
              );
            }

            return (
              <button
                key={slot}
                type="button"
                data-testid={`slot-${slot}`}
                onClick={() => onBookFreeSlot(selectedDate, slot)}
                className="w-full min-h-[58px] px-3.5 sm:px-4 py-3 rounded-2xl bg-[#FFFBF2]/12 hover:bg-[#FFFBF2]/22 border border-dashed border-white/35 text-left flex items-center justify-between gap-3 transition-all group"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span className="font-mono-num text-sm sm:text-base font-bold text-white w-20 sm:w-24 shrink-0">
                    {formatTime12h(slot)}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-white/85 truncate">
                    Disponible · Toca para agendar
                  </span>
                </div>
                <span className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#E6192E] group-hover:bg-[#C91225] text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agendar</span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {allSortedAppointments.length === 0 ? (
            <div className="bg-[#FFFBF2] text-[#0A1445] rounded-2xl p-8 text-center">
              <p className="font-bold text-base">
                Aún no hay citas activas registradas.
              </p>
              <button
                type="button"
                onClick={() => onBookFreeSlot(selectedDate, '10:00')}
                className="mt-4 px-5 py-3 rounded-xl bg-[#E6192E] text-white text-sm font-bold"
              >
                AGENDAR PRIMERA CITA
              </button>
            </div>
          ) : (
            allSortedAppointments.map((apt) => renderAppointmentCard(apt, true))
          )}
        </div>
      )}
    </div>
  );
};
