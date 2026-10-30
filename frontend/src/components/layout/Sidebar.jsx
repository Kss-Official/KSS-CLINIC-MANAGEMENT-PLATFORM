import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const navItems = [
    { label: '📊 Dashboard', path: '/dashboard' },
    { label: '👥 User Management', path: '/users' },
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        minHeight: 'calc(100vh - 64px)',
        padding: '20px 12px',
      }}
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#0284c7' : '#475569',
              backgroundColor: isActive ? '#e0f2fe' : 'transparent',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

