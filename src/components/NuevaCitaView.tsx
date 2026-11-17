import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { STUDIO_RULES } from '../data/studioData';
import {
  Appointment,
  DepositMode,
  PaymentMethod,
  ServiceCategory,
  ServiceItem,
} from '../types/studio';
import {
  TIME_SLOTS,
  calculateDepositAmount,
  calculateServicesTotal,
  formatCurrency,
  formatTime12h,
  isSlotOccupied,
} from '../utils/studioLogic';
import { StarAccent } from './StarAccent';

interface NuevaCitaViewProps {
  servicesCatalog: ServiceItem[];
  appointments: Appointment[];
  initialDate: string;
  initialTime: string;
  selectedServiceIds: string[];
  onChangeSelectedServiceIds: (ids: string[]) => void;
  onCreateAppointment: (
    appointment: Appointment,
    autoDownloadICS: boolean
  ) => void;
}

const DEPOSIT_OPTIONS: { mode: DepositMode; label: string }[] = [
  { mode: '30%', label: '30%' },
  { mode: '50%', label: '50%' },
  { mode: '5$', label: '$5 fijo' },
  { mode: '100%', label: '100%' },
  { mode: 'pendiente', label: 'Pendiente' },
];

const CATEGORIES: { id: ServiceCategory; title: string }[] = [
  { id: 'cejas', title: 'Cejas' },
  { id: 'pestanas', title: 'Pestañas' },
  { id: 'depilacion', title: 'Depilación (Depi sin drama)' },
];

