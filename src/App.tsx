import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BellRing, CalendarCheck, X } from 'lucide-react';
import {
  OFFICIAL_SERVICES,
  buildInitialSeedAppointments,
  formatLocalDateISO,
} from './data/studioData';
import {
  ActiveReminderAlert,
  Appointment,
  ReminderSettings,
  ViewTab,
} from './types/studio';
import {
  formatTime12h,
  getAppointmentsInAlertWindow,
  getNextUpcomingAppointment,
} from './utils/studioLogic';
import {
  downloadAppointmentICS,
  getBrowserNotificationPermission,
  playReminderChime,
  requestBrowserNotificationPermission,
  sendBrowserNotification,
} from './utils/notifications';
import { TopNav } from './components/TopNav';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LiveReminderBanner } from './components/LiveReminderBanner';
import { AgendaView } from './components/AgendaView';
import { NuevaCitaView } from './components/NuevaCitaView';
import { ServiciosView } from './components/ServiciosView';
import { GaleriaView } from './components/GaleriaView';
import { StarAccent } from './components/StarAccent';

const STORAGE_APPOINTMENTS_KEY = 'studio13_appointments_v1';
const STORAGE_SETTINGS_KEY = 'studio13_reminder_settings_v1';
const STORAGE_FIRED_ALERTS_KEY = 'studio13_fired_alerts_v1';

interface VisibleToast {
  id: string;
  title: string;
  body: string;
  variant: '1h' | '24h' | 'success';
}

function loadInitialAppointments(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_APPOINTMENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Appointment[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to deterministic seed
  }
  return buildInitialSeedAppointments(new Date());
}

function loadReminderSettings(): ReminderSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as ReminderSettings;
  } catch {
    // Ignore storage error
  }
  return {
    soundEnabled: true,
    browserNotificationsEnabled: true,
    autoRemind24h: true,
    autoRemind1h: true,
  };
}

