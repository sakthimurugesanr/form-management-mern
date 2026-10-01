import { z } from 'zod';

export const departments = ['General medicine', 'Cardiology', 'Dermatology', 'Pediatrics', 'Orthopedics', 'Neurology'] as const;
export const statuses = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
export const appointmentSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.email('Enter a valid email').max(254),
  phone: z.string().trim().regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number'),
  department: z.enum(departments),
  description: z.string().trim().min(10, 'Please provide at least 10 characters').max(2000),
  startsAt: z.iso.datetime({ offset: true }),
  endsAt: z.iso.datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  const start = Date.parse(value.startsAt);
  const end = Date.parse(value.endsAt);
  if (start < Date.now() - 60_000) context.addIssue({ code: 'custom', path: ['startsAt'], message: 'Choose a future appointment time' });
  if (end <= start) context.addIssue({ code: 'custom', path: ['endsAt'], message: 'End time must be after the appointment time' });
  if (end - start > 8 * 60 * 60 * 1000) context.addIssue({ code: 'custom', path: ['endsAt'], message: 'An appointment can be at most 8 hours' });
  if (start > Date.now() + 365 * 86400_000) context.addIssue({ code: 'custom', path: ['startsAt'], message: 'Book within the next 12 months' });
});
export type AppointmentInput = z.infer<typeof appointmentSchema>;
export type Status = typeof statuses[number];
export interface Appointment extends AppointmentInput { id: string; status: Status; createdAt: string }
export interface Admin { id: string; name: string; email: string; role: 'admin' }
