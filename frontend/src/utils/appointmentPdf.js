import jsPDF from 'jspdf';

/**
 * Generates and downloads a clean, professional, single-page A4 PDF appointment confirmation slip.
 *
 * @param {Object} data - Appointment details
 * @param {string} data.appointmentId
 * @param {string} data.fullName
 * @param {string} data.mobileNumber
 * @param {string} data.email
 * @param {string} data.doctorName
 * @param {string} data.service
 * @param {string} data.date
 * @param {string} data.time
 * @param {string} [data.clinicAddress]
 * @param {string} [data.clinicPhone]
 */
export const downloadAppointmentConfirmationPdf = (data) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2; // 182mm

  // 1. Top Decorative Accent Bars
  doc.setFillColor(27, 67, 50); // Deep Forest Green (#1b4332)
  doc.rect(0, 0, pageWidth, 5, 'F');
  doc.setFillColor(45, 106, 79); // Accent Emerald (#2d6a4f)
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // 2. Clinic Brand Header
  let y = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(27, 67, 50);
  doc.text('DR. KUMAR TRIPATHI AMPEH (PAT.)', marginX, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(45, 106, 79);
  doc.text('HOMEOPATHY CLINIC & WELLNESS CENTER', marginX, y);

  y += 4.5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Specialized Classical Homeopathy & Integrative Health Care', marginX, y);

  // Right Side Header Badge & Receipt Info
  const badgeWidth = 28;
  const badgeHeight = 7;
  const badgeX = pageWidth - marginX - badgeWidth;
  doc.setFillColor(220, 252, 231); // Light mint
  doc.roundedRect(badgeX, 13, badgeWidth, badgeHeight, 3.5, 3.5, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, 13, badgeWidth, badgeHeight, 3.5, 3.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(21, 128, 61);
  doc.text('CONFIRMED', badgeX + badgeWidth / 2, 17.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('APPOINTMENT RECEIPT', pageWidth - marginX, 24, { align: 'right' });

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued On: ${todayStr}`, pageWidth - marginX, 28, { align: 'right' });

  // Divider Line
  y = 31;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, pageWidth - marginX, y);

  // 3. Status Confirmation Banner
  y = 35;
  const bannerHeight = 17;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(marginX, y, contentWidth, bannerHeight, 3, 3, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, contentWidth, bannerHeight, 3, 3, 'S');

  // Checkmark circle graphic
  const circleX = marginX + 8;
  const circleY = y + bannerHeight / 2;
  doc.setFillColor(22, 163, 74);
  doc.circle(circleX, circleY, 4.5, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.8);
  // draw checkmark: short leg then long leg
  doc.line(circleX - 2, circleY, circleX - 0.5, circleY + 1.8);
  doc.line(circleX - 0.5, circleY + 1.8, circleX + 2.2, circleY - 1.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 83, 45);
  doc.text('Your Appointment is Confirmed!', marginX + 16, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(22, 101, 52);
  doc.text('Thank you for choosing Dr. Kumar Tripathi Ampeh (Pat.). We look forward to seeing you at the clinic.', marginX + 16, y + 12);

  // 4. Appointment Details Card
  y = 56;
  const cardHeight = 112;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(marginX, y, contentWidth, cardHeight, 3.5, 3.5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, y, contentWidth, cardHeight, 3.5, 3.5, 'S');

  // Card Header Bar
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, contentWidth, 10, 3.5, 3.5, 'F');
  // square off the bottom corners of header
  doc.rect(marginX, y + 5, contentWidth, 5, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, y + 10, marginX + contentWidth, y + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text('APPOINTMENT & PATIENT DETAILS', marginX + 6, y + 6.8);

  // Card Content: 2 Balanced Columns
  const col1X = marginX + 6;
  const col1LabelWidth = 34;
  const col2X = marginX + contentWidth / 2 + 4;
  const col2LabelWidth = 32;

  // Row heights
  let rowY = y + 18;
  const rowGap = 13;

  // Column Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PATIENT IDENTIFIERS', col1X, rowY - 3.5);
  doc.text('CONSULTATION SCHEDULE', col2X, rowY - 3.5);

  // Row 1: Appointment ID & Doctor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Appointment ID', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text(String(data.appointmentId || 'APT-CONFIRMED'), col1X + col1LabelWidth, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Doctor', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.doctorName || 'Dr. K. Tripathi Ampeh (Pat.)'), col2X + col2LabelWidth, rowY);

  // Row 2: Patient Name & Service
  rowY += rowGap;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Patient Name', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.fullName || '-'), col1X + col1LabelWidth, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Service', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.service || 'Homeopathy Consultation'), col2X + col2LabelWidth, rowY);

  // Row 3: Mobile Number & Date
  rowY += rowGap;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Mobile Number', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.mobileNumber || '-'), col1X + col1LabelWidth, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Date', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.date || '-'), col2X + col2LabelWidth, rowY);

  // Row 4: Email & Time
  rowY += rowGap;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Email Address', col1X, rowY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  const emailText = String(data.email || 'Not specified');
  doc.text(emailText.length > 28 ? `${emailText.substring(0, 26)}...` : emailText, col1X + col1LabelWidth, rowY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Time Slot', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 67, 50);
  doc.text(String(data.time || '09:00 AM'), col2X + col2LabelWidth, rowY);

  // Horizontal divider inside card
  rowY += 9;
  doc.setDrawColor(241, 245, 249);
  doc.line(col1X, rowY, marginX + contentWidth - 6, rowY);

  // Row 5: Clinic Address & Consultation Type
  rowY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Clinic Address', col1X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('123 Clinic Street, Your City,', col1X + col1LabelWidth, rowY);
  doc.text('Your State - 123456', col1X + col1LabelWidth, rowY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Consultation Type', col2X, rowY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text('In-Person (Clinic Visit)', col2X + col2LabelWidth, rowY);

  // 5. Important Instructions Section
  y = 173;
  const noteHeight = 52;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, y, contentWidth, noteHeight, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, contentWidth, noteHeight, 3, 3, 'S');

  // Note Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(marginX, y, contentWidth, 8, 3, 3, 'F');
  doc.rect(marginX, y + 4, contentWidth, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('IMPORTANT GUIDELINES FOR PATIENTS', marginX + 6, y + 5.5);

  let noteY = y + 14;
  const noteItems = [
    { title: 'Arrival Time:', text: 'Please arrive 10-15 minutes prior to your scheduled consultation time.' },
    { title: 'Medical Records:', text: 'Bring your previous prescriptions, lab investigation reports, and current medication list.' },
    { title: 'Cancellation / Reschedule:', text: 'If you need to reschedule, kindly notify the clinic at least 2 hours in advance.' },
    { title: 'Clinic Helpline:', text: 'For directions, queries, or assistance, contact us at +91 98765 43210.' },
  ];

  noteItems.forEach((item) => {
    // bullet dot
    doc.setFillColor(45, 106, 79);
    doc.circle(marginX + 7, noteY - 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(item.title, marginX + 11, noteY);

    const titleWidth = doc.getTextWidth(item.title) + 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(item.text, marginX + 11 + titleWidth, noteY);

    noteY += 8.5;
  });

  // 6. Clinic Contact & Verification Footer Box
  y = 230;
  const footerBoxHeight = 28;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(marginX, y, contentWidth, footerBoxHeight, 3, 3, 'F');
  doc.setDrawColor(220, 252, 231);
  doc.setLineWidth(0.35);
  doc.roundedRect(marginX, y, contentWidth, footerBoxHeight, 3, 3, 'S');

  // Left column in footer box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 83, 45);
  doc.text('Dr. Kumar Tripathi Ampeh Homeopathy Clinic', marginX + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('123 Clinic Street, Your City, Your State - 123456', marginX + 6, y + 12.5);
  doc.text('Phone: +91 98765 43210  |  Email: contact@homeopathyclinic.com', marginX + 6, y + 17.5);
  doc.text('Website: www.kssclinic.com  |  OPD Hours: Mon - Sat (09:00 AM - 08:00 PM)', marginX + 6, y + 22.5);

  // Right column Stamp / Verified Seal
  const stampX = marginX + contentWidth - 48;
  const stampY = y + 5;
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.roundedRect(stampX, stampY, 42, 18, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text('SYSTEM VERIFIED', stampX + 21, stampY + 6, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Official Appointment Record', stampX + 21, stampY + 11, { align: 'center' });
  doc.text('Valid without signature', stampX + 21, stampY + 15, { align: 'center' });

  // 7. Bottom Disclaimer & Decorative Line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    '© 2026 Dr. Kumar Tripathi Ampeh (Pat.) Homeopathy Clinic. All rights reserved. Generated automatically via KSS Patient Portal.',
    pageWidth / 2,
    266,
    { align: 'center' }
  );

  doc.setFillColor(27, 67, 50);
  doc.rect(0, pageHeight - 3, pageWidth, 3, 'F');

  // Trigger download
  const safeId = (data.appointmentId || 'CONFIRMATION').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Appointment_Confirmation_${safeId}.pdf`);
};

