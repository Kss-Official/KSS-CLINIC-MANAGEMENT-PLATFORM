import React from 'react';

const Input = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column' }}>
      {label && (
        <label
          htmlFor={id || name}
          style={{
            marginBottom: '6px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#334155',
          }}
        >
          {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      <input
        id={id || name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
          outline: 'none',
          fontSize: '14px',
          backgroundColor: disabled ? '#f1f5f9' : '#ffffff',
          color: '#0f172a',
        }}
        className={`form-input ${className}`}
        {...props}
      />
      {error && (
        <span style={{ marginTop: '4px', fontSize: '12px', color: '#ef4444' }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;

