import test from 'node:test';
import assert from 'node:assert/strict';
import { OFFICIAL_SERVICES } from '../data/studioData';
import { Appointment } from '../types/studio';
import {
  TIME_SLOTS,
  calculateDepositAmount,
  calculateServicesTotal,
  classifyAlertWindow,
  formatTime12h,
  generateAppointmentICS,
  getAppointmentsInAlertWindow,
  getNextUpcomingAppointment,
  isSlotOccupied,
} from './studioLogic';

test('TIME_SLOTS covers 13 hourly blocks from 07:00 AM to 07:00 PM', () => {
  assert.equal(TIME_SLOTS.length, 13);
  assert.equal(TIME_SLOTS[0], '07:00');
  assert.equal(TIME_SLOTS[12], '19:00');
  assert.equal(formatTime12h(TIME_SLOTS[0]), '07:00 AM');
  assert.equal(formatTime12h('12:00'), '12:00 PM');
  assert.equal(formatTime12h(TIME_SLOTS[12]), '07:00 PM');
});

test('calculateServicesTotal sums official service prices accurately', () => {
  const total = calculateServicesTotal(
    ['cejas-laminado', 'pestanas-cat-eye', 'depi-bozo'],
    OFFICIAL_SERVICES
  );
  // 13 + 10 + 2 = 25
  assert.equal(total, 25);
});

test('calculateDepositAmount handles 30%, 50%, 5$, 100%, and pendiente', () => {
  assert.equal(calculateDepositAmount(20, '30%'), 6);
  assert.equal(calculateDepositAmount(20, '50%'), 10);
  assert.equal(calculateDepositAmount(20, '5$'), 5);
  assert.equal(calculateDepositAmount(2, '5$'), 2); // capped at total
  assert.equal(calculateDepositAmount(20, '100%'), 20);
  assert.equal(calculateDepositAmount(20, 'pendiente'), 0);
});

test('isSlotOccupied ignores cancelled appointments and matches active ones', () => {
  const appointments: Appointment[] = [
    {
      id: 'a1',
      clientName: 'Ana',
      clientPhone: '123',
      date: '2026-11-17',
      time: '10:00',
      serviceIds: ['cejas-epilacion'],
      totalAmount: 5,
      depositMode: '100%',
      depositAmount: 5,
      amountPaid: 5,
      paymentMethod: 'efectivo',
      status: 'confirmada',
      rulesAccepted: true,
      createdAt: '2026-11-17T08:00:00Z',
    },
    {
      id: 'a2',
      clientName: 'Lucía',
      clientPhone: '456',
      date: '2026-11-17',
      time: '11:00',
      serviceIds: ['depi-axila'],
      totalAmount: 5,
      depositMode: 'pendiente',
      depositAmount: 0,
      amountPaid: 0,
      paymentMethod: 'efectivo',
      status: 'cancelada',
      rulesAccepted: true,
      createdAt: '2026-11-17T08:00:00Z',
    },
  ];

  assert.equal(isSlotOccupied(appointments, '2026-11-17', '10:00'), true);
  assert.equal(isSlotOccupied(appointments, '2026-11-17', '10:00', 'a1'), false);
  assert.equal(isSlotOccupied(appointments, '2026-11-17', '11:00'), false);
  assert.equal(isSlotOccupied(appointments, '2026-11-17', '12:00'), false);
});

test('classifyAlertWindow & getAppointmentsInAlertWindow detect 24h and 1h reminders', () => {
  assert.equal(classifyAlertWindow(45 * 60000), '1h');
  assert.equal(classifyAlertWindow(10 * 60000), 'imminent');
  assert.equal(classifyAlertWindow(10 * 3600000), '24h');
  assert.equal(classifyAlertWindow(30 * 3600000), 'none');

  const now = new Date(2026, 10, 17, 10, 0, 0); // 10:00 AM
  const appointments: Appointment[] = [
    {
      id: 'soon-1h',
      clientName: 'María',
      clientPhone: '111',
      date: '2026-11-17',
      time: '11:00', // 60 min away -> 1h window
      serviceIds: ['cejas-laminado'],
      totalAmount: 13,
      depositMode: '50%',
      depositAmount: 6.5,
      amountPaid: 6.5,
      paymentMethod: 'pago_movil',
      status: 'abonada',
      rulesAccepted: true,
      createdAt: now.toISOString(),
    },
    {
      id: 'next-24h',
      clientName: 'Elena',
      clientPhone: '222',
      date: '2026-11-18',
      time: '09:00', // 23h away -> 24h window
      serviceIds: ['pestanas-volumen'],
      totalAmount: 13,
      depositMode: '100%',
      depositAmount: 13,
      amountPaid: 13,
      paymentMethod: 'zelle',
      status: 'confirmada',
      rulesAccepted: true,
      createdAt: now.toISOString(),
    },
  ];

  const nearest = getNextUpcomingAppointment(appointments, now);
  assert.ok(nearest);
  assert.equal(nearest.appointment.id, 'soon-1h');
  assert.equal(nearest.hours, 1);
  assert.equal(nearest.minutes, 0);
  assert.equal(nearest.alertWindow, '1h');

  const alerts = getAppointmentsInAlertWindow(appointments, OFFICIAL_SERVICES, now);
  assert.equal(alerts.length, 2);
  assert.equal(alerts[0].windowType, '1h');
  assert.equal(alerts[1].windowType, '24h');
});

test('generateAppointmentICS outputs valid VCALENDAR with dual VALARM (-P1D and -PT1H)', () => {
  const apt: Appointment = {
    id: 'ics-test-1',
    clientName: 'Daniela Cruz',
    clientPhone: '+58 412-000-1313',
    date: '2026-11-18',
    time: '14:00',
    serviceIds: ['pestanas-cat-eye', 'depi-bozo'],
    totalAmount: 12,
    depositMode: '5$',
    depositAmount: 5,
    amountPaid: 5,
    paymentMethod: 'tarjeta',
    status: 'abonada',
    rulesAccepted: true,
    createdAt: '2026-11-17T12:00:00Z',
  };

  const ics = generateAppointmentICS(apt, OFFICIAL_SERVICES);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('TRIGGER:-P1D'));
  assert.ok(ics.includes('TRIGGER:-PT1H'));
  assert.ok(ics.includes('Daniela Cruz'));
  assert.ok(ics.includes('Efecto ojo de gato'));
  assert.ok(ics.includes('END:VCALENDAR'));
});
