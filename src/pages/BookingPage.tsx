import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, ShieldCheck } from 'lucide-react';
import { Brand, ThemeToggle } from '../components/Brand';
import { AppointmentForm } from '../components/AppointmentForm';
import { Button } from '../components/ui/button';
export function BookingPage() {
  return <div className="public-page booking-page"><header className="public-header"><Link to="/" aria-label="Careflow home"><Brand/></Link><div className="header-actions"><ThemeToggle/><Button asChild variant="outline" size="sm"><Link to="/admin">Clinic sign in <ArrowUpRight size={15}/></Link></Button></div></header><main className="booking-layout"><section className="booking-card" aria-labelledby="booking-title"><div className="booking-card-heading"><div className="booking-heading-icon"><CalendarDays size={24}/></div><span className="booking-access"><ShieldCheck size={13}/> No account needed</span></div><div className="section-kicker">YOUR NEXT STEP TO BETTER HEALTH</div><h1 id="booking-title">Request an appointment</h1><p className="muted">Choose your department and preferred time. Our team will contact you to confirm your visit.</p><AppointmentForm/></section></main><footer className="public-footer"><span>© {new Date().getFullYear()} Careflow</span><span><ShieldCheck size={13}/> Thoughtful care. Secure booking.</span></footer></div>;
}
