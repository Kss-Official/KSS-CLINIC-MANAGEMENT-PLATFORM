import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import Button from '../../components/common/Button';

const UserListPage = () => {
  // Sample data fallback if backend is not yet populated
  const [users] = useState([
    {
      id: 1,
      username: 'dr.sharma',
      email: 'sharma@kssclinic.com',
      first_name: 'Rajesh',
      last_name: 'Sharma',
      role: 'DOCTOR',
      is_active: true,
      date_joined: '2026-01-15',
    },
    {
      id: 2,
      username: 'reception_desk',
      email: 'frontdesk@kssclinic.com',
      first_name: 'Pooja',
      last_name: 'Verma',
      role: 'RECEPTIONIST',
      is_active: true,
      date_joined: '2026-02-10',
    },
    {
      id: 3,
      username: 'amit_kumar',
      email: 'amit@example.com',
      first_name: 'Amit',
      last_name: 'Kumar',
      role: 'PATIENT',
      is_active: true,
      date_joined: '2026-03-01',
    },
  ]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a' }}>
            User Management
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
            View and manage clinic patients, doctors, and staff members
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Name</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Username</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Email</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Role</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Status</th>
              <th style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>
                  {u.first_name} {u.last_name}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {u.username}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>
                  {u.email}
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                  <span
                    style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor:
                        u.role === 'DOCTOR'
                          ? '#e0f2fe'
                          : u.role === 'ADMIN'
                          ? '#fef3c7'
                          : '#f1f5f9',
                      color:
                        u.role === 'DOCTOR'
                          ? '#0369a1'
                          : u.role === 'ADMIN'
                          ? '#b45309'
                          : '#475569',
                    }}
                  >
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '13px' }}>
                  <span
                    style={{
                      color: u.is_active ? '#10b981' : '#94a3b8',
                      fontWeight: '500',
                    }}
                  >
                    ● {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                  <Link
                    to={`/users/${u.id}`}
                    style={{
                      color: '#0284c7',
                      fontSize: '13px',
                      fontWeight: '500',
                    }}
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserListPage;

