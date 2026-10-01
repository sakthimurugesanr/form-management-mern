import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';
export function Input({className,icon,...props}:ComponentProps<'input'>&{icon?:ReactNode}) {
  return <div className={cn('ui-input-wrap',icon&&'has-icon')}>{icon&&<span className="ui-input-icon" aria-hidden="true">{icon}</span>}<input className={cn('ui-input',className)} {...props}/></div>;
}
