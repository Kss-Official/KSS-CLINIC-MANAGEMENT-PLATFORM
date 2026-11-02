import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Generates and downloads a high-fidelity PDF from the prescription preview card element.
 * Preserves the exact styling, logo, layout, doctor signature, and patient metadata.
 *
 * @param {HTMLElement} element - The DOM element containing the prescription card.
 * @param {string} filename - Desired filename for the PDF download.
 * @returns {Promise<boolean>}
 */
export const downloadPrescriptionPdf = async (element, filename = 'Prescription.pdf') => {
  if (!element) {
    throw new Error('Prescription preview content could not be located on the page.');
  }

  try {
    // Ensure all images within the card are loaded before capture
    const images = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // continue even if an image fails to prevent total failure
        });
      })
    );

    // Capture element with 2x scale for print-quality sharpness
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 10000,
    });

    const imgData = canvas.toDataURL('image/png');
    if (!imgData || imgData === 'data:,') {
      throw new Error('Canvas render was empty.');
    }

    // Standard A4 portrait (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    if (contentHeight <= pdfHeight - margin * 2) {
      pdf.addImage(imgData, 'PNG', margin, margin + 4, contentWidth, contentHeight, '', 'FAST');
    } else {
      let heightLeft = contentHeight;
      let position = margin;

      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, '', 'FAST');
      heightLeft -= (pdfHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - contentHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight, '', 'FAST');
        heightLeft -= (pdfHeight - margin * 2);
      }
    }

    const safeFilename = (filename || 'Prescription.pdf')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/\s+/g, '_');
    const finalFilename = safeFilename.toLowerCase().endsWith('.pdf') ? safeFilename : `${safeFilename}.pdf`;

    pdf.save(finalFilename);
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    throw new Error(err.message || 'An error occurred while generating the prescription PDF.');
  }
};

