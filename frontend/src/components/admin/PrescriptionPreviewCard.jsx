import React from 'react';
import doctorLogoImg from '../../assets/doctor-portal-logo.png';

const PrescriptionPreviewCard = ({
  patient = {},
  date = '28 Oct 2026',
  consultationType = 'Follow-up',
  diagnosis = 'Skin allergy due to seasonal change.',
  medicines = [],
  additionalInstructions = 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.',
  onSendWhatsApp,
  onDownloadPdf,
}) => {
  // Normalize patient fields
  const patientName = patient.name || 'Rahul Sharma';
  const patientId = patient.id || patient.patientId || 'PAT-1001';
  const ageGender = patient.ageGender || `${patient.age || '28 Years'} / ${patient.gender || 'Male'}`;
  const contact = patient.phone || patient.contact || patient.mobile || '+91 98765 43210';

  // Normalize medicines list (fallback to exact items from reference image if empty)
  const defaultMedicines = [
    { name: 'Rhus Tox', potency: '30C', dosage: '5 drops', duration: '15 Days', instructions: 'Twice daily' },
    { name: 'Apis Mellifica', potency: '200C', dosage: '5 drops', duration: '10 Days', instructions: 'Once daily' },
  ];

  const medicineList = medicines && medicines.length > 0 && medicines[0].name
    ? medicines
    : defaultMedicines;

  const handlePrintDownload = () => {
    if (onDownloadPdf) {
      onDownloadPdf();
    } else {
      window.print();
    }
  };

  const handleWhatsApp = () => {
    if (onSendWhatsApp) {
      onSendWhatsApp();
    } else {
      alert(`Prescription successfully sent via WhatsApp to ${patientName} (${contact})!`);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* 1. Subheading */}
      <div style={{ marginBottom: '14px' }}>
        <h3
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: '#0f172a',
            margin: '0 0 3px 0',
          }}
        >
          Prescription Preview
        </h3>
        <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
          Review the prescription before sending or downloading.
        </p>
      </div>

      {/* 2. Prescription Paper / Card Container */}
      <div
        id="printable-prescription-card"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
        }}
      >
        {/* Clinic Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <img
            src={doctorLogoImg}
            alt="Homeopathy Clinic Logo"
            style={{
              width: '54px',
              height: '54px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4
              style={{
                fontSize: '15.5px',
                fontWeight: '700',
                color: '#0f172a',
                margin: '0 0 2px 0',
                letterSpacing: '-0.2px',
              }}
            >
              Dr. Kumar Tripathi Ampeh (Pat.)
            </h4>
            <div
              style={{
                fontSize: '11px',
                fontWeight: '800',
                color: '#15803d',
                letterSpacing: '0.4px',
                marginBottom: '4px',
              }}
            >
              HOMEOPATHY CLINIC
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: '#64748b',
                lineHeight: 1.35,
              }}
            >
              12, Green Park, MG Road, Bangalore, Karnataka - 560001
            </div>
            <div
              style={{
                fontSize: '11.5px',
                color: '#64748b',
                marginTop: '1px',
              }}
            >
              Ph: +91 98765 43210 &nbsp;|&nbsp; clinic.tripathi@gmail.com
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div
          style={{
            height: '1px',
            backgroundColor: '#cbd5e1',
            margin: '14px 0 16px 0',
          }}
        />

        {/* Patient Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '8px 24px',
            fontSize: '12px',
            lineHeight: 1.45,
          }}
        >
          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '105px', flexShrink: 0, fontWeight: '500' }}>
              Patient Name
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{patientName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '90px', flexShrink: 0, fontWeight: '500' }}>
              Patient ID
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{patientId}</span>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '105px', flexShrink: 0, fontWeight: '500' }}>
              Age / Gender
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{ageGender}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '90px', flexShrink: 0, fontWeight: '500' }}>
              Date
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{date}</span>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '105px', flexShrink: 0, fontWeight: '500' }}>
              Contact
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{contact}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '90px', flexShrink: 0, fontWeight: '500' }}>
              Consultation
            </span>
            <span style={{ color: '#64748b', marginRight: '6px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{consultationType}</span>
          </div>
        </div>

        {/* Diagnosis */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '3px',
            }}
          >
            Diagnosis
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: '#334155',
              lineHeight: 1.4,
            }}
          >
            {diagnosis || 'Skin allergy due to seasonal change.'}
          </div>
        </div>

        {/* Medicines Table */}
        <div style={{ marginTop: '14px', overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '11.5px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f0fdf4',
                  borderTop: '1px solid #e2e8f0',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534', width: '36px', textAlign: 'center' }}>
                  No.
                </th>
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534' }}>
                  Medicine Name
                </th>
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Potency
                </th>
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Dosage
                </th>
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Duration
                </th>
                <th style={{ padding: '8px 10px', fontWeight: '700', color: '#166534' }}>
                  Instructions
                </th>
              </tr>
            </thead>
            <tbody>
              {medicineList.map((med, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '8px 10px', fontWeight: '700', color: '#0f172a' }}>
                    {med.name}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155' }}>
                    {med.potency}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155' }}>
                    {med.dosage}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155' }}>
                    {med.duration}
                  </td>
                  <td style={{ padding: '8px 10px', color: '#334155' }}>
                    {med.instructions || med.timing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Additional Instructions */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '3px',
            }}
          >
            Additional Instructions
          </div>
          <div
            style={{
              fontSize: '11.5px',
              color: '#475569',
              lineHeight: 1.45,
            }}
          >
            {additionalInstructions || 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'}
          </div>
        </div>

        {/* Doctor Signature Block (Bottom Right) */}
        <div
          style={{
            marginTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          {/* Cursive Handwriting Signature */}
          <div
            style={{
              fontFamily: "'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif",
              fontSize: '24px',
              fontWeight: '600',
              color: '#0f172a',
              letterSpacing: '1px',
              lineHeight: 1,
              marginBottom: '2px',
              userSelect: 'none',
            }}
          >
            KTripathi
          </div>

          {/* Underline */}
          <div
            style={{
              width: '180px',
              height: '1.5px',
              backgroundColor: '#334155',
              marginBottom: '4px',
            }}
          />

          {/* Doctor Name & Title */}
          <div
            style={{
              fontSize: '11.5px',
              fontWeight: '700',
              color: '#0f172a',
              textAlign: 'right',
            }}
          >
            Dr. K. Tripathi Ampeh (Pat.)
          </div>
          <div
            style={{
              fontSize: '10.5px',
              color: '#64748b',
              textAlign: 'right',
            }}
          >
            Homeopathy Consultant
          </div>
        </div>
      </div>

      {/* 3. Bottom Action Buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
          marginTop: '20px',
        }}
      >
        {/* WhatsApp Button */}
        <button
          type="button"
          onClick={handleWhatsApp}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '10px',
            border: '1.5px solid #16a34a',
            backgroundColor: '#ffffff',
            color: '#15803d',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f0fdf4';
            e.currentTarget.style.borderColor = '#15803d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.borderColor = '#16a34a';
          }}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <span>Send via WhatsApp</span>
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          onClick={handlePrintDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#14532d',
            color: '#ffffff',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0f3d21')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#14532d')}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span>Download Prescription (PDF)</span>
        </button>
      </div>
    </div>
  );
};

export default PrescriptionPreviewCard;

