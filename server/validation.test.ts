import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appointmentSchema } from '../shared/validation.js';
const valid = () => ({ name: 'Alex Morgan', email: 'alex@example.com', phone: '+91 9876543210', department: 'General medicine', description: 'A routine health consultation.', startsAt: new Date(Date.now()+86400_000).toISOString(), endsAt: new Date(Date.now()+90000_000).toISOString() });
test('accepts a valid future appointment', () => assert.equal(appointmentSchema.safeParse(valid()).success, true));
test('rejects past appointments', () => assert.equal(appointmentSchema.safeParse({ ...valid(), startsAt: new Date(0).toISOString() }).success, false));
test('rejects end before start', () => assert.equal(appointmentSchema.safeParse({ ...valid(), endsAt: new Date().toISOString() }).success, false));
test('rejects invalid patient data and unknown fields', () => {
  for (const value of [{ email: 'bad' }, { phone: 'letters' }, { department: 'Unknown' }, { role: 'admin' }, { description: 'short' }]) assert.equal(appointmentSchema.safeParse({ ...valid(), ...value }).success, false);
});
