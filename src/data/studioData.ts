import { Appointment, GalleryItem, ServiceItem } from '../types/studio';

export const STUDIO_RULES: string[] = [
  'Ser puntual con la cita (máx. 10 min de espera o se cede el turno).',
  'Sin niños o acompañantes (evita distracciones y reduce tiempo en camilla).',
  'Enviar referencia de diseño antes de asistir.',
];

export const OFFICIAL_SERVICES: ServiceItem[] = [
  // Cejas
  {
    id: 'cejas-epilacion',
    name: 'Epilación y diseño',
    category: 'cejas',
    description: 'Cejas a tu medida',
    price: 5,
    durationMinutes: 40,
  },
  {
    id: 'cejas-henna',
    name: 'Tinte | Henna',
    category: 'cejas',
    description: 'Color que se adapte a tu gusto',
    price: 5,
    durationMinutes: 45,
  },
  {
    id: 'cejas-laminado',
    name: 'Laminado',
    category: 'cejas',
    description: 'Cejas peinadas y perfectas',
    price: 13,
    durationMinutes: 60,
  },

  // Pestañas
  {
    id: 'pestanas-natural',
    name: 'Efecto natural',
    category: 'pestanas',
    description: 'Punto por punto',
    price: 8,
    durationMinutes: 60,
  },
  {
    id: 'pestanas-cat-eye',
    name: 'Efecto ojo de gato',
    category: 'pestanas',
    description: 'Punto por punto',
    price: 10,
    durationMinutes: 75,
  },
  {
    id: 'pestanas-volumen',
    name: 'Efecto volumen',
    category: 'pestanas',
    description: 'Punto a punto',
    price: 13,
    durationMinutes: 90,
  },
  {
    id: 'pestanas-retiro',
    name: 'Retiro',
    category: 'pestanas',
    description: 'Punto a punto',
    price: 5,
    durationMinutes: 30,
  },

  // Depilación (Depi sin drama)
  {
    id: 'depi-bozo',
    name: 'Bozo',
    category: 'depilacion',
    description: 'Depilación suave y precisa en zona del labio superior',
    price: 2,
    durationMinutes: 15,
  },
  {
    id: 'depi-axila',
    name: 'Axila',
    category: 'depilacion',
    description: 'Piel limpia, uniforme y libre de irritación',
    price: 5,
    durationMinutes: 25,
  },
  {
    id: 'depi-piernas',
    name: 'Piernas Completas',
    category: 'depilacion',
    description: 'Acabado sedoso de muslo a tobillo sin drama',
    price: 12,
    durationMinutes: 50,
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'gal-cat-eye',
    title: 'Ojo de Gato + Diseño Definido',
    category: 'pestanas',
    description: 'Proyección alargada hacia la esquina exterior con punto por punto limpio y arco estructurado.',
    imageUrl: '/assets/aistudio/IMG_20261117_143724_962_dc4b2526.jpg',
    linkedServiceId: 'pestanas-cat-eye',
    highlightTag: 'Punto por punto · $10',
  },
  {
    id: 'gal-laminado',
    title: 'Laminado Orgánico Full Brow',
    category: 'cejas',
    description: 'Vello direccionado hacia arriba con fijación espejo y limpieza de contorno sin exceso.',
    imageUrl: '/assets/aistudio/IMG_20261117_143725_646_71916d68.jpg',
    linkedServiceId: 'cejas-laminado',
    highlightTag: 'Cejas peinadas · $13',
  },
  {
    id: 'gal-tinte-natural',
    title: 'Tinte Henna + Mirada Natural',
    category: 'cejas',
    description: 'Sombreado natural adaptado al subtono de piel combinado con acabado clásico ligero.',
    imageUrl: '/assets/aistudio/IMG_20261117_143724_944_23bfaf07.jpg',
    linkedServiceId: 'cejas-henna',
    highlightTag: 'Color a tu gusto · $5',
  },
  {
    id: 'gal-volumen',
    title: 'Efecto Volumen Baddie',
    category: 'pestanas',
    description: 'Mayor densidad punto a punto manteniendo ligereza en la línea de pestañas y simetría total.',
    linkedServiceId: 'pestanas-volumen',
    highlightTag: 'Punto a punto · $13',
  },
  {
    id: 'gal-depi-piernas',
    title: 'Depi Sin Drama — Piernas & Axila',
    category: 'depilacion',
    description: 'Protocolo rápido con cera de baja temperatura y cuidado post-depilación para piel suave.',
    linkedServiceId: 'depi-piernas',
    highlightTag: 'Sesión express · Desde $2',
  },
  {
    id: 'gal-epilacion',
    title: 'Visagismo & Epilación a Medida',
    category: 'cejas',
    description: 'Mapeo geométrico facial previo para equilibrar inicio, punto alto y cola según tu rostro.',
    linkedServiceId: 'cejas-epilacion',
    highlightTag: 'Cejas a tu medida · $5',
  },
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatLocalDateISO(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/**
 * Generates deterministic seed appointments anchored to `now` so the
 * 7am-7pm timeline, 1h alert window, and 24h alert window are immediately demonstrable.
 */
export function buildInitialSeedAppointments(now: Date = new Date()): Appointment[] {
  const todayStr = formatLocalDateISO(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatLocalDateISO(tomorrow);

  // Pick a slot ~1 hour from now (clamped between 08:00 and 18:00) so the 1h alert & live countdown work immediately
  const nextHour = Math.min(18, Math.max(8, now.getHours() + 1));
  const laterHour = Math.min(19, nextHour + 2);
  const morningHour = 9;

  const nextHourStr = `${pad2(nextHour)}:00`;
  const laterHourStr = `${pad2(laterHour)}:00`;

  return [
    {
      id: 'seed-1',
      clientName: 'Camila Mendoza',
      clientPhone: '+58 412-555-0193',
      date: todayStr,
      time: nextHourStr,
      serviceIds: ['pestanas-cat-eye', 'cejas-epilacion'],
      totalAmount: 15,
      depositMode: '50%',
      depositAmount: 7.5,
      amountPaid: 7.5,
      paymentMethod: 'pago_movil',
      paymentReference: 'PM-88412',
      status: 'abonada',
      notes: 'Pidió referencia ojo de gato sutil',
      rulesAccepted: true,
      createdAt: now.toISOString(),
    },
    ...(laterHour !== nextHour
      ? [
          {
            id: 'seed-2',
            clientName: 'Sofía Rojas',
            clientPhone: '+58 414-555-0244',
            date: todayStr,
            time: laterHourStr,
            serviceIds: ['cejas-laminado'],
            totalAmount: 13,
            depositMode: '100%' as const,
            depositAmount: 13,
            amountPaid: 13,
            paymentMethod: 'zelle' as const,
            paymentReference: 'ZL-3019',
            status: 'confirmada' as const,
            notes: 'Laminado orgánico sin tinte',
            rulesAccepted: true,
            createdAt: now.toISOString(),
          },
        ]
      : []),
    ...(morningHour < nextHour
      ? [
          {
            id: 'seed-3',
            clientName: 'Andrea Silva',
            clientPhone: '+58 424-555-0118',
            date: todayStr,
            time: '09:00',
            serviceIds: ['depi-axila', 'depi-bozo'],
            totalAmount: 7,
            depositMode: '100%' as const,
            depositAmount: 7,
            amountPaid: 7,
            paymentMethod: 'efectivo' as const,
            status: 'completada' as const,
            rulesAccepted: true,
            createdAt: now.toISOString(),
          },
        ]
      : []),
    {
      id: 'seed-4',
      clientName: 'Valentina Pérez',
      clientPhone: '+58 412-555-0377',
      date: tomorrowStr,
      time: `${pad2(Math.min(18, Math.max(9, now.getHours())))}:00`,
      serviceIds: ['pestanas-volumen', 'cejas-henna'],
      totalAmount: 18,
      depositMode: '30%',
      depositAmount: 5.4,
      amountPaid: 0,
      paymentMethod: 'tarjeta',
      status: 'confirmada',
      notes: 'Pendiente envío de referencia por WhatsApp',
      rulesAccepted: true,
      createdAt: now.toISOString(),
    },
  ];
}
