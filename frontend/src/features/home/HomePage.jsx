import React, { useState, useCallback } from 'react';
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
import SplashScreen, { hasSplashBeenShown, markSplashAsShown } from '../../components/common/SplashScreen';

const HomePage = () => {
  // Flash / Splash screen runs ONLY ONCE at the start of the website (never again when navigating between pages)
  const [showSplash, setShowSplash] = useState(() => !hasSplashBeenShown());
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleFinishSplash = useCallback(() => {
    markSplashAsShown();
    setShowSplash(false);
  }, []);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  return (
    <div className="homepage-wrapper">
      {/* Flash / Splash Screen only on website initial start */}
      {showSplash && <SplashScreen onFinish={handleFinishSplash} />}

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
