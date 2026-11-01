import React, { useState, useRef, useEffect } from 'react';

const AdminPagination = ({
  currentPage = 1,
  totalRecords = 0,
  pageSize = '10 page',
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = ['10 page', '20 page', '50 page'],
  recordType = 'records',
  dropdownDirection = 'up', // Default 'up' ensures menu stays strictly within card boundaries
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const limit = parseInt(pageSize, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = totalRecords === 0 ? 0 : (validPage - 1) * limit;
  const endIndex = Math.min(startIndex + limit, totalRecords);
  const displayStart = totalRecords === 0 ? 0 : startIndex + 1;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '18px',
        borderTop: '1px solid #f8fafc',
        marginTop: '12px',
        fontSize: '13px',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '12px',
      }}
    >
      <div>
        Showing {displayStart} - {endIndex} of {totalRecords} {recordType}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Previous Page Button */}
          <button
            type="button"
            disabled={validPage <= 1}
            onClick={() => onPageChange && onPageChange(Math.max(1, validPage - 1))}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: validPage <= 1 ? '#cbd5e1' : '#64748b',
              cursor: validPage <= 1 ? 'not-allowed' : 'pointer',
              opacity: validPage <= 1 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
            title="Previous page"
          >
            ‹
          </button>

          {/* Dynamically calculated page numbers */}
          {pages.map((p) => {
            const isActive = p === validPage;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange && onPageChange(p)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#1e4620' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: isActive ? '600' : 'normal',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                {p}
              </button>
            );
          })}

          {/* Next Page Button */}
          <button
            type="button"
            disabled={validPage >= totalPages}
            onClick={() => onPageChange && onPageChange(Math.min(totalPages, validPage + 1))}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: validPage >= totalPages ? '#cbd5e1' : '#64748b',
              cursor: validPage >= totalPages ? 'not-allowed' : 'pointer',
              opacity: validPage >= totalPages ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              transition: 'all 0.15s ease',
            }}
            title="Next page"
          >
            ›
          </button>
        </div>

        {/* Custom Page Size Dropdown: Opens upwards within card boundaries */}
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            style={{
              padding: '4px 10px',
              height: '28px',
              borderRadius: '6px',
              border: dropdownOpen ? '1px solid #1e4620' : '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '12.5px',
              color: '#475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!dropdownOpen) e.currentTarget.style.borderColor = '#cbd5e1';
            }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <span>{pageSize}</span>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s ease',
                color: '#64748b',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: dropdownDirection === 'up' ? 'calc(100% + 4px)' : 'auto',
                top: dropdownDirection === 'down' ? 'calc(100% + 4px)' : 'auto',
                right: 0,
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.12), 0 4px 8px -2px rgba(0, 0, 0, 0.05)',
                padding: '4px',
                zIndex: 60,
                minWidth: '92px',
                boxSizing: 'border-box',
              }}
            >
              {pageSizeOptions.map((opt) => {
                const isSelected = opt === pageSize;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      if (onPageSizeChange) onPageSizeChange(opt);
                      setDropdownOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: isSelected ? '#e8f5ec' : 'transparent',
                      color: isSelected ? '#1e4620' : '#334155',
                      fontWeight: isSelected ? '600' : '400',
                      fontSize: '12.5px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background-color 0.12s ease',
                      boxSizing: 'border-box',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>{opt}</span>
                    {isSelected && (
                      <span style={{ color: '#1e4620', fontSize: '11px', fontWeight: '700' }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPagination;
