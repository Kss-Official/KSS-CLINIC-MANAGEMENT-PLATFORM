import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Button from '../../components/common/Button';

const UserDetailPage = () => {
  const { id } = useParams();

  // Mock user details
  const user = {
    id: id || 1,
    username: 'dr.sharma',
    email: 'sharma@kssclinic.com',
    first_name: 'Rajesh',
    last_name: 'Sharma',
    role: 'DOCTOR',
    phone: '+91 98765 43210',
    specialization: 'Homeopathic Physician',
    license_no: 'HOM-2024-9812',
    is_active: true,
    date_joined: '2026-01-15',
  };

  return (
    <div>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/users" style={{ color: '#64748b', fontSize: '14px' }}>
          ← Back to Users
        </Link>
      </div>

      <div className="card">
        <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a' }}>
            {user.first_name} {user.last_name}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Role: <strong>{user.role}</strong>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Username</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.username}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Email</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.email}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Phone</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.phone}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Joined On</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.date_joined}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;

