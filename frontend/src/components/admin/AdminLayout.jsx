import React, { useState, useEffect, createContext, useContext } from 'react';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import NewAppointmentModal from './NewAppointmentModal';
import NewPrescriptionModal from './NewPrescriptionModal';
import ViewPatientHistoryModal from './ViewPatientHistoryModal';
import ViewAppointmentModal from './ViewAppointmentModal';
import ViewPrescriptionModal from './ViewPrescriptionModal';

export const AdminContext = createContext({
  openNewAppointment: () => {},
  openNewPrescription: () => {},
  openPatientHistory: (patient) => {},
  openViewAppointment: (appointment) => {},
  openViewPrescription: (prescription) => {},
});

export const useAdmin = () => useContext(AdminContext);

const AdminLayout = ({ children }) => {
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [selectedPatientForPrescription, setSelectedPatientForPrescription] = useState(null);
  const [isPatientHistoryModalOpen, setIsPatientHistoryModalOpen] = useState(false);
  const [selectedPatientForHistory, setSelectedPatientForHistory] = useState(null);
  const [isAppointmentDetailsModalOpen, setIsAppointmentDetailsModalOpen] = useState(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState(null);
  const [isPrescriptionDetailsModalOpen, setIsPrescriptionDetailsModalOpen] = useState(false);
  const [selectedPrescriptionForDetails, setSelectedPrescriptionForDetails] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Apply admin-mode lock to html and body while in Admin Portal
  useEffect(() => {
    document.documentElement.classList.add('admin-mode');
    document.body.classList.add('admin-mode');
    return () => {
      document.documentElement.classList.remove('admin-mode');
      document.body.classList.remove('admin-mode');
    };
  }, []);

  const openNewAppointment = () => {
    setIsAppointmentModalOpen(true);
  };

  const closeNewAppointment = () => {
    setIsAppointmentModalOpen(false);
  };

  const openNewPrescription = (patient = null) => {
    setSelectedPatientForPrescription(patient);
    setIsPrescriptionModalOpen(true);
  };

  const closeNewPrescription = () => {
    setIsPrescriptionModalOpen(false);
  };

  const openPatientHistory = (patient) => {
    setSelectedPatientForHistory(patient);
    setIsPatientHistoryModalOpen(true);
  };

  const closePatientHistory = () => {
    setIsPatientHistoryModalOpen(false);
  };

  const openViewAppointment = (appointment) => {
    setSelectedAppointmentForDetails(appointment);
    setIsAppointmentDetailsModalOpen(true);
  };

  const closeViewAppointment = () => {
    setIsAppointmentDetailsModalOpen(false);
  };

  const openViewPrescription = (prescription) => {
    setSelectedPrescriptionForDetails(prescription);
    setIsPrescriptionDetailsModalOpen(true);
  };

  const closeViewPrescription = () => {
    setIsPrescriptionDetailsModalOpen(false);
  };

  const isAnyModalOpen =
    isAppointmentModalOpen ||
    isPrescriptionModalOpen ||
    isPatientHistoryModalOpen ||
    isAppointmentDetailsModalOpen ||
    isPrescriptionDetailsModalOpen;

  // Lock background screen completely whenever any modal is opened
  useEffect(() => {
    if (isAnyModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;

      // Prevent layout shift from disappearing scrollbar
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      return () => {
        document.body.classList.remove('modal-open');
        document.documentElement.classList.remove('modal-open');
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;
      };
    }
  }, [isAnyModalOpen]);

  return (
    <AdminContext.Provider
      value={{
        openNewAppointment,
        openNewPrescription,
        openPatientHistory,
        openViewAppointment,
        openViewPrescription,
      }}
    >
      <div
        className="admin-portal-wrapper"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: '#fbfcfc',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Fixed Top Header (70px height) */}
        <AdminHeader onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Portal Body: Flex container occupying remaining viewport height */}
        <div
          className="admin-portal-body"
          style={{
            flex: 1,
            height: 'calc(100vh - 70px)',
            display: 'flex',
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Fixed Left Sidebar (230px width, height 100% of body) */}
          <AdminSidebar
            isOpenMobile={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />

          {/* Dedicated Main Scroll Area (Only this container scrolls) */}
          <div
            className="admin-main-scroll-area"
            style={{
              flex: 1,
              height: '100%',
              overflowY: isAnyModalOpen ? 'hidden' : 'auto',
              overflowX: 'hidden',
              overscrollBehavior: 'contain',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fbfcfc',
              position: 'relative',
            }}
          >
            {/* Main Content */}
            <main
              className="admin-main-content"
              style={{
                padding: '28px 36px 36px 36px',
                flex: '1 0 auto',
                boxSizing: 'border-box',
                maxWidth: '100%',
              }}
            >
              {children}
            </main>

            {/* Fixed-Positioned Admin Footer (always at bottom of content) */}
            <footer
              className="admin-footer"
              style={{
                flexShrink: 0,
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#ffffff',
                padding: '16px 36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12.5px',
                color: '#64748b',
                boxSizing: 'border-box',
              }}
            >
              <span>© 2026 Homeopathy Clinic Admin Portal. All rights reserved.</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span style={{ cursor: 'pointer' }}>Privacy Policy</span>
                <span style={{ cursor: 'pointer' }}>Terms of Service</span>
                <span style={{ cursor: 'pointer' }}>Help &amp; Support</span>
              </div>
            </footer>
          </div>
        </div>

        {/* Modal 1: New Appointment with backdrop blur */}
        <NewAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={closeNewAppointment}
          onSave={(data) => {
            alert(`Appointment scheduled successfully for ${data.patient?.name || 'patient'}!`);
            closeNewAppointment();
          }}
        />

        {/* Modal 2: New Prescription with backdrop blur */}
        <NewPrescriptionModal
          isOpen={isPrescriptionModalOpen}
          onClose={closeNewPrescription}
          onSave={(data) => {
            alert(`Prescription created successfully for ${data.patient?.name || 'patient'}!`);
            closeNewPrescription();
          }}
        />

        {/* Modal 3: View Patient History with backdrop blur */}
        <ViewPatientHistoryModal
          isOpen={isPatientHistoryModalOpen}
          onClose={closePatientHistory}
          patient={selectedPatientForHistory}
          onViewAppointment={openViewAppointment}
          onViewPrescription={openViewPrescription}
        />

        {/* Modal 4: View Appointment Details with backdrop blur */}
        <ViewAppointmentModal
          isOpen={isAppointmentDetailsModalOpen}
          onClose={closeViewAppointment}
          appointment={selectedAppointmentForDetails}
        />

        {/* Modal 5: View Prescription Details with backdrop blur */}
        <ViewPrescriptionModal
          isOpen={isPrescriptionDetailsModalOpen}
          onClose={closeViewPrescription}
          prescription={selectedPrescriptionForDetails}
          onNavigateToPatient={(rx) => {
            closeViewPrescription();
            openPatientHistory({
              id: rx.patientId || 'PAT-1001',
              name: rx.name,
              ageGender: rx.ageGender,
              mobile: rx.mobile || '+91 98765 43210',
            });
          }}
        />
      </div>
    </AdminContext.Provider>
  );
};

export default AdminLayout;
