import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const getCardContainer = (btnEl) => {
  if (!btnEl) return null;
  const explicit = btnEl.closest('.admin-card');
  if (explicit) return explicit;

  let curr = btnEl.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const tag = curr.tagName.toLowerCase();
    if (!['tr', 'tbody', 'thead', 'table', 'td', 'th'].includes(tag)) {
      const style = window.getComputedStyle(curr);
      const radius = parseInt(style.borderRadius, 10) || 0;
      const bg = style.backgroundColor;
      const hasBg = bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
      if (radius >= 12 && hasBg) {
        return curr;
      }
    }
    curr = curr.parentElement;
  }

  const table = btnEl.closest('table');
  if (table && table.parentElement) {
    return table.parentElement.parentElement || table.parentElement;
  }

  return null;
};

const renderIcon = (icon) => {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;

  if (typeof icon === 'string') {
    switch (icon) {
      case '👁️':
      case '👁':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        );
      case '📲':
      case '💬':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        );
      case '👤':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case '✓':
      case '✔':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case '📄':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        );
      case '🌿':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
            <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
          </svg>
        );
      case '🔄':
      case '📅':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        );
      case '✕':
      case '❌':
        return (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        );
      default:
        return <span style={{ fontSize: '13px', lineHeight: 1 }}>{icon}</span>;
    }
  }

  return icon;
};

const ActionDropdown = ({ items = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) return null;
    const btnRect = buttonRef.current.getBoundingClientRect();

    if (btnRect.bottom < 0 || btnRect.top > window.innerHeight) {
      return 'close';
    }

    const cardEl = getCardContainer(buttonRef.current);
    const cardRect = cardEl ? cardEl.getBoundingClientRect() : null;

    const menuEl = menuRef.current;
    const menuWidth = menuEl ? menuEl.offsetWidth : 185;
    const menuHeight = menuEl ? menuEl.offsetHeight : (items.length * 38 + 12);

    const boundaryTop = cardRect ? Math.max(cardRect.top + 6, 8) : 8;
    const boundaryBottom = cardRect ? Math.min(cardRect.bottom - 6, window.innerHeight - 8) : (window.innerHeight - 8);
    const boundaryLeft = cardRect ? Math.max(cardRect.left + 6, 8) : 8;
    const boundaryRight = cardRect ? Math.min(cardRect.right - 6, window.innerWidth - 8) : (window.innerWidth - 8);

    const spaceBelow = boundaryBottom - btnRect.bottom - 6;
    const spaceAbove = btnRect.top - boundaryTop - 6;

    let top = 0;
    if (spaceBelow < menuHeight && spaceAbove >= menuHeight) {
      top = btnRect.top - menuHeight - 6;
    } else if (spaceAbove < menuHeight && spaceBelow >= menuHeight) {
      top = btnRect.bottom + 6;
    } else if (spaceBelow >= menuHeight && spaceAbove >= menuHeight) {
      const cardCenterY = cardRect ? (cardRect.top + cardRect.bottom) / 2 : (window.innerHeight / 2);
      if (btnRect.top + btnRect.height / 2 > cardCenterY) {
        top = btnRect.top - menuHeight - 6;
      } else {
        top = btnRect.bottom + 6;
      }
    } else {
      if (spaceAbove >= spaceBelow) {
        top = btnRect.top - menuHeight - 6;
      } else {
        top = btnRect.bottom + 6;
      }
    }

    const maxTop = Math.max(boundaryTop, boundaryBottom - menuHeight);
    top = Math.max(boundaryTop, Math.min(top, maxTop));

    // Align right edge of menu with right edge of button
    let left = btnRect.right - menuWidth;
    const maxLeft = Math.max(boundaryLeft, boundaryRight - menuWidth);
    left = Math.max(boundaryLeft, Math.min(left, maxLeft));

    return { top, left };
  }, [items.length]);

  const updatePosition = useCallback(() => {
    const nextCoords = calculatePosition();
    if (nextCoords === 'close') {
      setIsOpen(false);
    } else if (nextCoords) {
      setCoords(nextCoords);
    }
  }, [calculatePosition]);

  const handleToggle = (e) => {
    e.stopPropagation();
    if (!isOpen) {
      const initialCoords = calculatePosition();
      if (initialCoords && initialCoords !== 'close') {
        setCoords(initialCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleClickOutside = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-flex', verticalAlign: 'middle' }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="More actions"
        onClick={handleToggle}
        style={{
          width: '30px',
          height: '30px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen ? '#f8fafc' : '#ffffff',
          border: `1px solid ${isOpen ? '#cbd5e1' : '#e2e8f0'}`,
          color: isOpen ? '#1e4620' : '#64748b',
          borderRadius: '6px',
          cursor: 'pointer',
          padding: 0,
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.color = '#1e293b';
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.backgroundColor = '#f8fafc';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.color = '#64748b';
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.backgroundColor = '#ffffff';
          }
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="2.2" />
          <circle cx="12" cy="12" r="2.2" />
          <circle cx="12" cy="19" r="2.2" />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              minWidth: '185px',
              padding: '6px',
              zIndex: 99999,
              textAlign: 'left',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            }}
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  if (item.onClick) item.onClick();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: item.danger ? '#dc2626' : '#334155',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.danger ? '#fef2f2' : '#f8fafc';
                  e.currentTarget.style.color = item.danger ? '#b91c1c' : '#1e4620';
                  const iconSpan = e.currentTarget.querySelector('.dropdown-item-icon');
                  if (iconSpan) iconSpan.style.color = item.danger ? '#b91c1c' : '#1e4620';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = item.danger ? '#dc2626' : '#334155';
                  const iconSpan = e.currentTarget.querySelector('.dropdown-item-icon');
                  if (iconSpan) iconSpan.style.color = item.danger ? '#dc2626' : '#64748b';
                }}
              >
                {item.icon && (
                  <span
                    className="dropdown-item-icon"
                    style={{
                      width: '18px',
                      height: '18px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: item.danger ? '#dc2626' : '#64748b',
                      transition: 'color 0.15s ease',
                    }}
                  >
                    {renderIcon(item.icon)}
                  </span>
                )}
                <span style={{ flex: 1 }}>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionDropdown;
