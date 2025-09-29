import React, { useState, useCallback } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

interface NumericInputProps extends Omit<TextFieldProps, 'onChange' | 'value' | 'type'> {
  value: string | number;
  onChange: (value: string) => void;
  allowDecimals?: boolean;
  allowNegative?: boolean;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  allowDecimals = true,
  allowNegative = false,
  min,
  max,
  step = 1,
  precision = 2,
  onKeyDown,
  onKeyPress,
  onPaste,
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState<string>(String(value || ''));

  // Update display value when prop value changes
  React.useEffect(() => {
    setDisplayValue(String(value || ''));
  }, [value]);

  const validateAndFormatValue = useCallback((inputValue: string): string => {
    // Remove any non-numeric characters except decimal point and minus sign
    let cleaned = inputValue;
    
    if (!allowNegative) {
      cleaned = cleaned.replace(/[^0-9.]/g, '');
    } else {
      cleaned = cleaned.replace(/[^0-9.-]/g, '');
    }
    
    if (!allowDecimals) {
      cleaned = cleaned.replace(/\./g, '');
    }
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Ensure minus sign is only at the beginning
    if (allowNegative && cleaned.includes('-')) {
      const minusCount = (cleaned.match(/-/g) || []).length;
      if (minusCount > 1) {
        cleaned = cleaned.replace(/-/g, '');
        if (cleaned.length > 0) {
          cleaned = '-' + cleaned;
        }
      }
    }
    
    return cleaned;
  }, [allowDecimals, allowNegative]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const cleanedValue = validateAndFormatValue(inputValue);
    
    // Check if the value is within min/max bounds
    const numericValue = parseFloat(cleanedValue);
    if (!isNaN(numericValue)) {
      if (min !== undefined && numericValue < min) {
        return; // Don't update if below minimum
      }
      if (max !== undefined && numericValue > max) {
        return; // Don't update if above maximum
      }
    }
    
    setDisplayValue(cleanedValue);
    onChange(cleanedValue);
  }, [validateAndFormatValue, onChange, min, max]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key, ctrlKey, metaKey } = event;
    
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];
    
    // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    const allowedCtrlKeys = ['a', 'c', 'v', 'x', 'z'];
    
    if (allowedKeys.includes(key) || 
        ((ctrlKey || metaKey) && allowedCtrlKeys.includes(key.toLowerCase()))) {
      return; // Allow these keys
    }
    
    // Allow decimal point if decimals are allowed
    if (key === '.' && allowDecimals) {
      const currentValue = (event.target as HTMLInputElement).value;
      if (!currentValue.includes('.')) {
        return; // Allow decimal point if not already present
      }
    }
    
    // Allow minus sign if negative numbers are allowed
    if (key === '-' && allowNegative) {
      const currentValue = (event.target as HTMLInputElement).value;
      const cursorPosition = (event.target as HTMLInputElement).selectionStart || 0;
      if ((cursorPosition === 0) && !currentValue.includes('-')) {
        return; // Allow minus sign at the beginning
      }
    }
    
    // Allow numbers
    if (/^[0-9]$/.test(key)) {
      return; // Allow numbers
    }
    
    // Block all other keys
    event.preventDefault();
    
    // Call original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(event);
    }
  }, [allowDecimals, allowNegative, onKeyDown]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    const { key } = event;
    
    // Block non-numeric characters
    if (!/^[0-9.-]$/.test(key)) {
      event.preventDefault();
    }
    
    // Block decimal point if not allowed or already present
    if (key === '.' && (!allowDecimals || displayValue.includes('.'))) {
      event.preventDefault();
    }
    
    // Block minus sign if not allowed or not at beginning
    if (key === '-' && (!allowNegative || displayValue.includes('-'))) {
      event.preventDefault();
    }
    
    // Call original onKeyPress if provided
    if (onKeyPress) {
      onKeyPress(event);
    }
  }, [allowDecimals, allowNegative, displayValue, onKeyPress]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    
    const pastedText = event.clipboardData.getData('text');
    const cleanedValue = validateAndFormatValue(pastedText);
    
    // Check if the pasted value is within bounds
    const numericValue = parseFloat(cleanedValue);
    if (!isNaN(numericValue)) {
      if (min !== undefined && numericValue < min) {
        return; // Don't paste if below minimum
      }
      if (max !== undefined && numericValue > max) {
        return; // Don't paste if above maximum
      }
    }
    
    setDisplayValue(cleanedValue);
    onChange(cleanedValue);
    
    // Call original onPaste if provided
    if (onPaste) {
      onPaste(event);
    }
  }, [validateAndFormatValue, onChange, min, max, onPaste]);

  return (
    <TextField
      {...props}
      type="text" // Use text type to have full control over input
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyPress={handleKeyPress}
      onPaste={handlePaste}
      inputProps={{
        ...props.inputProps,
        inputMode: 'numeric',
        pattern: allowDecimals ? '[0-9]*[.]?[0-9]*' : '[0-9]*',
      }}
    />
  );
};

export default NumericInput;
