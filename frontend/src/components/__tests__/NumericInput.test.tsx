import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NumericInput from '../NumericInput';

describe('NumericInput', () => {
  it('should only allow numeric input', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to type non-numeric characters
    fireEvent.change(input, { target: { value: 'abc123def' } });
    expect(handleChange).toHaveBeenCalledWith('123');
    
    // Try to type with decimal
    fireEvent.change(input, { target: { value: '123.45' } });
    expect(handleChange).toHaveBeenCalledWith('123.45');
  });

  it('should prevent non-numeric key presses', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to press non-numeric keys
    fireEvent.keyDown(input, { key: 'a' });
    fireEvent.keyDown(input, { key: '!' });
    fireEvent.keyDown(input, { key: '@' });
    
    // These should be prevented
    expect(input).toHaveValue('');
  });

  it('should allow numeric key presses', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to press numeric keys
    fireEvent.keyDown(input, { key: '1' });
    fireEvent.keyDown(input, { key: '2' });
    fireEvent.keyDown(input, { key: '3' });
    
    // These should be allowed
    expect(input).toHaveValue('');
  });

  it('should respect allowDecimals prop', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
        allowDecimals={false}
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to type decimal
    fireEvent.change(input, { target: { value: '123.45' } });
    expect(handleChange).toHaveBeenCalledWith('12345');
  });

  it('should respect allowNegative prop', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
        allowNegative={true}
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to type negative number
    fireEvent.change(input, { target: { value: '-123' } });
    expect(handleChange).toHaveBeenCalledWith('-123');
  });

  it('should respect min and max props', () => {
    const handleChange = jest.fn();
    render(
      <NumericInput
        value=""
        onChange={handleChange}
        placeholder="Enter number"
        min={10}
        max={100}
      />
    );

    const input = screen.getByPlaceholderText('Enter number');
    
    // Try to type value below minimum
    fireEvent.change(input, { target: { value: '5' } });
    expect(handleChange).not.toHaveBeenCalled();
    
    // Try to type value above maximum
    fireEvent.change(input, { target: { value: '150' } });
    expect(handleChange).not.toHaveBeenCalled();
    
    // Try to type valid value
    fireEvent.change(input, { target: { value: '50' } });
    expect(handleChange).toHaveBeenCalledWith('50');
  });
});
