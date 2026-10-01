import type { Appointment } from '../shared/validation';
import { departments } from '../shared/validation';
export function demoAppointments(): Appointment[] {
  const names = ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Drew Cano', 'Natali Craig', 'Orlando Diggs', 'Andi Lane', 'Kate Morrison', 'James Wilson', 'Ava Thompson', 'Noah Williams'];
  return Array.from({ length: 78 }, (_, i) => {
    const start = new Date(); start.setDate(start.getDate() + (i < 8 ? 0 : (i % 45) - 32)); start.setHours(9 + i%8, i%2 ? 30 : 0, 0, 0);
    return { id: `preview-${i}`, name: names[i%names.length], email: names[i%names.length].toLowerCase().replace(' ', '.')+'@example.com', phone: '+91 98765 43210', department: departments[i%departments.length], description: 'Routine consultation and follow-up care. Please contact the patient to confirm availability.', startsAt: start.toISOString(), endsAt: new Date(start.getTime()+1800_000).toISOString(), status: (['confirmed', 'pending', 'completed', 'completed', 'cancelled'] as const)[i%5], createdAt: new Date(start.getTime()-2*86400_000).toISOString() };
  });
}
