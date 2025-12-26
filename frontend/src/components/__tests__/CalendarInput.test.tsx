import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CalendarInput from '../CalendarInput';

// Create a default MUI theme for testing
const theme = createTheme();

// Helper to render with MUI ThemeProvider
const renderWithTheme = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('CalendarInput', () => {
  it('should render with label and placeholder', () => {
    const handleChange = jest.fn();
    renderWithTheme(
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
    renderWithTheme(
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
    renderWithTheme(
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
      // Month and year are separate buttons in the header
      expect(screen.getByText(monthName)).toBeInTheDocument();
      expect(screen.getByText(year.toString())).toBeInTheDocument();
    });
  });

  it('should show time picker for datetime-local format', async () => {
    const handleChange = jest.fn();
    renderWithTheme(
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
    renderWithTheme(
      <CalendarInput
        value=""
        onChange={handleChange}
        label="Test Date"
      />
    );

    const input = screen.getByLabelText('Test Date');
    fireEvent.click(input);

    await waitFor(() => {
      // Find a day button (day 15 is usually available in any month)
      const dayButtons = screen.getAllByRole('button').filter(
        btn => btn.textContent && /^\d{1,2}$/.test(btn.textContent)
      );
      if (dayButtons.length > 0) {
        fireEvent.click(dayButtons[0]);
      }
    });

    expect(handleChange).toHaveBeenCalled();
  });

  it('should handle today button click', async () => {
    const handleChange = jest.fn();
    renderWithTheme(
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
    renderWithTheme(
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
    renderWithTheme(
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
    renderWithTheme(
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