export const NuevaCitaView: React.FC<NuevaCitaViewProps> = ({
  servicesCatalog,
  appointments,
  initialDate,
  initialTime,
  selectedServiceIds,
  onChangeSelectedServiceIds,
  onCreateAppointment,
}) => {
  const [date, setDate] = useState<string>(initialDate);
  const [time, setTime] = useState<string>(initialTime);
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [depositMode, setDepositMode] = useState<DepositMode>('50%');
  const [paymentFlow, setPaymentFlow] = useState<'directo' | 'pasarela'>('directo');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pago_movil');
  const [manualReference, setManualReference] = useState<string>('');
  const [directPaidChecked, setDirectPaidChecked] = useState<boolean>(true);

  // Simulated gateway fields
  const [gatewayChannel, setGatewayChannel] = useState<
    'tarjeta' | 'pago_movil' | 'zelle'
  >('pago_movil');
  const [gatewayInput, setGatewayInput] = useState<string>('');
  const [gatewayProcessing, setGatewayProcessing] = useState<boolean>(false);
  const [gatewayApprovedRef, setGatewayApprovedRef] = useState<string | null>(
    null
  );

  const [rulesAccepted, setRulesAccepted] = useState<boolean>(false);
  const [downloadICSOnConfirm, setDownloadICSOnConfirm] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setDate(initialDate);
  }, [initialDate]);

  useEffect(() => {
    setTime(initialTime);
  }, [initialTime]);

  const totalAmount = useMemo(
    () => calculateServicesTotal(selectedServiceIds, servicesCatalog),
    [selectedServiceIds, servicesCatalog]
  );

  const depositAmount = useMemo(
    () => calculateDepositAmount(totalAmount, depositMode),
    [totalAmount, depositMode]
  );

  // Reset simulated approval if deposit amount changes
  useEffect(() => {
    setGatewayApprovedRef(null);
  }, [depositAmount, depositMode, paymentFlow]);

  const selectedSlotOccupied = useMemo(
    () => isSlotOccupied(appointments, date, time),
    [appointments, date, time]
  );

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      onChangeSelectedServiceIds(selectedServiceIds.filter((s) => s !== id));
    } else {
      onChangeSelectedServiceIds([...selectedServiceIds, id]);
    }
    setFormError(null);
  };

  const handleSimulateGateway = () => {
    if (depositAmount <= 0) return;
    setFormError(null);
    setGatewayProcessing(true);
    setTimeout(() => {
      const prefix =
        gatewayChannel === 'tarjeta'
          ? 'CARD'
          : gatewayChannel === 'pago_movil'
            ? 'PM'
            : 'ZELLE';
      const code = `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
      setGatewayApprovedRef(code);
      setGatewayProcessing(false);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedServiceIds.length === 0) {
      setFormError('Selecciona al menos un servicio del menú de 13 STUDIO.');
      return;
    }

    if (!date || !time) {
      setFormError('Elige una fecha y un horario disponible (7:00 AM – 7:00 PM).');
      return;
    }

    if (isSlotOccupied(appointments, date, time)) {
      setFormError(
        `El turno de las ${formatTime12h(time)} ya está ocupado en esa fecha. Elige otra hora disponible.`
      );
      return;
    }

    if (!clientName.trim()) {
      setFormError('Ingresa el nombre de la clienta para registrar el turno.');
      return;
    }

    if (
      depositMode !== 'pendiente' &&
      paymentFlow === 'pasarela' &&
      !gatewayApprovedRef
    ) {
      setFormError(
        'Procesa el cobro en la pasarela simulada antes de agendar o cambia a abono directo.'
      );
      return;
    }

    if (!rulesAccepted) {
      setFormError(
        'Debes confirmar la aceptación obligatoria de las normas de 13 STUDIO antes de agendar.'
      );
      return;
    }

    let finalPaid = 0;
    let finalMethod: PaymentMethod = paymentMethod;
    let finalRef = manualReference.trim() || undefined;

    if (depositMode !== 'pendiente') {
      if (paymentFlow === 'pasarela' && gatewayApprovedRef) {
        finalPaid = depositAmount;
        finalMethod = gatewayChannel;
        finalRef = gatewayApprovedRef;
      } else if (paymentFlow === 'directo' && directPaidChecked) {
        finalPaid = depositAmount;
      }
    }

    const status =
      finalPaid >= totalAmount && totalAmount > 0
        ? 'confirmada'
        : finalPaid > 0
          ? 'abonada'
          : 'confirmada';

    const newAppointment: Appointment = {
      id: `apt-${Date.now()}`,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      date,
      time,
      serviceIds: [...selectedServiceIds],
      totalAmount,
      depositMode,
      depositAmount,
      amountPaid: finalPaid,
      paymentMethod: finalMethod,
      paymentReference: finalRef,
      status,
      notes: notes.trim() || undefined,
      rulesAccepted: true,
      createdAt: new Date().toISOString(),
    };

    onCreateAppointment(newAppointment, downloadICSOnConfirm);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-white/90">
          <StarAccent size={14} className="text-white" />
          <span>NUEVA RESERVA</span>
          <StarAccent size={14} className="text-[#E6192E]" />
        </div>
        <h2 className="font-display text-4xl sm:text-5xl font-bold text-[#FFFBF2] mt-1 leading-none">
          REGISTRAR CITA · 13 STUDIO
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Services & Date/Time */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Services */}
          <section className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-5">
            <div className="flex items-center justify-between gap-2 border-b border-[#0A1445]/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-[#0F38F5]">
                  01. MENÚ DE SERVICIOS
                </h3>
                <p className="text-xs text-[#0A1445]/70">
                  Elige uno o varios servicios para calcular el monto exacto.
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-[#0A1445]/60 block">
                  Total estimado
                </span>
                <span className="font-display text-3xl font-bold font-mono-num text-[#E6192E]">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {CATEGORIES.map((cat) => {
                const items = servicesCatalog.filter(
                  (s) => s.category === cat.id
                );
                return (
                  <div key={cat.id} className="space-y-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0A1445]/75">
                      {cat.title}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {items.map((service) => {
                        const selected = selectedServiceIds.includes(service.id);
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() => toggleService(service.id)}
                            aria-pressed={selected}
                            className={`min-h-[60px] p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all ${
                              selected
                                ? 'bg-[#0F38F5] text-white border-[#0F38F5] shadow-md'
                                : 'bg-[#F5EFE0]/70 text-[#0A1445] border-[#0A1445]/12 hover:border-[#0F38F5]/50'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {selected && (
                                  <Check className="w-4 h-4 shrink-0 text-[#FFD5DA]" />
                                )}
                                <span className="text-sm font-bold truncate">
                                  {service.name}
                                </span>
                              </div>
                              <p
                                className={`text-xs truncate mt-0.5 ${
                                  selected ? 'text-white/80' : 'text-[#0A1445]/70'
                                }`}
                              >
                                {service.description}
                              </p>
                            </div>
                            <span
                              className={`font-display text-2xl font-bold font-mono-num shrink-0 ${
                                selected ? 'text-white' : 'text-[#E6192E]'
                              }`}
                            >
                              {service.price}$
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Step 2: Date & 7am-7pm Slots */}
          <section className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#0A1445]/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-bold text-[#0F38F5]">
                  02. FECHA Y HORARIO (7:00 AM – 7:00 PM)
                </h3>
                <p className="text-xs text-[#0A1445]/70">
                  13 bloques exactos cada hora. Los turnos ocupados aparecen bloqueados.
                </p>
              </div>
              <label className="relative flex items-center shrink-0">
                <span className="sr-only">Fecha de la cita</span>
                <Calendar className="w-4 h-4 text-[#0F38F5] absolute left-3 pointer-events-none" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                  className="min-h-[42px] pl-9 pr-3 py-1.5 rounded-xl bg-[#F5EFE0] text-[#0A1445] text-xs font-bold font-mono-num border border-[#0A1445]/15 focus-visible:outline-2 focus-visible:outline-[#0F38F5]"
                />
              </label>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {TIME_SLOTS.map((slot) => {
                const occupied = isSlotOccupied(appointments, date, slot);
                const active = time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={occupied}
                    onClick={() => {
                      setTime(slot);
                      setFormError(null);
                    }}
                    className={`min-h-[48px] px-2 py-2 rounded-xl text-xs font-bold font-mono-num border transition-all flex flex-col items-center justify-center ${
                      occupied
                        ? 'bg-[#0A1445]/8 text-[#0A1445]/40 border-[#0A1445]/10 cursor-not-allowed line-through'
                        : active
                          ? 'bg-[#E6192E] text-white border-[#E6192E] shadow-md'
                          : 'bg-white text-[#0A1445] border-[#0A1445]/20 hover:border-[#0F38F5]'
                    }`}
                  >
                    <span>{formatTime12h(slot)}</span>
                    {occupied && (
                      <span className="text-[10px] font-sans no-underline">
                        Ocupado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedSlotOccupied && (
              <p className="text-xs font-bold text-[#E6192E]">
                El horario seleccionado está ocupado en {date}. Elige un bloque libre.
              </p>
            )}
          </section>
        </div>

        {/* Right Column: Client, Deposit/Gateway, Rules & Confirm */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 3: Client Details */}
          <section className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-4">
            <h3 className="font-display text-2xl font-bold text-[#0F38F5] border-b border-[#0A1445]/10 pb-2">
              03. DATOS DE LA CLIENTA
            </h3>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="client-name"
                  className="block text-xs font-bold text-[#0A1445] mb-1"
                >
                  Nombre de la clienta *
                </label>
                <input
                  id="client-name"
                  type="text"
                  required
                  placeholder="Ej. Valeria Gómez"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#0A1445]/20 text-sm font-medium text-[#0A1445] placeholder:text-[#0A1445]/40 focus:outline-2 focus:outline-[#0F38F5]"
                />
              </div>

              <div>
                <label
                  htmlFor="client-phone"
                  className="block text-xs font-bold text-[#0A1445] mb-1"
                >
                  WhatsApp / Teléfono
                </label>
                <input
                  id="client-phone"
                  type="tel"
                  placeholder="Ej. +58 412-555-1313"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#0A1445]/20 text-sm font-mono-num text-[#0A1445] placeholder:text-[#0A1445]/40 focus:outline-2 focus:outline-[#0F38F5]"
                />
              </div>

              <div>
                <label
                  htmlFor="client-notes"
                  className="block text-xs font-bold text-[#0A1445] mb-1"
                >
                  Referencia / Notas del diseño
                </label>
                <textarea
                  id="client-notes"
                  rows={2}
                  placeholder="Ej. Envió referencia ojo de gato natural por WhatsApp"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#0A1445]/20 text-sm text-[#0A1445] placeholder:text-[#0A1445]/40 focus:outline-2 focus:outline-[#0F38F5]"
                />
              </div>
            </div>
          </section>

          {/* Step 4: Deposits & Simulated Payment Gateway */}
          <section className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#0A1445]/10 pb-2">
              <h3 className="font-display text-2xl font-bold text-[#0F38F5]">
                04. ANTICIPO Y PAGO
              </h3>
              <span className="font-display text-2xl font-bold font-mono-num text-[#E6192E]">
                {formatCurrency(depositAmount)}
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-[#0A1445]/75 mb-2">
                Cálculo automático de anticipo:
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {DEPOSIT_OPTIONS.map((opt) => {
                  const active = depositMode === opt.mode;
                  return (
                    <button
                      key={opt.mode}
                      type="button"
                      onClick={() => setDepositMode(opt.mode)}
                      className={`min-h-[40px] px-1 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        active
                          ? 'bg-[#0F38F5] text-white border-[#0F38F5]'
                          : 'bg-[#F5EFE0] text-[#0A1445] border-[#0A1445]/15 hover:bg-[#EAE0CA]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {depositMode !== 'pendiente' && depositAmount > 0 && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5EFE0] rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaymentFlow('directo')}
                    className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      paymentFlow === 'directo'
                        ? 'bg-white text-[#0A1445] shadow-sm'
                        : 'text-[#0A1445]/70'
                    }`}
                  >
                    Abono directo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentFlow('pasarela')}
                    className={`min-h-[38px] px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      paymentFlow === 'pasarela'
                        ? 'bg-white text-[#0A1445] shadow-sm'
                        : 'text-[#0A1445]/70'
                    }`}
                  >
                    Pasarela simulada
                  </button>
                </div>

                {paymentFlow === 'directo' ? (
                  <div className="rounded-2xl bg-[#F5EFE0]/70 p-3.5 space-y-3 border border-[#0A1445]/10">
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: 'pago_movil', label: 'Pago Móvil' },
                          { id: 'zelle', label: 'Zelle' },
                          { id: 'efectivo', label: 'Efectivo' },
                          { id: 'tarjeta', label: 'Tarjeta' },
                        ] as { id: PaymentMethod; label: string }[]
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPaymentMethod(m.id)}
                          className={`min-h-[38px] px-2.5 py-1.5 rounded-xl text-xs font-bold border ${
                            paymentMethod === m.id
                              ? 'bg-[#0A1445] text-white border-[#0A1445]'
                              : 'bg-white text-[#0A1445] border-[#0A1445]/15'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Referencia (opcional)"
                      value={manualReference}
                      onChange={(e) => setManualReference(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#0A1445]/15 text-xs font-mono-num"
                    />

                    <label className="flex items-center gap-2 text-xs font-semibold text-[#0A1445] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={directPaidChecked}
                        onChange={(e) => setDirectPaidChecked(e.target.checked)}
                        className="w-4 h-4 accent-[#0F38F5]"
                      />
                      <span>
                        Marcar anticipo de {formatCurrency(depositAmount)} como recibido
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-[#EEF2FF] p-4 space-y-3 border border-[#0F38F5]/25">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#0F38F5]">
                      <CreditCard className="w-4 h-4" />
                      <span>Pasarela Simulada · Cobro {formatCurrency(depositAmount)}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      {(
                        [
                          { id: 'tarjeta', label: 'Tarjeta' },
                          { id: 'pago_movil', label: 'Pago Móvil' },
                          { id: 'zelle', label: 'Zelle' },
                        ] as const
                      ).map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => {
                            setGatewayChannel(ch.id);
                            setGatewayApprovedRef(null);
                          }}
                          className={`min-h-[36px] px-2 py-1 rounded-xl text-xs font-bold border ${
                            gatewayChannel === ch.id
                              ? 'bg-[#0F38F5] text-white border-[#0F38F5]'
                              : 'bg-white text-[#0A1445] border-[#0A1445]/15'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={gatewayInput}
                      onChange={(e) => setGatewayInput(e.target.value)}
                      placeholder={
                        gatewayChannel === 'tarjeta'
                          ? 'Últimos 4 dígitos o titular (simulado)'
                          : gatewayChannel === 'pago_movil'
                            ? 'Teléfono / Banco origen (simulado)'
                            : 'Correo titular Zelle (simulado)'
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl bg-white border border-[#0A1445]/15 text-xs"
                    />

                    {gatewayApprovedRef ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-600/30 p-3 flex items-center gap-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          Cobro simulado aprobado · Ref:{' '}
                          <span className="font-mono-num">
                            {gatewayApprovedRef}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={gatewayProcessing}
                        onClick={handleSimulateGateway}
                        className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#0F38F5] hover:bg-[#0925B8] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>
                          {gatewayProcessing
                            ? 'Procesando...'
                            : `Cobrar ${formatCurrency(depositAmount)} (Simulado)`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Step 5: Mandatory Studio Rules & Confirm CTA */}
          <section className="bg-[#FFFBF2] text-[#0A1445] rounded-3xl p-5 sm:p-6 shadow-xl border-2 border-white space-y-4">
            <div className="flex items-center justify-between border-b border-[#0A1445]/10 pb-2">
              <h3 className="font-display text-2xl font-bold text-[#E6192E] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                <span>POLÍTICAS Y NORMAS</span>
              </h3>
              <StarAccent size={16} className="text-[#0F38F5]" />
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-[#0A1445]/90">
              {STUDIO_RULES.map((rule, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono-num font-bold text-[#E6192E]">
                    0{i + 1}.
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <p className="font-display text-xl font-bold text-[#0F38F5] text-center py-2 bg-[#EEF2FF] rounded-xl">
              &ldquo;Tu mirada, tus reglas.&rdquo;
            </p>

            <div className="space-y-2.5 pt-1">
              <label className="flex items-start gap-2.5 text-xs sm:text-sm font-bold text-[#0A1445] cursor-pointer">
                <input
                  id="accept-rules"
                  type="checkbox"
                  checked={rulesAccepted}
                  onChange={(e) => {
                    setRulesAccepted(e.target.checked);
                    setFormError(null);
                  }}
                  className="mt-0.5 w-5 h-5 accent-[#E6192E] shrink-0"
                />
                <span>
                  Aceptación obligatoria: Confirmo que la clienta conoce y acepta las normas de 13 STUDIO.
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs font-medium text-[#0A1445]/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadICSOnConfirm}
                  onChange={(e) => setDownloadICSOnConfirm(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#0F38F5] shrink-0"
                />
                <span>
                  Descargar archivo .ICS con doble recordatorio (-24h y -1h) al confirmar.
                </span>
              </label>
            </div>

            {formError && (
              <div
                role="alert"
                className="rounded-xl bg-[#FFF0F2] border border-[#E6192E]/40 p-3 flex items-start gap-2 text-xs font-bold text-[#B80D20]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full min-h-[54px] px-6 py-3.5 rounded-2xl bg-[#E6192E] hover:bg-[#C91225] active:scale-[0.99] text-white font-display text-2xl font-bold tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-5 h-5" />
              <span>AGENDAR CITA</span>
            </button>
          </section>
        </div>
      </div>
    </form>
  );
};
