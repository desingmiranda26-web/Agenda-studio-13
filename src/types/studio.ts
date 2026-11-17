export type ServiceCategory = 'cejas' | 'pestanas' | 'depilacion';

export type ViewTab = 'agenda' | 'nueva-cita' | 'servicios' | 'galeria';

export type DepositMode = '30%' | '50%' | '5$' | '100%' | 'pendiente';

export type PaymentMethod = 'tarjeta' | 'pago_movil' | 'zelle' | 'efectivo';

export type AppointmentStatus = 'confirmada' | 'abonada' | 'completada' | 'cancelada';

export type AlertWindow = 'none' | '24h' | '1h' | 'imminent';

export interface ServiceItem {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  price: number;
  durationMinutes: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:00 (07:00 to 19:00)
  serviceIds: string[];
  totalAmount: number;
  depositMode: DepositMode;
  depositAmount: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  status: AppointmentStatus;
  notes?: string;
  rulesAccepted: boolean;
  createdAt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: ServiceCategory;
  description: string;
  imageUrl?: string;
  linkedServiceId: string;
  highlightTag: string;
}

export interface ReminderSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  autoRemind24h: boolean;
  autoRemind1h: boolean;
}

export interface ActiveReminderAlert {
  key: string; // `${appointmentId}-${window}`
  appointmentId: string;
  clientName: string;
  date: string;
  time: string;
  windowType: '24h' | '1h';
  servicesLabel: string;
  minutesRemaining: number;
  triggeredAt: string;
}
