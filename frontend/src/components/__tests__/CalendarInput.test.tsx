import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarInput from '../CalendarInput';

describe('CalendarInput', () => {
  it('should render with label and placeholder', () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
        placeholder="Select date"
      />
    );

    expect(screen.getByLabelText('Test Date')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Select date')).toBeInTheDocument();
  });

  it('should open calendar popover on click', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
  });

  it('should display current month and year in calendar header', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      const currentDate = new Date();
      const monthName = currentDate.toLocaleString('default', { month: 'long' });
      const year = currentDate.getFullYear();
      expect(screen.getByText(`${monthName} ${year}`)).toBeInTheDocument();
    });
  });

  it('should show time picker for datetime-local format', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test DateTime"
        format="datetime-local"
      />
    );

    const input = screen.getByLabelText('Test DateTime');
    fireEvent.click(input);

    await waitFor(() => {
      expect(screen.getByText('Time')).toBeInTheDocument();
      expect(screen.getByText('Hours:')).toBeInTheDocument();
      expect(screen.getByText('Minutes:')).toBeInTheDocument();
    });
  });

  it('should handle date selection', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      const todayButton = screen.getByText('1'); // First day of month
      fireEvent.click(todayButton);
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle today button click', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      const todayButton = screen.getByText('Today');
      fireEvent.click(todayButton);
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle clear button click', async () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value="2024-01-15"
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
    });

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('should show error state', () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
        error={true}
        helperText="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const handleChange = jest.fn();
    render(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Test Date');
    expect(input).toBeDisabled();
  });
});
