import { Plus, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { useAppDispatch, useAppSelector, toggleTheme } from '../store';
export function Brand() { return <div className="brand"><span className="brand-symbol"><Plus size={24} strokeWidth={3}/></span><span>careflow<span className="brand-dot">.</span></span></div>; }
export function ThemeToggle() { const dispatch = useAppDispatch(); const theme = useAppSelector(s => s.preferences.theme); return <Button variant="ghost" size="icon" onClick={() => dispatch(toggleTheme())} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}>{theme === 'light' ? <Moon size={19}/> : <Sun size={19}/>}</Button>; }
