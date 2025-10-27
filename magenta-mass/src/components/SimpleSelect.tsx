import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  options?: SelectOption[];
  disabled?: boolean;
  'aria-label'?: string;
}

export function SimpleSelect({ 
  id, 
  value = "", 
  onChange, 
  placeholder = "Wybierz opcję", 
  className = "w-[180px]",
  options = [],
  disabled = false,
  'aria-label': ariaLabel
}: SimpleSelectProps) {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
