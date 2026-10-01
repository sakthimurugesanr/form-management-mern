import { useEffect, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { addYears, format, startOfDay } from 'date-fns';
import { CalendarDays, ChevronDown, Clock3 } from 'lucide-react';
import { Calendar } from './calendar';
import { Select } from './select';
export function DateTimePicker({value,onChange,id,label,invalid,describedBy}:{value:string;onChange:(value:string)=>void;id:string;label:string;invalid?:boolean;describedBy?:string}) {
  const [open,setOpen]=useState(false);const [time,setTime]=useState(value.slice(11,16)||'09:00');
  useEffect(()=>{setTime(value.slice(11,16)||'09:00');},[value]);
  const selected=value?new Date(value):undefined;
  const times=Array.from({length:48},(_,i)=>{const hour=Math.floor(i/2);const minute=i%2?'30':'00';return {value:`${String(hour).padStart(2,'0')}:${minute}`,label:`${hour%12||12}:${minute} ${hour>=12?'PM':'AM'}`};});
  if(!times.some(item=>item.value===time)){const hour=Number(time.slice(0,2));times.push({value:time,label:`${hour%12||12}:${time.slice(3)} ${hour>=12?'PM':'AM'}`});times.sort((a,b)=>a.value.localeCompare(b.value));}
  return <div className="date-time-control"><Popover.Root open={open} onOpenChange={setOpen}><Popover.Trigger asChild><button type="button" id={id} className="ui-date-trigger" aria-label={`${label} date`} aria-invalid={invalid} aria-describedby={describedBy} data-placeholder={!value||undefined}><CalendarDays size={16}/><span>{selected?format(selected,'MMM d, yyyy'):'Select date'}</span><ChevronDown size={14}/></button></Popover.Trigger><Popover.Portal><Popover.Content align="start" className="calendar-popover" sideOffset={8} collisionPadding={12}><div className="calendar-heading"><CalendarDays size={15}/><span>{label}</span></div><Calendar mode="single" selected={selected} defaultMonth={selected} onSelect={date=>{if(date){onChange(`${format(date,'yyyy-MM-dd')}T${time}`);setOpen(false);}}} disabled={{before:startOfDay(new Date()),after:addYears(new Date(),1)}}/><p className="calendar-hint">Times are shown in your local timezone.</p></Popover.Content></Popover.Portal></Popover.Root><Select value={time} onValueChange={next=>{setTime(next);if(value)onChange(`${value.slice(0,10)}T${next}`);}} options={times} label={`${label} time`} icon={<Clock3 size={15}/>}/></div>;
}
