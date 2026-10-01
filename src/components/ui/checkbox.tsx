import * as Primitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';
export function Checkbox(props:ComponentProps<typeof Primitive.Root>) { return <Primitive.Root className="ui-checkbox" {...props}><Primitive.Indicator><Check size={12} strokeWidth={3}/></Primitive.Indicator></Primitive.Root>; }
