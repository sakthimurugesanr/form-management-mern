import * as Primitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';
interface Props { value:string;onValueChange:(value:string)=>void;options:{value:string;label:string}[];placeholder?:string;id?:string;name?:string;disabled?:boolean;invalid?:boolean;describedBy?:string;label?:string;icon?:ReactNode }
export function Select({value,onValueChange,options,placeholder,id,name,disabled,invalid,describedBy,label,icon}:Props) {
  return <Primitive.Root value={value} onValueChange={onValueChange} name={name} disabled={disabled}>
    <Primitive.Trigger id={id} className="ui-select-trigger" aria-label={label} aria-invalid={invalid} aria-describedby={describedBy}>{icon&&<span className="control-icon" aria-hidden="true">{icon}</span>}<Primitive.Value placeholder={placeholder}/><Primitive.Icon className="select-chevron"><ChevronDown size={16}/></Primitive.Icon></Primitive.Trigger>
    <Primitive.Portal><Primitive.Content className="ui-select-content" position="popper" sideOffset={6} collisionPadding={12}><Primitive.ScrollUpButton className="ui-select-scroll"><ChevronUp size={16}/></Primitive.ScrollUpButton><Primitive.Viewport className="ui-select-viewport">{options.map(option=><Primitive.Item key={option.value} value={option.value} className="ui-select-item"><Primitive.ItemText>{option.label}</Primitive.ItemText><Primitive.ItemIndicator className="select-check"><Check size={15}/></Primitive.ItemIndicator></Primitive.Item>)}</Primitive.Viewport><Primitive.ScrollDownButton className="ui-select-scroll"><ChevronDown size={16}/></Primitive.ScrollDownButton></Primitive.Content></Primitive.Portal>
  </Primitive.Root>;
}
