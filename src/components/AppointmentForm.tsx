import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CalendarDays, Check, ArrowRight, LoaderCircle, ShieldCheck, UserRound, Mail, Phone, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { appointmentSchema, departments, type Appointment } from '../../shared/validation';
import { api } from '../store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { DateTimePicker } from './ui/date-time-picker';
interface Fields { name:string;email:string;phone:string;department:string;description:string;startsAt:string;endsAt:string;consent:boolean }
const empty:Fields={name:'',email:'',phone:'',department:'',description:'',startsAt:'',endsAt:'',consent:false};
function defaults(initial?:Appointment):Fields {
  if(!initial)return empty;
  const local=(value:string)=>{const date=new Date(value);return new Date(date.getTime()-date.getTimezoneOffset()*60_000).toISOString().slice(0,16);};
  return {...initial,startsAt:local(initial.startsAt),endsAt:local(initial.endsAt),consent:true};
}
export function AppointmentForm({onSuccess,initial,preview=false,onSave}:{onSuccess?:()=>void;initial?:Appointment;preview?:boolean;onSave?:(appointment:Appointment)=>void}) {
  const [success,setSuccess]=useState('');const [error,setRequestError]=useState('');
  const {register,control,handleSubmit,reset,setError,formState:{errors,isSubmitting}}=useForm<Fields>({defaultValues:defaults(initial),mode:'onBlur'});
  useEffect(()=>{reset(defaults(initial));},[initial,reset]);
  const fieldError=(key:keyof Fields)=>errors[key]&&<p id={`${key}-error`} className="field-error" role="alert">{errors[key]?.message}</p>;
  async function submit(values:Fields) {
    setRequestError('');const iso=(value:string)=>{const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toISOString();};
    const {consent:_consent,...input}=values;
    const result=appointmentSchema.safeParse({...input,startsAt:iso(values.startsAt),endsAt:iso(values.endsAt)});
    if(!result.success){result.error.issues.forEach(issue=>{const field=issue.path[0] as keyof Fields;if(field in empty)setError(field,{message:issue.message},{shouldFocus:true});});return;}
    try {
      if(initial){const updated=preview?{...initial,...result.data}:await api<Appointment>('/appointments/'+initial.id,{method:'PATCH',body:JSON.stringify(result.data)});onSave?.(updated);toast.success('Appointment updated');return;}
      const response=await api<{id:string;message:string}>('/appointments',{method:'POST',body:JSON.stringify(result.data)});setSuccess(response.id);toast.success(response.message);reset(empty);onSuccess?.();
    }catch(err){setRequestError(err instanceof Error?err.message:'Unable to save your appointment. Please try again.');}
  }
  if(success)return <div className="booking-success"><span className="success-circle"><Check size={32}/></span><h2>Your request is on its way.</h2><p>Our clinic team will contact you to confirm your appointment.</p><p className="reference">Reference: {success.slice(0,8).toUpperCase()}</p><Button variant="outline" onClick={()=>setSuccess('')}>Book another appointment</Button></div>;
  return <form onSubmit={handleSubmit(submit)} className="appointment-form" noValidate>
    <div className="form-section-label"><span>01</span> Patient details</div>
    <div className="form-grid">
      <div className="form-field"><Label htmlFor="name">Full name <span>*</span></Label><Input id="name" icon={<UserRound size={17}/>} autoComplete="name" placeholder="Your full name" maxLength={100} aria-invalid={!!errors.name} aria-describedby={errors.name?'name-error':undefined} {...register('name',{required:'Enter your full name',minLength:{value:2,message:'Please enter at least 2 characters'}})}/>{fieldError('name')}</div>
      <div className="form-field"><Label htmlFor="email">Email address <span>*</span></Label><Input id="email" icon={<Mail size={17}/>} type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} aria-invalid={!!errors.email} aria-describedby={errors.email?'email-error':undefined} {...register('email',{required:'Enter your email address',pattern:{value:/^[^\s@]+@[^\s@]+\.[^\s@]+$/,message:'Enter a valid email address'}})}/>{fieldError('email')}</div>
      <div className="form-field"><Label htmlFor="phone">Phone number <span>*</span></Label><Input id="phone" icon={<Phone size={17}/>} type="tel" autoComplete="tel" placeholder="+91 98765 43210" maxLength={20} aria-invalid={!!errors.phone} aria-describedby={errors.phone?'phone-error':undefined} {...register('phone',{required:'Enter your phone number',pattern:{value:/^\+?[\d\s()-]{7,20}$/,message:'Enter a valid phone number'}})}/>{fieldError('phone')}</div>
      <div className="form-field"><Label htmlFor="department">Department <span>*</span></Label><Controller name="department" control={control} rules={{required:'Select a department'}} render={({field})=><Select id="department" value={field.value} onValueChange={field.onChange} placeholder="Choose a specialty" icon={<Stethoscope size={17}/>} options={departments.map(d=>({value:d,label:d}))} invalid={!!errors.department} describedBy={errors.department?'department-error':undefined}/>}/>{fieldError('department')}</div>
    </div>
    <div className="form-section-label schedule-section"><span>02</span> Your appointment</div>
    <div className="form-grid">
      <div className="form-field"><Label htmlFor="startsAt">Appointment date & time <span>*</span></Label><Controller name="startsAt" control={control} rules={{required:'Select an appointment date'}} render={({field})=><DateTimePicker id="startsAt" label="Appointment" value={field.value} onChange={field.onChange} invalid={!!errors.startsAt} describedBy={errors.startsAt?'startsAt-error':undefined}/>}/>{fieldError('startsAt')}</div>
      <div className="form-field"><Label htmlFor="endsAt">End date & time <span>*</span></Label><Controller name="endsAt" control={control} rules={{required:'Select an end date'}} render={({field})=><DateTimePicker id="endsAt" label="End" value={field.value} onChange={field.onChange} invalid={!!errors.endsAt} describedBy={errors.endsAt?'endsAt-error':undefined}/>}/>{fieldError('endsAt')}</div>
      <div className="form-field full-width"><Label htmlFor="description">Reason for your visit <span>*</span></Label><Textarea id="description" placeholder="Let us know how we can help you…" rows={3} maxLength={2000} aria-invalid={!!errors.description} aria-describedby={errors.description?'description-error':'description-hint'} {...register('description',{required:'Describe the reason for your visit',minLength:{value:10,message:'Please provide at least 10 characters'}})}/>{fieldError('description')}<p id="description-hint" className="field-hint">A brief description is enough. Please don’t include sensitive medical records.</p></div>
    </div>
    {!initial&&<div className="consent-field"><div className="consent"><Controller name="consent" control={control} rules={{validate:value=>value||'Please agree to be contacted'}} render={({field})=><Checkbox id="consent" checked={field.value} onCheckedChange={value=>field.onChange(value===true)} aria-invalid={!!errors.consent} aria-describedby={errors.consent?'consent-error':undefined}/>}/><Label htmlFor="consent">I agree to be contacted about this appointment request.</Label></div>{fieldError('consent')}</div>}
    {error&&<div role="alert" className="error-box">{error}</div>}
    <Button className="submit-booking" type="submit" disabled={isSubmitting}>{isSubmitting?<LoaderCircle size={18} className="spin"/>:<CalendarDays size={18}/>} {isSubmitting?'Saving…':initial?'Save appointment':'Request appointment'}<ArrowRight size={18}/></Button>
    <p className="form-security"><ShieldCheck size={14}/> Your details stay private with our clinic team.</p>
  </form>;
}
