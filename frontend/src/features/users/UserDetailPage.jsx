import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import userApi from '../../api/userApi';

const UserDetailPage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError('');
      try {
        const data = await userApi.getUserById(id);
        setUser(data);
      } catch (err) {
        console.error('Failed to load user details:', err);
        setError('User not found or failed to load.');
      } finally {
        setIsLoading(false);
      }
    };
    if (id) {
      fetchUser();
    }
  }, [id]);

  if (isLoading) {
    return <Loader />;
  }

  if (error || !user) {
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/users" style={{ color: '#64748b', fontSize: '14px' }}>
            ← Back to Users
          </Link>
        </div>
        <div style={{ color: '#ef4444', padding: '16px' }}>{error || 'User not found.'}</div>
      </div>
    );
  }

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
            {user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.username}
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
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.email || 'N/A'}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Phone</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>{user.phone_number || user.phone || 'N/A'}</p>
          </div>
          <div>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Joined On</span>
            <p style={{ fontSize: '15px', fontWeight: '500', marginTop: '2px' }}>
              {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
