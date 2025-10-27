import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientSelect } from '@/components/ClientSelect';

// Mock the UI components to avoid complex dependencies
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => {
    const handleChange = (e: any) => {
      if (onValueChange) {
        onValueChange(e.target.value);
      }
    };
    
    return (
      <div data-testid="select" data-value={value}>
        <input 
          data-testid="select-input" 
          value={value || ''} 
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        {children}
      </div>
    );
  },
  SelectContent: ({ children }: any) => (
    <div data-testid="select-content">{children}</div>
  ),
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, className, id }: any) => (
    <div data-testid="select-trigger" className={className} id={id}>
      {children}
    </div>
  ),
  SelectValue: ({ placeholder }: any) => (
    <div data-testid="select-value">{placeholder}</div>
  ),
}));

// Mock the utils import
vi.mock('src/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),
}));

describe('ClientSelect Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  it('should render with default props', () => {
    render(<ClientSelect />);
    
    expect(screen.getByTestId('select')).toBeInTheDocument();
    expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
    expect(screen.getByTestId('select-content')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const customPlaceholder = 'Custom placeholder';
    render(<ClientSelect placeholder={customPlaceholder} />);
    
    expect(screen.getByText(customPlaceholder)).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const customClassName = 'custom-class';
    render(<ClientSelect className={customClassName} />);
    
    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveClass(customClassName);
  });

  it('should render with custom id', () => {
    const customId = 'custom-id';
    render(<ClientSelect id={customId} />);
    
    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveAttribute('id', customId);
  });

  it('should render options when provided', () => {
    render(<ClientSelect options={mockOptions} />);
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('should display selected value', () => {
    const selectedValue = 'option2';
    render(<ClientSelect value={selectedValue} options={mockOptions} />);
    
    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-value', selectedValue);
  });

  it('should call onValueChange when value changes', async () => {
    const user = userEvent.setup();
    const mockOnValueChange = vi.fn();
    
    render(<ClientSelect onValueChange={mockOnValueChange} options={mockOptions} />);
    
    // Simulate value change using the hidden input
    const selectInput = screen.getByTestId('select-input');
    fireEvent.change(selectInput, { target: { value: 'option1' } });
    
    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith('option1');
    });
  });

  it('should render children when provided', () => {
    const childText = 'Custom child content';
    render(
      <ClientSelect>
        <div data-testid="custom-child">{childText}</div>
      </ClientSelect>
    );
    
    expect(screen.getByTestId('custom-child')).toBeInTheDocument();
    expect(screen.getByText(childText)).toBeInTheDocument();
  });

  it('should render SSR placeholder initially', () => {
    render(<ClientSelect placeholder="SSR Placeholder" />);
    
    // The component should render the SSR placeholder initially
    expect(screen.getByText('SSR Placeholder')).toBeInTheDocument();
  });

  it('should handle empty options array', () => {
    render(<ClientSelect options={[]} />);
    
    expect(screen.getByTestId('select')).toBeInTheDocument();
    expect(screen.getByTestId('select-content')).toBeInTheDocument();
  });

  it('should handle undefined onValueChange gracefully', () => {
    render(<ClientSelect options={mockOptions} />);
    
    const selectInput = screen.getByTestId('select-input');
    
    // Should not throw error when onValueChange is undefined
    expect(() => {
      fireEvent.change(selectInput, { target: { value: 'option1' } });
    }).not.toThrow();
  });
});
