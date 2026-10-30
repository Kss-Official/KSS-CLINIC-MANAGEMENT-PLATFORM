import React from 'react';

const Loader = ({ size = 'md', message = 'Loading...' }) => {
  const sizes = {
    sm: 20,
    md: 36,
    lg: 48,
  };

  const dimension = sizes[size] || 36;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: dimension,
          height: dimension,
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {message && <span style={{ fontSize: '14px', color: '#64748b' }}>{message}</span>}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;