function loadFiredAlerts(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_FIRED_ALERTS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // Ignore
  }
  return [];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('agenda');
  const [appointments, setAppointments] = useState<Appointment[]>(
    loadInitialAppointments
  );
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(
    loadReminderSettings
  );
  const [firedAlertKeys, setFiredAlertKeys] = useState<string[]>(loadFiredAlerts);
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | 'unsupported'
  >(getBrowserNotificationPermission);

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    formatLocalDateISO(new Date())
  );
  const [draftDate, setDraftDate] = useState<string>(() =>
    formatLocalDateISO(new Date())
  );
  const [draftTime, setDraftTime] = useState<string>('10:00');
  const [draftServiceIds, setDraftServiceIds] = useState<string[]>([
    'cejas-epilacion',
  ]);

  const [now, setNow] = useState<Date>(() => new Date());
  const [visibleToasts, setVisibleToasts] = useState<VisibleToast[]>([]);

  // Live 1s clock for countdown & automatic reminder evaluation
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist appointments & settings
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_APPOINTMENTS_KEY,
        JSON.stringify(appointments)
      );
    } catch {
      // Ignore quota errors
    }
  }, [appointments]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_SETTINGS_KEY,
        JSON.stringify(reminderSettings)
      );
    } catch {
      // Ignore
    }
  }, [reminderSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_FIRED_ALERTS_KEY,
        JSON.stringify(firedAlertKeys)
      );
    } catch {
      // Ignore
    }
  }, [firedAlertKeys]);

  const pushToast = useCallback(
    (title: string, body: string, variant: '1h' | '24h' | 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setVisibleToasts((prev) => [{ id, title, body, variant }, ...prev].slice(0, 3));
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setVisibleToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const nextAppointment = useMemo(
    () => getNextUpcomingAppointment(appointments, now),
    [appointments, now]
  );

  const activeAlerts: ActiveReminderAlert[] = useMemo(
    () => getAppointmentsInAlertWindow(appointments, OFFICIAL_SERVICES, now),
    [appointments, now]
  );

  const hasCompletedInitialAlertScan = React.useRef(false);

  // Automatic 24h & 1h reminder dispatcher
  useEffect(() => {
    if (!hasCompletedInitialAlertScan.current) {
      hasCompletedInitialAlertScan.current = true;
      // Record already-active windows on first mount so they show cleanly inside LiveReminderBanner
      // without triggering duplicate arrival banners or pre-gesture AudioContext warnings.
      if (activeAlerts.length > 0) {
        const initialKeys = activeAlerts
          .map((a) => a.key)
          .filter((k) => !firedAlertKeys.includes(k));
        if (initialKeys.length > 0) {
          setFiredAlertKeys((prev) => [...prev, ...initialKeys]);
        }
      }
      return;
    }

    if (activeAlerts.length === 0) return;

    const unfired = activeAlerts.filter((a) => !firedAlertKeys.includes(a.key));
    if (unfired.length === 0) return;

    const newKeys: string[] = [];
    for (const alert of unfired) {
      newKeys.push(alert.key);
      const isUrgent = alert.windowType === '1h';
      const title = isUrgent
        ? `Recordatorio 1h · ${alert.clientName}`
        : `Recordatorio 24h · ${alert.clientName}`;
      const body = `Turno a las ${formatTime12h(alert.time)} (${alert.date}) — ${alert.servicesLabel}`;

      pushToast(title, body, alert.windowType);
      sendBrowserNotification(title, body);
      if (reminderSettings.soundEnabled) {
        playReminderChime(isUrgent);
      }
    }

    setFiredAlertKeys((prev) => [...prev, ...newKeys]);
  }, [activeAlerts, firedAlertKeys, pushToast, reminderSettings.soundEnabled]);

  const handleRequestNotifications = async () => {
    const result = await requestBrowserNotificationPermission();
    setNotificationPermission(result);
    if (result === 'granted') {
      sendBrowserNotification(
        '13 STUDIO · Avisos activados',
        'Recibirás alertas 24 horas y 1 hora antes de cada cita.'
      );
      pushToast(
        'Notificaciones del navegador activadas',
        'Recibirás alertas automáticas 24h y 1h antes de cada turno.',
        'success'
      );
    } else {
      pushToast(
        'Alertas visuales activas en pantalla',
        'Las alertas de 24h y 1h aparecerán aquí mismo con sonido opcional.',
        'success'
      );
    }
  };

  const handleTestAlert = (windowType: '24h' | '1h') => {
    const sample = nextAppointment?.appointment ?? appointments[0];
    const client = sample ? sample.clientName : 'Clienta 13 STUDIO';
    const timeLabel = sample ? formatTime12h(sample.time) : '10:00 AM';

    const title =
      windowType === '1h'
        ? `Prueba Recordatorio 1h · ${client}`
        : `Prueba Recordatorio 24h · ${client}`;
    const body = `Tu cita en 13 STUDIO está programada para las ${timeLabel}. Recuerda: máx. 10 min de espera y sin acompañantes.`;

    if (reminderSettings.soundEnabled) {
      playReminderChime(windowType === '1h');
    }
    sendBrowserNotification(title, body);
    pushToast(title, body, windowType);
  };

  const handleExportICS = (appointmentId: string) => {
    const found = appointments.find((a) => a.id === appointmentId);
    if (!found) return;
    downloadAppointmentICS(found, OFFICIAL_SERVICES);
    pushToast(
      'Archivo .ICS exportado',
      `Calendario de ${found.clientName} descargado con alarma -24h y -1h.`,
      'success'
    );
  };

  const handleBookFreeSlot = (date: string, time: string) => {
    setDraftDate(date);
    setDraftTime(time);
    setActiveTab('nueva-cita');
  };

  const handleCreateAppointment = (
    newApt: Appointment,
    autoDownloadICS: boolean
  ) => {
    setAppointments((prev) => [...prev, newApt]);
    setSelectedDate(newApt.date);
    setActiveTab('agenda');
    if (autoDownloadICS) {
      downloadAppointmentICS(newApt, OFFICIAL_SERVICES);
    }
    if (reminderSettings.soundEnabled) {
      playReminderChime(false);
    }
    pushToast(
      'Cita confirmada en 13 STUDIO',
      `${newApt.clientName} · ${newApt.date} a las ${formatTime12h(newApt.time)}.`,
      'success'
    );
  };

  const handleMarkCompleted = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'completada', amountPaid: a.totalAmount }
          : a
      )
    );
  };

  const handleRegisterFullPayment = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: 'abonada', amountPaid: a.totalAmount }
          : a
      )
    );
  };

  const handleCancelAppointment = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'cancelada' } : a))
    );
  };

  const handleToggleServiceFromMenu = (serviceId: string) => {
    setDraftServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleProceedToBookFromServices = (singleServiceId?: string) => {
    if (singleServiceId && !draftServiceIds.includes(singleServiceId)) {
      setDraftServiceIds((prev) => [...prev, singleServiceId]);
    }
    setActiveTab('nueva-cita');
  };

  const handleBookServiceFromGallery = (serviceId: string) => {
    setDraftServiceIds([serviceId]);
    setActiveTab('nueva-cita');
  };

  return (
    <div className="min-h-screen studio-star-canvas flex flex-col">
      <TopNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeAlertsCount={activeAlerts.length}
      />

      {/* Visible Browser Alert Stack (always visible regardless of Notification API permission) */}
      {visibleToasts.length > 0 && (
        <div
          aria-live="polite"
          className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 space-y-2"
        >
          {visibleToasts.map((toast) => (
            <div
              key={toast.id}
              role="status"
              className={`rounded-2xl px-4 py-3 shadow-lg border-2 flex items-start justify-between gap-3 ${
                toast.variant === '1h'
                  ? 'bg-[#E6192E] text-white border-white'
                  : toast.variant === '24h'
                    ? 'bg-[#0925B8] text-white border-white'
                    : 'bg-[#FFFBF2] text-[#0A1445] border-white'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                {toast.variant === 'success' ? (
                  <CalendarCheck className="w-5 h-5 text-[#0F38F5] shrink-0 mt-0.5" />
                ) : (
                  <BellRing className="w-5 h-5 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-extrabold leading-snug">
                    {toast.title}
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">{toast.body}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Cerrar notificación"
                className="min-h-[32px] min-w-[32px] rounded-lg flex items-center justify-center hover:bg-black/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-8 pb-24 md:pb-12 space-y-6">
        <LiveReminderBanner
          nextAppointment={nextAppointment}
          activeAlerts={activeAlerts}
          servicesCatalog={OFFICIAL_SERVICES}
          reminderSettings={reminderSettings}
          notificationPermission={notificationPermission}
          onToggleSound={() =>
            setReminderSettings((prev) => ({
              ...prev,
              soundEnabled: !prev.soundEnabled,
            }))
          }
          onRequestNotifications={handleRequestNotifications}
          onTestAlert={handleTestAlert}
          onExportICS={handleExportICS}
        />

        {activeTab === 'agenda' && (
          <AgendaView
            appointments={appointments}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            servicesCatalog={OFFICIAL_SERVICES}
            onBookFreeSlot={handleBookFreeSlot}
            onMarkCompleted={handleMarkCompleted}
            onRegisterFullPayment={handleRegisterFullPayment}
            onCancelAppointment={handleCancelAppointment}
            onExportICS={handleExportICS}
          />
        )}

        {activeTab === 'nueva-cita' && (
          <NuevaCitaView
            servicesCatalog={OFFICIAL_SERVICES}
            appointments={appointments}
            initialDate={draftDate}
            initialTime={draftTime}
            selectedServiceIds={draftServiceIds}
            onChangeSelectedServiceIds={setDraftServiceIds}
            onCreateAppointment={handleCreateAppointment}
          />
        )}

        {activeTab === 'servicios' && (
          <ServiciosView
            servicesCatalog={OFFICIAL_SERVICES}
            selectedServiceIds={draftServiceIds}
            onToggleService={handleToggleServiceFromMenu}
            onProceedToBook={handleProceedToBookFromServices}
          />
        )}

        {activeTab === 'galeria' && (
          <GaleriaView
            servicesCatalog={OFFICIAL_SERVICES}
            onBookServiceFromGallery={handleBookServiceFromGallery}
          />
        )}
      </main>

      {/* Clean Branded Footer */}
      <footer className="hidden md:block border-t border-white/15 bg-[#0925B8]/60 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-2 font-bold">
            <StarAccent size={12} className="text-white" />
            <span>13 STUDIO · MIRADA ON POINT.</span>
          </div>
          <p className="font-semibold text-[#FFFBF2]">
            Tu mirada, tus reglas.
          </p>
        </div>
      </footer>

      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeAlertsCount={activeAlerts.length}
      />
    </div>
  );
}
