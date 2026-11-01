import React, { useState, useEffect, useRef } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const parseDateValue = (val) => {
  if (!val) return new Date(2026, 9, 28); // Default 28 Oct 2026
  if (val instanceof Date) return isNaN(val.getTime()) ? new Date(2026, 9, 28) : val;

  const str = String(val).replace('Custom: ', '').trim();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    return new Date(y, m, d);
  }

  // 2. Formatted: DD Mon YYYY (e.g. "30 Sep 2026" or "28 Oct 2026")
  const parts = str.split(' ');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const monthIdx = SHORT_MONTHS.findIndex(
      (m) => m.toLowerCase() === parts[1].toLowerCase()
    );
    const year = parseInt(parts[2], 10);
    if (monthIdx !== -1 && !isNaN(day) && !isNaN(year)) {
      return new Date(year, monthIdx, day);
    }
  }

  // 3. Fallback standard Date
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? new Date(2026, 9, 28) : parsed;
};

const formatToDisplay = (dateObj) => {
  const day = dateObj.getDate();
  const month = SHORT_MONTHS[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  return `${day} ${month} ${year}`;
};

const formatToIso = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const AdminCalendarPopover = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  position = 'bottom-left', // 'bottom-left' | 'bottom-right'
}) => {
  const popoverRef = useRef(null);

  // Parse initial selected date
  const initialDate = parseDateValue(selectedDate);
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // Sync view when selectedDate changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const current = parseDateValue(selectedDate);
      setViewYear(current.getFullYear());
      setViewMonth(current.getMonth());
    }
  }, [isOpen, selectedDate]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const activeDate = parseDateValue(selectedDate);

  // Month navigation
  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Day calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  // Grid cells (42 cells: 6 rows of 7)
  const cells = [];

  // Trailing days from previous month
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({
      day: d,
      isCurrentMonth: false,
      dateObj: new Date(viewYear, viewMonth - 1, d),
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
      dateObj: new Date(viewYear, viewMonth, d),
    });
  }

  // Leading days of next month
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      day: d,
      isCurrentMonth: false,
      dateObj: new Date(viewYear, viewMonth + 1, d),
    });
  }

  const handlePickDate = (cellDate) => {
    const displayStr = formatToDisplay(cellDate);
    const isoStr = formatToIso(cellDate);
    if (onSelectDate) {
      onSelectDate(displayStr, isoStr, cellDate);
    }
    onClose();
  };

  const handleTodayClick = (e) => {
    e.stopPropagation();
    const today = new Date(2026, 9, 28); // 28 Oct 2026
    handlePickDate(today);
  };

  const handleClearClick = (e) => {
    e.stopPropagation();
    if (onSelectDate) {
      onSelectDate('', '', null);
    }
    onClose();
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        left: position === 'bottom-left' ? 0 : 'auto',
        right: position === 'bottom-right' ? 0 : 'auto',
        width: '272px',
        backgroundColor: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '12px',
        boxShadow: '0 12px 28px -4px rgba(0, 0, 0, 0.16), 0 4px 10px rgba(0, 0, 0, 0.06)',
        padding: '14px 14px 10px',
        zIndex: 1100,
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* 1. Header with Month/Year, Navigation Arrows, and Back / Close Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        {/* Month & Year Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '700',
              color: '#0f172a',
            }}
          >
            {MONTH_NAMES[viewMonth]}, {viewYear}
          </span>
        </div>

        {/* Action Controls: Previous, Next, and Close (Back) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Previous Month */}
          <button
            type="button"
            aria-label="Previous month"
            onClick={handlePrevMonth}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Next Month */}
          <button
            type="button"
            aria-label="Next month"
            onClick={handleNextMonth}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0', margin: '0 2px' }} />

          {/* Close / Back Button */}
          <button
            type="button"
            aria-label="Close calendar and go back"
            onClick={onClose}
            title="Close / Back (Esc)"
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px 6px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11.5px',
              fontWeight: '600',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
              e.currentTarget.style.color = '#dc2626';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Close</span>
          </button>
        </div>
      </div>

      {/* 2. Days of Week Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          marginBottom: '6px',
        }}
      >
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div
            key={day}
            style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#64748b',
              padding: '2px 0',
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 3. Days Grid (42 cells) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '2px',
          textAlign: 'center',
        }}
      >
        {cells.map((cell, idx) => {
          const isSelected = isSameDay(cell.dateObj, activeDate);
          return (
            <div
              key={idx}
              onClick={() => handlePickDate(cell.dateObj)}
              style={{
                width: '32px',
                height: '30px',
                margin: '1px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: isSelected ? '700' : '400',
                cursor: 'pointer',
                borderRadius: '6px',
                backgroundColor: isSelected
                  ? '#e2e8f0'
                  : 'transparent',
                color: isSelected
                  ? '#0f172a'
                  : cell.isCurrentMonth
                  ? '#1e293b'
                  : '#94a3b8',
                border: isSelected ? '2px solid #0f172a' : '1px solid transparent',
                transition: 'all 0.12s ease',
                boxSizing: 'border-box',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = '#f1f5f9';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* 4. Footer with Clear, Back, and Today options */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid #f1f5f9',
          fontSize: '12px',
        }}
      >
        <button
          type="button"
          onClick={handleClearClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Clear
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '11px',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '3px 10px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e2e8f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
        >
          <span>← Back</span>
        </button>

        <button
          type="button"
          onClick={handleTodayClick}
          style={{
            background: 'none',
            border: 'none',
            color: '#2563eb',
            fontWeight: '600',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
          onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
        >
          Today
        </button>
      </div>
    </div>
  );
};

export default AdminCalendarPopover;

