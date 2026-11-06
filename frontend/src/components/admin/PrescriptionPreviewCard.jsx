import React, { useRef, useState } from 'react';
import doctorLogoImg from '../../assets/doctor-portal-logo.png';
import { downloadPrescriptionPdf, generatePrescriptionPdfBase64 } from '../../utils/prescriptionPdf';
import appointmentApi from '../../api/appointmentApi';

const PrescriptionPreviewCard = ({
  prescriptionId,
  patient = {},
  aptNumber: propAptNumber,
  date = '28 Oct 2026',
  consultationType = 'Follow-up',
  diagnosis = 'Skin allergy due to seasonal change.',
  medicines = [],
  additionalInstructions = 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.',
  onSendWhatsApp,
  onDownloadPdf,
  cardId = 'printable-prescription-card',
}) => {
  const cardRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState('');
  const [whatsAppError, setWhatsAppError] = useState('');

  // Normalize patient fields
  const patientName = patient.name || '';
  const patientId = patient.id || patient.patientId || patient.patient_id_ref || '';
  const ageGender = patient.ageGender || `${patient.age ? patient.age + (patient.gender ? ' / ' + patient.gender : '') : (patient.gender || '')}`.trim();
  const contact = patient.phone || patient.contact || patient.mobile || patient.patient_phone || '';
  const aptNumber =
    propAptNumber ||
    patient.aptNumber ||
    patient.apt_number ||
    patient.appointment_id ||
    patient.appointmentId ||
    patient.appointmentNumber ||
    patient.appointment_number ||
    (patient.appointment && typeof patient.appointment === 'object'
      ? (patient.appointment.appointment_id || patient.appointment.id)
      : (patient.appointment && String(patient.appointment).startsWith('APT-')
        ? patient.appointment
        : (patient.appointment ? `APT-${patient.appointment}` : ''))) ||
    '';

  // Normalize medicines list (fallback to exact items from reference image if empty)
  const defaultMedicines = [
    { name: 'Rhus Tox', potency: '30C', dosage: '5 drops', duration: '15 Days', instructions: 'Twice daily' },
    { name: 'Apis Mellifica', potency: '200C', dosage: '5 drops', duration: '10 Days', instructions: 'Once daily' },
  ];

  const medicineList = medicines && medicines.length > 0 && medicines[0].name
    ? medicines
    : defaultMedicines;

  const handlePrintDownload = async () => {
    setDownloadError('');
    setIsDownloading(true);
    try {
      const rxIdentifier = prescriptionId || patient.rxId || patient.id || 'RX';
      const safePatientName = patientName.replace(/\s+/g, '_');
      const filename = `Prescription_${safePatientName}_${rxIdentifier}.pdf`;

      await downloadPrescriptionPdf(cardRef.current, filename);

      if (onDownloadPdf) {
        await onDownloadPdf();
      }
    } catch (err) {
      console.error('Failed to download prescription PDF:', err);
      setDownloadError(
        err?.message || 'Failed to download prescription PDF. Please check your browser permissions or try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleWhatsApp = async () => {
    setWhatsAppError('');
    setWhatsAppSuccess('');
    setDownloadError('');
    setIsSendingWhatsApp(true);

    const rxIdentifier = prescriptionId || patient.rxId || patient.id || 'RX-2026';

    try {
      // 1. Capture exact visual card element to high-res PDF base64
      let clientPdfBase64 = null;
      try {
        clientPdfBase64 = await generatePrescriptionPdfBase64(cardRef.current);
      } catch (pdfCaptureErr) {
        console.warn('Could not capture exact client PDF base64:', pdfCaptureErr);
      }

      if (onSendWhatsApp) {
        const result = await onSendWhatsApp({ pdf_base64: clientPdfBase64 });
        if (result && result.message) {
          setWhatsAppSuccess(result.message);
        } else {
          setWhatsAppSuccess(`Prescription PDF successfully sent via WhatsApp to ${patientName}!`);
        }
      } else {
        const res = await appointmentApi.sendPrescriptionWhatsApp(rxIdentifier, {
          patientName,
          patientId,
          phone: contact,
          ageGender,
          date,
          consultationType,
          diagnosis,
          medicines: medicineList,
          additionalInstructions,
          aptNumber,
          pdf_base64: clientPdfBase64,
        });
        setWhatsAppSuccess(res?.message || `Prescription PDF successfully delivered to ${patientName}'s WhatsApp!`);
      }
    } catch (err) {
      console.error('WhatsApp send error:', err);
      const errMsg =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to deliver prescription via WhatsApp. In Meta test mode, ensure the recipient phone number is verified in the Meta Sandbox list.';
      setWhatsAppError(errMsg);
    } finally {
      setIsSendingWhatsApp(false);
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
        id={cardId}
        ref={cardRef}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px 28px',
          boxSizing: 'border-box',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
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
                fontSize: '16px',
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
                letterSpacing: '0.5px',
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
            backgroundColor: '#e2e8f0',
            margin: '16px 0 16px 0',
          }}
        />

        {/* Patient Metadata Grid */}
        <div
          className="prescription-meta-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '9px 28px',
            fontSize: '12px',
            lineHeight: 1.45,
          }}
        >
          {/* Row 1 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Patient Name
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{patientName}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Patient ID
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{patientId}</span>
          </div>

          {/* Row 2 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Age / Gender
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{ageGender}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Date
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{date}</span>
          </div>

          {/* Row 3 */}
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Contact
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{contact}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
              Consultation
            </span>
            <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
            <span style={{ color: '#0f172a', fontWeight: '700' }}>{consultationType}</span>
          </div>

          {/* Row 4: APT Number */}
          {aptNumber ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ color: '#64748b', width: '100px', flexShrink: 0, fontWeight: '500' }}>
                  APT Number
                </span>
                <span style={{ color: '#64748b', marginRight: '8px' }}>:</span>
                <span style={{ color: '#0f172a', fontWeight: '700' }}>{aptNumber}</span>
              </div>
              <div />
            </>
          ) : null}
        </div>

        {/* Diagnosis */}
        <div style={{ marginTop: '16px' }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: '700',
              color: '#0f172a',
              marginBottom: '4px',
            }}
          >
            Diagnosis
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: '#334155',
              lineHeight: 1.5,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {diagnosis || 'Skin allergy due to seasonal change.'}
          </div>
        </div>

        {/* Medicines Table */}
        <div
          style={{
            marginTop: '16px',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: '480px',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f0fdf4',
                  borderBottom: '1px solid #dcfce7',
                }}
              >
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534', width: '38px', textAlign: 'center' }}>
                  No.
                </th>
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534' }}>
                  Medicine Name
                </th>
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Potency
                </th>
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Dosage
                </th>
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534', textAlign: 'center' }}>
                  Duration
                </th>
                <th style={{ padding: '9px 12px', fontWeight: '700', color: '#166534' }}>
                  Instructions
                </th>
              </tr>
            </thead>
            <tbody>
              {medicineList.map((med, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx === medicineList.length - 1 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafcfb',
                  }}
                >
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#64748b' }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: '9px 12px', fontWeight: '700', color: '#0f172a' }}>
                    {med.name}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#334155' }}>
                    {med.potency}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#334155' }}>
                    {med.dosage}
                  </td>
                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#334155' }}>
                    {med.duration}
                  </td>
                  <td style={{ padding: '9px 12px', color: '#334155' }}>
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
              marginBottom: '4px',
            }}
          >
            Additional Instructions
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#475569',
              lineHeight: 1.55,
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
            }}
          >
            {additionalInstructions || 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'}
          </div>
        </div>

        {/* Doctor Signature Block (Bottom Right) */}
        <div
          style={{
            marginTop: '22px',
            paddingBottom: '4px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
          }}
        >
          {/* Cursive Handwriting Signature */}
          <div
            style={{
              fontFamily: "'Caveat', 'Dancing Script', 'Brush Script MT', cursive, sans-serif",
              fontSize: '26px',
              fontWeight: '600',
              color: '#0f172a',
              letterSpacing: '1px',
              lineHeight: 1,
              marginBottom: '3px',
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
              backgroundColor: '#1e293b',
              marginBottom: '5px',
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

      {/* WhatsApp Success Banner */}
      {whatsAppSuccess && (
        <div
          role="status"
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#15803d',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{whatsAppSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setWhatsAppSuccess('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#15803d',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              padding: '2px 6px',
              textDecoration: 'underline',
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* WhatsApp Error Banner */}
      {whatsAppError && (
        <div
          role="alert"
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#991b1b',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{whatsAppError}</span>
          </div>
          <button
            type="button"
            onClick={() => setWhatsAppError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              padding: '2px 6px',
              textDecoration: 'underline',
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Download Error Banner */}
      {downloadError && (
        <div
          role="alert"
          style={{
            marginTop: '16px',
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#991b1b',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{downloadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadError('')}
            style={{
              background: 'none',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              padding: '2px 6px',
              textDecoration: 'underline',
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. Bottom Action Buttons */}
      <div
        className="prescription-action-buttons-grid"
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
          disabled={isDownloading || isSendingWhatsApp}
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
            cursor: isDownloading || isSendingWhatsApp ? 'not-allowed' : 'pointer',
            opacity: isDownloading || isSendingWhatsApp ? 0.7 : 1,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isDownloading && !isSendingWhatsApp) {
              e.currentTarget.style.backgroundColor = '#f0fdf4';
              e.currentTarget.style.borderColor = '#15803d';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDownloading && !isSendingWhatsApp) {
              e.currentTarget.style.backgroundColor = '#ffffff';
              e.currentTarget.style.borderColor = '#16a34a';
            }
          }}
        >
          {isSendingWhatsApp ? (
            <>
              <div
                style={{
                  width: '15px',
                  height: '15px',
                  border: '2px solid rgba(22, 163, 74, 0.3)',
                  borderTopColor: '#15803d',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Sending via WhatsApp...</span>
            </>
          ) : (
            <>
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
            </>
          )}
        </button>

        {/* Download PDF Button */}
        <button
          type="button"
          onClick={handlePrintDownload}
          disabled={isDownloading || isSendingWhatsApp}
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
            cursor: isDownloading || isSendingWhatsApp ? 'not-allowed' : 'pointer',
            opacity: isDownloading || isSendingWhatsApp ? 0.8 : 1,
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isDownloading && !isSendingWhatsApp) {
              e.currentTarget.style.backgroundColor = '#0f3d21';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDownloading && !isSendingWhatsApp) {
              e.currentTarget.style.backgroundColor = '#14532d';
            }
          }}
        >
          {isDownloading ? (
            <>
              <div
                style={{
                  width: '15px',
                  height: '15px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  borderTopColor: '#ffffff',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
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
            </>
          )}
        </button>
      </div>

      <style>{`
        @media (max-width: 540px) {
          .prescription-action-buttons-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .prescription-meta-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrescriptionPreviewCard;

