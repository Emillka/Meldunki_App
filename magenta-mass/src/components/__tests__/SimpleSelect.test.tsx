import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimpleSelect } from '../SimpleSelect';

describe('SimpleSelect', () => {
  const mockOptions = [
    { value: 'fire', label: 'Pożar' },
    { value: 'rescue', label: 'Ratownictwo' },
    { value: 'medical', label: 'Medyczne' },
    { value: 'other', label: 'Inne' }
  ];

  it('should render with default props', () => {
    // Act
    render(<SimpleSelect />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('');
    expect(screen.getByText('Wybierz opcję')).toBeInTheDocument();
  });

  it('should render with custom props', () => {
    // Arrange
    const props = {
      id: 'test-select',
      value: 'fire',
      placeholder: 'Wybierz typ zdarzenia',
      className: 'custom-class',
      options: mockOptions
    };

    // Act
    render(<SimpleSelect {...props} />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'test-select');
    expect(select).toHaveValue('fire');
    expect(select).toHaveClass('custom-class');
    expect(screen.getByText('Wybierz typ zdarzenia')).toBeInTheDocument();
  });

  it('should render all options', () => {
    // Act
    render(<SimpleSelect options={mockOptions} />);

    // Assert
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('should call onChange when selection changes', () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<SimpleSelect options={mockOptions} onChange={mockOnChange} />);

    // Act
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'rescue' } });

    // Assert
    expect(mockOnChange).toHaveBeenCalledWith('rescue');
  });

  it('should not call onChange when no onChange prop is provided', () => {
    // Act
    render(<SimpleSelect options={mockOptions} />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(() => {
      fireEvent.change(select, { target: { value: 'rescue' } });
    }).not.toThrow();
  });

  it('should update value when controlled', () => {
    // Arrange
    const mockOnChange = vi.fn();
    const { rerender } = render(
      <SimpleSelect 
        options={mockOptions} 
        value="fire" 
        onChange={mockOnChange} 
      />
    );

    // Assert initial value
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('fire');

    // Act - rerender with new value
    rerender(
      <SimpleSelect 
        options={mockOptions} 
        value="rescue" 
        onChange={mockOnChange} 
      />
    );

    // Assert
    expect(select).toHaveValue('rescue');
  });

  it('should handle empty options array', () => {
    // Act
    render(<SimpleSelect options={[]} />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Wybierz opcję')).toBeInTheDocument();
  });

  it('should apply default className', () => {
    // Act
    render(<SimpleSelect />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass('w-[180px]');
  });

  it('should apply custom className', () => {
    // Arrange
    const customClassName = 'w-full max-w-md';

    // Act
    render(<SimpleSelect className={customClassName} />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toHaveClass(customClassName);
  });

  it('should have proper accessibility attributes', () => {
    // Arrange
    const props = {
      id: 'accessible-select',
      placeholder: 'Choose an option'
    };

    // Act
    render(<SimpleSelect {...props} options={mockOptions} />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'accessible-select');
    expect(select).not.toHaveAttribute('aria-label'); // No aria-label by default
  });

  it('should handle disabled state', () => {
    // Act
    render(<SimpleSelect disabled />);

    // Assert
    const select = screen.getByRole('combobox');
    expect(select).toBeDisabled();
  });

  it('should render with correct option values', () => {
    // Act
    render(<SimpleSelect options={mockOptions} />);

    // Assert
    mockOptions.forEach(option => {
      const optionElement = screen.getByText(option.label);
      expect(optionElement).toHaveAttribute('value', option.value);
    });
  });

  it('should handle rapid value changes', () => {
    // Arrange
    const mockOnChange = vi.fn();
    render(<SimpleSelect options={mockOptions} onChange={mockOnChange} />);

    // Act
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fire' } });
    fireEvent.change(select, { target: { value: 'rescue' } });
    fireEvent.change(select, { target: { value: 'medical' } });

    // Assert
    expect(mockOnChange).toHaveBeenCalledTimes(3);
    expect(mockOnChange).toHaveBeenNthCalledWith(1, 'fire');
    expect(mockOnChange).toHaveBeenNthCalledWith(2, 'rescue');
    expect(mockOnChange).toHaveBeenNthCalledWith(3, 'medical');
  });
});
