import React, { SelectHTMLAttributes } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { cn } from '@/lib/utils';

interface NativeSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onValueChange?: (value: string) => void;
  placeholder?: string;
}

export const NativeSelect = React.forwardRef<HTMLButtonElement, NativeSelectProps>(
  ({ value, onChange, onValueChange, children, className, placeholder, disabled }, ref) => {
    
    // Parse options from children
    const options: { value: string; label: React.ReactNode }[] = [];
    
    const processChild = (child: React.ReactNode) => {
      if (React.isValidElement(child) && child.type === 'option') {
        const props = child.props as any;
        options.push({
          value: props.value?.toString() || '',
          label: props.children
        });
      } else if (Array.isArray(child)) {
        child.forEach(processChild);
      } else if (React.isValidElement(child) && child.type === React.Fragment) {
        const props = child.props as any;
        React.Children.forEach(props.children, processChild);
      }
    };
    
    React.Children.forEach(children, processChild);

    const selectedOption = options.find(o => o.value === value?.toString());

    return (
      <Select 
        value={value?.toString()} 
        onValueChange={(val) => {
          onChange?.({ target: { value: val || '' } } as any);
          onValueChange?.(val || '');
        }}
        disabled={disabled}
      >
        <SelectTrigger className={cn("bg-white", className)} ref={ref}>
          <SelectValue placeholder={placeholder}>
            {selectedOption ? selectedOption.label : ''}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';
