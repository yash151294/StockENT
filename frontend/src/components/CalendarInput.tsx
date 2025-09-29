import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  TextField,
  Popover,
  Box,
  Typography,
  IconButton,
  Button,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  Backdrop,
} from '@mui/material';
import {
  CalendarToday,
  ChevronLeft,
  ChevronRight,
  Today,
  Clear,
} from '@mui/icons-material';

interface CalendarInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  format?: 'date' | 'datetime-local';
  fullWidth?: boolean;
  sx?: any;
}

const CalendarInput: React.FC<CalendarInputProps> = ({
  value,
  onChange,
  label,
  placeholder,
  error = false,
  helperText,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  format = 'datetime-local',
  fullWidth = false,
  sx,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState({ hours: 0, minutes: 0 });
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  const open = Boolean(anchorEl);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setSelectedTime({
          hours: date.getHours(),
          minutes: date.getMinutes(),
        });
      }
    }
  }, [value]);

  // Auto-select today's date when calendar opens and no date is selected
  useEffect(() => {
    if (open && !selectedDate) {
      // Small delay to ensure calendar is fully rendered
      const timer = setTimeout(() => {
        const today = new Date();
        setSelectedDate(today);
        setSelectedTime({
          hours: today.getHours(),
          minutes: today.getMinutes(),
        });
        // Also ensure calendar shows current month
        setCurrentDate(today);
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [open, selectedDate]);


  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled) {
      setAnchorEl(inputRef.current);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    if (format === 'datetime-local') {
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(selectedTime.hours).padStart(2, '0');
      const minutes = String(selectedTime.minutes).padStart(2, '0');
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      onChange(localDateTime);
    } else {
      // Format for date input (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      onChange(localDate);
    }
  };

  const handleTimeChange = (field: 'hours' | 'minutes', value: number) => {
    const newTime = { ...selectedTime, [field]: value };
    setSelectedTime(newTime);
    
    if (selectedDate) {
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const hours = String(newTime.hours).padStart(2, '0');
      const minutes = String(newTime.minutes).padStart(2, '0');
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      onChange(localDateTime);
    }
  };

  const handleToday = useCallback(() => {
    const today = new Date();
    
    // Set selected date and time first
    setSelectedDate(today);
    setSelectedTime({
      hours: today.getHours(),
      minutes: today.getMinutes(),
    });
    
    // Reset calendar view to today's month/year
    setCurrentDate(today);
    
    // Close any open selectors
    setShowYearSelector(false);
    setShowMonthSelector(false);
    
    if (format === 'datetime-local') {
      // Format for datetime-local input (YYYY-MM-DDTHH:MM)
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const hours = String(today.getHours()).padStart(2, '0');
      const minutes = String(today.getMinutes()).padStart(2, '0');
      const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      onChange(localDateTime);
    } else {
      // Format for date input (YYYY-MM-DD)
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;
      onChange(localDate);
    }
  }, [format, onChange]);

  const handleClear = () => {
    setSelectedDate(null);
    setSelectedTime({ hours: 0, minutes: 0 });
    onChange('');
    handleClose();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleYearChange = (year: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setFullYear(year);
      return newDate;
    });
    setShowYearSelector(false);
  };

  const handleMonthChange = (month: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(month);
      return newDate;
    });
    setShowMonthSelector(false);
  };

  const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate) {
      const min = new Date(minDate);
      if (date < min) return true;
    }
    if (maxDate) {
      const max = new Date(maxDate);
      if (date > max) return true;
    }
    return false;
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    
    // Create new Date objects to avoid time component issues
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const selectedOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    
    return dateOnly.getTime() === selectedOnly.getTime();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDisplayValue = () => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    
    if (format === 'datetime-local') {
      return date.toLocaleString();
    } else {
      return date.toLocaleDateString();
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentDate);

  return (
    <>
      <TextField
        ref={inputRef}
        fullWidth={fullWidth}
        label={label}
        placeholder={placeholder}
        value={formatDisplayValue()}
        onClick={handleClick}
        error={error}
        helperText={helperText}
        required={required}
        disabled={disabled}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) {
                  setAnchorEl(inputRef.current);
                }
              }}
              disabled={disabled}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <CalendarToday />
            </IconButton>
          ),
        }}
        sx={{
          ...sx,
          '& .MuiOutlinedInput-root': {
            cursor: disabled ? 'not-allowed' : 'pointer',
          },
        }}
      />

      {/* Backdrop blur effect */}
      <Backdrop
        open={open}
        onClick={handleClose}
        sx={{
          zIndex: 1200,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.3s ease-in-out',
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            background: 'rgba(17, 17, 17, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: 3,
            mt: 1,
            minWidth: isMobile ? 280 : 320,
            maxWidth: isMobile ? 320 : 400,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 1300,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 2,
            pb: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {showMonthSelector ? (
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={currentDate.getMonth()}
                    onChange={(e) => handleMonthChange(Number(e.target.value))}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366F1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366F1',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: 'rgba(17, 17, 17, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            },
                          },
                        },
                      },
                    }}
                  >
                    {monthNames.map((month, index) => (
                      <MenuItem key={index} value={index}>
                        {month}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Button
                  onClick={() => setShowMonthSelector(true)}
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                  }}
                >
                  {monthNames[currentDate.getMonth()]}
                </Button>
              )}
              
              {showYearSelector ? (
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={currentDate.getFullYear()}
                    onChange={(e) => handleYearChange(Number(e.target.value))}
                    sx={{
                      color: 'white',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366F1',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6366F1',
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: 'rgba(17, 17, 17, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(99, 102, 241, 0.3)',
                          '& .MuiMenuItem-root': {
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            },
                            '&.Mui-selected': {
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                            },
                          },
                        },
                      },
                    }}
                  >
                    {getYearRange().map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <Button
                  onClick={() => setShowYearSelector(true)}
                  sx={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    },
                  }}
                >
                  {currentDate.getFullYear()}
                </Button>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => navigateMonth('prev')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                }}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => navigateMonth('next')}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { backgroundColor: 'rgba(99, 102, 241, 0.1)' }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          </Box>

          {/* Day names header */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.5,
            mb: 1
          }}>
            {dayNames.map((day) => (
              <Box
                key={day}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 32,
                  width: 40,
                  mx: 'auto'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    textAlign: 'center',
                  }}
                >
                  {day}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Calendar grid */}
          <Box 
            key={`calendar-${selectedDate?.getTime() || 'no-selection'}`}
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 0.5,
              mb: 1
            }}>
            {days.map((day, index) => (
              <Box
                key={day ? `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}` : `empty-${index}`}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 40,
                  width: 40,
                  mx: 'auto'
                }}
              >
                {day ? (
                  <Button
                    size="small"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDateDisabled(day)}
                    sx={{
                      minWidth: 32,
                      height: 32,
                      width: 32,
                      borderRadius: 2,
                      color: isDateSelected(day) ? '#000000' : 'white',
                      backgroundColor: isDateSelected(day) 
                        ? '#6366F1' 
                        : isToday(day) 
                          ? 'rgba(99, 102, 241, 0.2)' 
                          : 'transparent',
                      fontWeight: isDateSelected(day) ? 600 : 400,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      '&:hover': {
                        backgroundColor: isDateSelected(day) 
                          ? '#818CF8' 
                          : 'rgba(99, 102, 241, 0.1)',
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'transparent',
                      },
                    }}
                  >
                    {day.getDate()}
                  </Button>
                ) : null}
              </Box>
            ))}
          </Box>

          {/* Time picker for datetime-local */}
          {format === 'datetime-local' && (
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid rgba(255, 255, 255, 0.1)' 
            }}>
              <Typography variant="subtitle2" sx={{ 
                color: 'rgba(255, 255, 255, 0.7)', 
                mb: 2,
                fontWeight: 600,
              }}>
                Time
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>Hours:</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={selectedTime.hours}
                    onChange={(e) => handleTimeChange('hours', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 23 }}
                    sx={{
                      width: 60,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'white' }}>Minutes:</Typography>
                  <TextField
                    size="small"
                    type="number"
                    value={selectedTime.minutes}
                    onChange={(e) => handleTimeChange('minutes', parseInt(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 59 }}
                    sx={{
                      width: 60,
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  />
                </Box>
              </Box>
            </Box>
          )}

          {/* Action buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 3,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <Button
              size="small"
              startIcon={<Today />}
              onClick={handleToday}
              sx={{
                color: '#6366F1',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                },
              }}
            >
              Today
            </Button>
            <Button
              size="small"
              startIcon={<Clear />}
              onClick={handleClear}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default CalendarInput;
