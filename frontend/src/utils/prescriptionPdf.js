import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Creates an isolated off-screen clone with standard desktop A4 proportions (760px width).
 * This ensures that when capturing on mobile devices or narrow viewports:
 * 1. The document is rendered in its pristine, full-width desktop layout (2-column metadata, full table).
 * 2. The medicines table columns are never cut off or clipped by mobile horizontal scroll.
 * 3. The aspect ratio is standard A4 printable proportion, so jsPDF never slices the doctor's signature
 *    across two pages or creates awkward page splits.
 *
 * @param {HTMLElement} sourceElement
 * @returns {{ container: HTMLDivElement, clone: HTMLElement }}
 */
const createCaptureClone = (sourceElement) => {
  const clone = sourceElement.cloneNode(true);

  // Add capture marker class so scoped CSS rules prevent mobile media queries from overriding styles
  clone.classList.add('prescription-pdf-capture');

  // Remove any action buttons, alerts, or status banners inside the clone
  clone.querySelectorAll('.prescription-action-buttons-grid, [role="alert"], [role="status"], button').forEach((el) => {
    el.remove();
  });

  // Create isolated off-screen container with fixed desktop A4-proportional width (760px)
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '760px';
  container.style.minWidth = '760px';
  container.style.maxWidth = '760px';
  container.style.zIndex = '-99999';
  container.style.backgroundColor = '#ffffff';
  container.style.opacity = '1';
  container.style.pointerEvents = 'none';

  // Apply explicit desktop styling to clone container
  clone.style.width = '760px';
  clone.style.minWidth = '760px';
  clone.style.maxWidth = '760px';
  clone.style.boxSizing = 'border-box';
  clone.style.padding = '24px 28px 28px';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '16px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.border = '1px solid #e2e8f0';

  // Table container in clone: ensure overflow visible and table takes 100% width
  const tableContainer = clone.querySelector('.prescription-table-container');
  if (tableContainer) {
    tableContainer.style.overflow = 'visible';
    tableContainer.style.width = '100%';
    tableContainer.style.border = '1px solid #e2e8f0';
    tableContainer.style.borderRadius = '8px';
  }
  const table = clone.querySelector('.prescription-table');
  if (table) {
    table.style.width = '100%';
    table.style.minWidth = '100%';
    table.style.tableLayout = 'auto';
    table.style.fontSize = '12px';
  }
  clone.querySelectorAll('.prescription-table th, .prescription-table td').forEach((cell) => {
    cell.style.padding = '9px 12px';
    cell.style.whiteSpace = 'normal';
  });

  // Metadata grid in clone: ensure 2 columns
  const metaGrid = clone.querySelector('.prescription-meta-grid');
  if (metaGrid) {
    metaGrid.style.display = 'grid';
    metaGrid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    metaGrid.style.gap = '9px 28px';
    metaGrid.style.fontSize = '12px';
  }

  container.appendChild(clone);
  document.body.appendChild(container);

  return { container, clone };
};

/**
 * Generates and downloads a high-fidelity PDF from the prescription preview card element.
 * Preserves the exact styling, logo, layout, doctor signature, and patient metadata.
 * Works seamlessly across both mobile and desktop viewports.
 *
 * @param {HTMLElement} element - The DOM element containing the prescription card.
 * @param {string} filename - Desired filename for the PDF download.
 * @returns {Promise<boolean>}
 */
export const downloadPrescriptionPdf = async (element, filename = 'Prescription.pdf') => {
  if (!element) {
    throw new Error('Prescription preview content could not be located on the page.');
  }

  let tempContainer = null;

  try {
    // Render from a fixed desktop-width off-screen clone so mobile screens don't produce
    // clipped tables, deformed layouts, or multi-page page breaks across the signature.
    const { container, clone } = createCaptureClone(element);
    tempContainer = container;

    // Ensure all images within the clone are loaded before capture
    const images = Array.from(clone.querySelectorAll('img'));
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
    const canvas = await html2canvas(clone, {
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

    const margin = 12;
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
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};

/**
 * Renders the exact prescription preview element to a base64 encoded PDF string.
 * Used for sending the exact visual prescription directly via WhatsApp API.
 * Works seamlessly across both mobile and desktop viewports.
 *
 * @param {HTMLElement} element - The DOM element containing the prescription card.
 * @returns {Promise<string|null>} - Base64 string without data prefix
 */
export const generatePrescriptionPdfBase64 = async (element) => {
  if (!element) return null;

  let tempContainer = null;

  try {
    const { container, clone } = createCaptureClone(element);
    tempContainer = container;

    const images = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 10000,
    });

    const imgData = canvas.toDataURL('image/png');
    if (!imgData || imgData === 'data:,') return null;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
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

    const dataUri = pdf.output('datauristring');
    if (dataUri && dataUri.includes(',')) {
      return dataUri.split(',')[1];
    }
    return null;
  } catch (err) {
    console.error('generatePrescriptionPdfBase64 error:', err);
    return null;
  } finally {
    if (tempContainer && tempContainer.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
};

