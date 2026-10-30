import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();

  const stats = [
    { title: 'Total Patients', value: '142', icon: '🧑‍🤝‍🧑', color: '#0284c7' },
    { title: 'Appointments Today', value: '18', icon: '📅', color: '#10b981' },
    { title: 'Active Prescriptions', value: '56', icon: '💊', color: '#8b5cf6' },
    { title: 'Doctors on Duty', value: '4', icon: '🩺', color: '#f59e0b' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
          Clinic Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Welcome back, {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'Clinician'}. Here is today's overview.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 0,
            }}
          >
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                {stat.title}
              </p>
              <h3 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                {stat.value}
              </h3>
            </div>
            <div
              style={{
                fontSize: '28px',
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                backgroundColor: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/users"
              style={{
                padding: '10px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                borderRadius: '6px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Manage Patients / Users
            </Link>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '14px' }}>
            Clinic Info
          </h3>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
            <strong>Platform:</strong> KSS Clinic Management<br />
            <strong>Status:</strong> Active<br />
            <strong>Version:</strong> v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

