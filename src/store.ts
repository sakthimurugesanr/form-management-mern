import { configureStore, createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import type { Admin, Appointment, Status } from '../shared/validation';
export async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch('/api' + url, { ...options, credentials: 'same-origin', headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const data = await response.json().catch(() => ({ message: 'Cannot reach the API. Start the backend and check your database connection.' }));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.'); return data;
}
export const fetchAppointments = createAsyncThunk('appointments/fetch', () => api<Appointment[]>('/appointments'));
const appointments = createSlice({ name: 'appointments', initialState: { items: [] as Appointment[], loading: false, error: '' }, reducers: {
  setAppointments: (s, a: PayloadAction<Appointment[]>) => { s.items = a.payload; s.error = ''; },
  updateAppointment: (s, a: PayloadAction<Appointment>) => { s.items = s.items.map(item => item.id === a.payload.id ? a.payload : item); },
  removeAppointment: (s, a: PayloadAction<string>) => { s.items = s.items.filter(item => item.id !== a.payload); },
}, extraReducers: builder => builder.addCase(fetchAppointments.pending, s => { s.loading = true; s.error = ''; }).addCase(fetchAppointments.fulfilled, (s,a) => { s.loading = false; s.items = a.payload; }).addCase(fetchAppointments.rejected, (s,a) => { s.loading = false; s.error = a.error.message || 'Could not load appointments'; }) });
const auth = createSlice({ name: 'auth', initialState: { admin: null as Admin | null }, reducers: { setAdmin: (s,a: PayloadAction<Admin | null>) => { s.admin = a.payload; } } });
const preferences = createSlice({ name: 'preferences', initialState: { theme: localStorage.getItem('careflow-theme') === 'dark' ? 'dark' : 'light' }, reducers: { toggleTheme: s => { s.theme = s.theme === 'light' ? 'dark' : 'light'; } } });
export const { setAppointments, updateAppointment, removeAppointment } = appointments.actions;
export const { setAdmin } = auth.actions;
export const { toggleTheme } = preferences.actions;
export const store = configureStore({ reducer: { appointments: appointments.reducer, auth: auth.reducer, preferences: preferences.reducer } });
export type RootState = ReturnType<typeof store.getState>;
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const setStatus = async (id: string, status: Status) => api<Appointment>('/appointments/' + id, { method: 'PATCH', body: JSON.stringify({ status }) });
