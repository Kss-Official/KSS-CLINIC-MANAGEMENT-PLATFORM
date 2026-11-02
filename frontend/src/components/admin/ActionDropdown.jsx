import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

const getCardContainer = (btnEl) => {
  if (!btnEl) return null;
  // First check if an ancestor has class .admin-card
  const explicit = btnEl.closest('.admin-card');
  if (explicit) return explicit;

  // Otherwise traverse up ancestors looking for the card container
  let curr = btnEl.parentElement;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const tag = curr.tagName.toLowerCase();
    // Skip table elements
    if (!['tr', 'tbody', 'thead', 'table', 'td', 'th'].includes(tag)) {
      const style = window.getComputedStyle(curr);
      const radius = parseInt(style.borderRadius, 10) || 0;
      const bg = style.backgroundColor;
      const hasBg = bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)';
      // A card has borderRadius >= 12 and a background or border
      if (radius >= 12 && hasBg) {
        return curr;
      }
    }
    curr = curr.parentElement;
  }

  // Fallback: table wrapper's parent
  const table = btnEl.closest('table');
  if (table && table.parentElement) {
    return table.parentElement.parentElement || table.parentElement;
  }

  return null;
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

    // If button is completely off-screen (scrolled out), close
    if (btnRect.bottom < 0 || btnRect.top > window.innerHeight) {
      return 'close';
    }

    const cardEl = getCardContainer(buttonRef.current);
    const cardRect = cardEl ? cardEl.getBoundingClientRect() : null;

    const menuEl = menuRef.current;
    const menuWidth = menuEl ? menuEl.offsetWidth : 180;
    const menuHeight = menuEl ? menuEl.offsetHeight : (items.length * 38 + 14);

    // Card boundary limits, constrained by viewport so it never exits the card OR screen
    const boundaryTop = cardRect ? Math.max(cardRect.top + 6, 8) : 8;
    const boundaryBottom = cardRect ? Math.min(cardRect.bottom - 6, window.innerHeight - 8) : (window.innerHeight - 8);
    const boundaryLeft = cardRect ? Math.max(cardRect.left + 6, 8) : 8;
    const boundaryRight = cardRect ? Math.min(cardRect.right - 6, window.innerWidth - 8) : (window.innerWidth - 8);

    const spaceBelow = boundaryBottom - btnRect.bottom - 4;
    const spaceAbove = btnRect.top - boundaryTop - 4;

    let top = 0;
    // 1. If button is near bottom of card (space below is insufficient): open UPWARDS
    if (spaceBelow < menuHeight && spaceAbove >= menuHeight) {
      top = btnRect.top - menuHeight - 4;
    }
    // 2. If button is near top of card (space above is insufficient): open DOWNWARDS
    else if (spaceAbove < menuHeight && spaceBelow >= menuHeight) {
      top = btnRect.bottom + 4;
    }
    // 3. If both directions have sufficient space:
    // Determine whether button is in bottom half or top half of the card
    else if (spaceBelow >= menuHeight && spaceAbove >= menuHeight) {
      const cardCenterY = cardRect ? (cardRect.top + cardRect.bottom) / 2 : (window.innerHeight / 2);
      if (btnRect.top + btnRect.height / 2 > cardCenterY) {
        // Near bottom of card -> open UPWARDS
        top = btnRect.top - menuHeight - 4;
      } else {
        // Near top of card -> open DOWNWARDS
        top = btnRect.bottom + 4;
      }
    }
    // 4. In cramped space: pick direction with more available room
    else {
      if (spaceAbove >= spaceBelow) {
        top = btnRect.top - menuHeight - 4;
      } else {
        top = btnRect.bottom + 4;
      }
    }

    // STRICTLY clamp inside card boundaries (never overflow card top or bottom)
    const maxTop = Math.max(boundaryTop, boundaryBottom - menuHeight);
    top = Math.max(boundaryTop, Math.min(top, maxTop));

    // Horizontal position: align right edge of menu with right edge of button
    let left = btnRect.right - menuWidth;
    // STRICTLY clamp inside card boundaries (never overflow card left or right)
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
      // Calculate initial position immediately to prevent any visual jump
      const initialCoords = calculatePosition();
      if (initialCoords && initialCoords !== 'close') {
        setCoords(initialCoords);
      }
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Measure actual DOM dimensions of the menu once mounted and refine position
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
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label="More actions"
        onClick={handleToggle}
        style={{
          background: 'none',
          border: 'none',
          color: isOpen ? '#1e4620' : '#94a3b8',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '4px 6px',
          lineHeight: 1,
          borderRadius: '6px',
          backgroundColor: isOpen ? '#f1f5f9' : 'transparent',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.color = '#334155';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.color = '#94a3b8';
        }}
      >
        ⋮
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
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.14), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
              minWidth: '175px',
              padding: '6px',
              zIndex: 99999,
              textAlign: 'left',
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
                  gap: '8px',
                  padding: '8px 12px',
                  fontSize: '12.5px',
                  fontWeight: '500',
                  color: item.danger ? '#dc2626' : '#334155',
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.danger ? '#fee2e2' : '#f8fafc';
                  if (!item.danger) e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = item.danger ? '#dc2626' : '#334155';
                }}
              >
                {item.icon && <span style={{ fontSize: '13px' }}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
};

export default ActionDropdown;
