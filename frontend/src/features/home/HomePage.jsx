import React, { useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import HeroSection from './HeroSection';
import AboutSection from './AboutSection';
import ServicesSection from './ServicesSection';
import DoctorSection from './DoctorSection';
import CredentialsSection from './CredentialsSection';
import TestimonialsSection from './TestimonialsSection';
import ClinicGallerySection from './ClinicGallerySection';
import CtaBannerSection from './CtaBannerSection';
import Footer from '../../components/layout/Footer';
import AppointmentModal from '../../components/AppointmentModal';
import SplashScreen from '../../components/common/SplashScreen';

const HomePage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  return (
    <div className="homepage-wrapper">
      {/* Flash / Splash Screen before frontpage displays */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {/* Top Navbar */}
      <Navbar onOpenBooking={handleOpenBooking} />

      {/* Main Content Sections */}
      <main>
        {/* 1. Hero Section */}
        <HeroSection onOpenBooking={handleOpenBooking} />

        {/* 2. About Our Clinic */}
        <AboutSection />

        {/* 3. Our Service */}
        <ServicesSection />

        {/* 4. Meet Our Doctor */}
        <DoctorSection onOpenBooking={handleOpenBooking} />

        {/* 5. Our Credentials */}
        <CredentialsSection />

        {/* 6. Patient Stories (Testimonials) */}
        <TestimonialsSection />

        {/* 7. Our Clinic (Ambience Gallery) */}
        <ClinicGallerySection />

        {/* 8. Ready to Start Your Wellness Journey (CTA Banner) */}
        <CtaBannerSection onOpenBooking={handleOpenBooking} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Appointment Booking Modal */}
      <AppointmentModal isOpen={isBookingOpen} onClose={handleCloseBooking} />
    </div>
  );
};

export default HomePage;
