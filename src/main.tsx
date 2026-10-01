import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store, useAppSelector } from './store';
import { useEffect } from 'react';
import { BookingPage } from './pages/BookingPage';
import { lazy, Suspense } from 'react';
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
import './styles.css';
function App() {
  const theme = useAppSelector(s => s.preferences.theme);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('careflow-theme', theme); }, [theme]);
  return <><Suspense fallback={<div className="loading-screen">Loading your workspace…</div>}><Routes><Route path="/" element={<BookingPage/>}/><Route path="/admin/*" element={<AdminPage/>}/><Route path="*" element={<main className="not-found"><h1>Page not found</h1><a href="/">Return to Careflow</a></main>}/></Routes></Suspense><Toaster richColors position="top-right" theme={theme as 'light' | 'dark'}/></>;
}
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><Provider store={store}><BrowserRouter><App/></BrowserRouter></Provider></React.StrictMode>);
