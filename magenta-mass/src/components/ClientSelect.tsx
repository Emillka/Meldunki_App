import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SelectOption {
  value: string;
  label: string;
}

interface ClientSelectProps {
  id?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  options?: SelectOption[];
  children?: React.ReactNode;
}

export function ClientSelect({ 
  id, 
  value, 
  onValueChange, 
  placeholder = "Wybierz opcję", 
  className = "w-[180px]",
  options = [],
  children 
}: ClientSelectProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleValueChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    }
    // Also trigger the original change event for compatibility
    const selectElement = document.getElementById(id || '');
    if (selectElement) {
      const event = new Event('change', { bubbles: true });
      (selectElement as any).value = newValue;
      selectElement.dispatchEvent(event);
    }
  };

  // Render placeholder during SSR to avoid hydration mismatch
  if (!isMounted) {
    return (
      <div className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}>
        <span className="text-muted-foreground">{placeholder}</span>
        <svg className="h-4 w-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className={className} id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        {children}
      </SelectContent>
    </Select>
  );
}
