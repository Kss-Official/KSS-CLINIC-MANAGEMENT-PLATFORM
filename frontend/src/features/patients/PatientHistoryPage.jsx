import React, { useState, useEffect, useCallback } from 'react';
import appointmentApi from '../../api/appointmentApi';
import { useAdmin } from '../../components/admin/AdminLayout';
import bannerHerbsImg from '../../assets/admin-banner-herbs.png';
import ActionDropdown from '../../components/admin/ActionDropdown';
import AdminPagination from '../../components/admin/AdminPagination';

const PatientHistoryPage = () => {
  const { openPatientHistory, openNewAppointment, openNewPrescription } = useAdmin();

  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pageSize, setPageSize] = useState('10 page');
  const [currentPage, setCurrentPage] = useState(1);

  const [patientsList, setPatientsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await appointmentApi.getPatients();
      setPatientsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load patients from Neon database:', err);
      setError('Failed to load patient history from database.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();

    const handleDataChanged = () => {
      fetchPatients();
    };

    window.addEventListener('appointment-booked', handleDataChanged);
    window.addEventListener('prescription-created', handleDataChanged);
    window.addEventListener('focus', fetchPatients);

    return () => {
      window.removeEventListener('appointment-booked', handleDataChanged);
      window.removeEventListener('prescription-created', handleDataChanged);
      window.removeEventListener('focus', fetchPatients);
    };
  }, [fetchPatients]);

  const handleUpdatePatientStatus = async (patientId, newStatus) => {
    setPatientsList((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status: newStatus } : p))
    );
    try {
      await appointmentApi.updatePatient(patientId, { status: newStatus });
    } catch (err) {
      console.error('Failed to update patient status in Neon database:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return { bg: '#e8f7ee', color: '#1e7e34' };
      case 'Inactive':
        return { bg: '#f1f5f9', color: '#64748b' };
      case 'Follow-up':
        return { bg: '#fef7e6', color: '#b45309' };
      default:
        return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setGenderFilter('All');
    setAgeFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  const filteredPatients = patientsList.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mobile.includes(searchQuery) ||
      (item.primaryConcern && item.primaryConcern.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'All' || item.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesGender =
      genderFilter === 'All' ||
      (genderFilter === 'Male' && item.ageGender.toLowerCase().includes('male') && !item.ageGender.toLowerCase().includes('female')) ||
      (genderFilter === 'Female' && item.ageGender.toLowerCase().includes('female'));

    const ageNum = parseInt(item.ageGender.match(/\d+/)?.[0] || '0', 10);
    const matchesAge =
      ageFilter === 'All' ||
      (ageFilter === 'Under 30' && ageNum < 30) ||
      (ageFilter === '30 - 50' && ageNum >= 30 && ageNum <= 50) ||
      (ageFilter === '50+' && ageNum >= 50);

    return matchesSearch && matchesStatus && matchesGender && matchesAge;
  });

  // Dynamic pagination calculation based on data and page size
  const limit = parseInt(pageSize, 10) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / limit));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedPatients = filteredPatients.slice((validPage - 1) * limit, validPage * limit);

  // Dynamic metrics derived directly from Neon database records
  const totalPatientsCount = patientsList.length;
  const activePatientsCount = patientsList.filter((p) => (p.status || 'Active').toLowerCase() === 'active').length;
  const followUpPatientsCount = patientsList.filter((p) => (p.status || '').toLowerCase() === 'follow-up').length;
  const totalConsultationsCount = patientsList.reduce((acc, p) => acc + (parseInt(p.totalVisits, 10) || 1), 0);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* 1. Top Banner */}
      <div
        style={{
          backgroundColor: '#eaf5ed',
          borderRadius: '20px',
          padding: '0 40px',
          height: '158px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          overflow: 'hidden',
          position: 'relative',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ zIndex: 2 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#224938',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            PATIENT HISTORY
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: '800',
              color: '#0a1c2a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}
          >
            Patient History
          </h1>
          <p
            style={{
              fontSize: '15px',
              color: '#627585',
              margin: 0,
            }}
          >
            View complete patient records including appointments, prescription and consultation details.
          </p>
        </div>

        {/* Herbal Mortar Illustration */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            height: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            pointerEvents: 'none',
          }}
        >
          <img
            src={bannerHerbsImg}
            alt="Herbal Medicine"
            style={{
              height: '158px',
              maxHeight: '100%',
              width: 'auto',
              display: 'block',
              objectFit: 'contain',
              objectPosition: 'bottom right',
            }}
          />
        </div>
      </div>

      {/* 2. Four Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
          marginBottom: '26px',
        }}
      >
        {/* Card 1: Total Patients */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#dafaea',
              color: '#0f766e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Total Patients
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {totalPatientsCount}
            </span>
          </div>
        </div>

        {/* Card 2: Active Patients */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#e2eefe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Active Patients
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {activePatientsCount}
            </span>
          </div>
        </div>

        {/* Card 3: Follow-up patients */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#fef5d2',
              color: '#b45309',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Follow-up patients
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              {followUpPatientsCount}
            </span>
          </div>
        </div>

        {/* Card 4: Total consultation */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #e5eaf1',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#f5edff',
              color: '#8631d1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13.5px', color: '#64748b', fontWeight: '500' }}>
              Total consultation
            </span>
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1, marginTop: '4px' }}>
              196
            </span>
          </div>
        </div>
      </div>

      {/* 3. Table Container */}
      <div
        className="admin-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}
      >
        {/* Filter Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '22px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 650px' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by patient name, mobile number or patient ID..."
                style={{
                  width: '100%',
                  height: '38px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#1e4620')}
                onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            {/* All Gender Dropdown */}
            <select
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            {/* All Age Groups Dropdown */}
            <select
              value={ageFilter}
              onChange={(e) => {
                setAgeFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Age Groups</option>
              <option value="Under 30">Under 30</option>
              <option value="30 - 50">30 - 50</option>
              <option value="50+">50+</option>
            </select>

            {/* All Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                fontSize: '13px',
                color: '#334155',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Follow-up">Follow-up</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={resetFilters}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#475569',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1e4620')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#475569')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Reset Filters</span>
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Patient ID</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Patient Name</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Age / Gender</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Mobile Number</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Last Visit</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Total Visits</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b' }}>Status</th>
                <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: '#64748b', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#64748b', fontSize: '13.5px' }}>
                    Loading patient history from database...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#dc2626', fontSize: '13.5px' }}>
                    <div>{error}</div>
                    <button
                      type="button"
                      onClick={fetchPatients}
                      style={{
                        marginTop: '10px',
                        padding: '6px 14px',
                        backgroundColor: '#1e4620',
                        color: '#ffffff',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '12.5px',
                      }}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: '13.5px' }}>
                    No patient records found in database.
                  </td>
                </tr>
              ) : (
                paginatedPatients.map((p, idx) => {
                const badge = getStatusBadge(p.status);
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {p.id}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '700', color: '#0f172a' }}>
                      {p.name}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                      {p.ageGender}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#64748b' }}>
                      {p.mobile}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', color: '#334155' }}>
                      {p.lastVisit}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13.5px', fontWeight: '600', color: '#0f172a' }}>
                      {p.totalVisits}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {/* View History Button triggers ViewPatientHistoryModal! */}
                        <button
                          type="button"
                          onClick={() => openPatientHistory(p)}
                          style={{
                            padding: '5px 14px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#ffffff',
                            color: '#334155',
                            fontSize: '12.5px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          View History
                        </button>
                        <ActionDropdown
                          items={[
                            {
                              label: 'View History',
                              icon: '👤',
                              onClick: () => openPatientHistory(p),
                            },
                            {
                              label: 'Book Appointment',
                              icon: '📅',
                              onClick: () => openNewAppointment(),
                            },
                            {
                              label: 'Create Prescription',
                              icon: '🌿',
                              onClick: () => openNewPrescription(),
                            },
                            {
                              label: 'Set as Active',
                              icon: '✓',
                              onClick: () => handleUpdatePatientStatus(p.id, 'Active'),
                            },
                            {
                              label: 'Set as Follow-up',
                              icon: '⏱️',
                              onClick: () => handleUpdatePatientStatus(p.id, 'Follow-up'),
                            },
                            {
                              label: 'Set as Inactive',
                              icon: '✕',
                              danger: true,
                              onClick: () => handleUpdatePatientStatus(p.id, 'Inactive'),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Footer */}
        <AdminPagination
          currentPage={validPage}
          totalRecords={filteredPatients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newPageSize) => {
            setPageSize(newPageSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={['10 page', '20 page', '50 page']}
          recordType="patients"
        />
      </div>
    </div>
  );
};

export default PatientHistoryPage;
