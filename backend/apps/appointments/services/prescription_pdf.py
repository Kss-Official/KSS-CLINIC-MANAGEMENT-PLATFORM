import io
import os
import base64
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

def generate_prescription_pdf_bytes(prescription_data):
    """
    Generates a high-fidelity Clinical Prescription PDF in memory using ReportLab.
    Design matches the website prescription card preview exactly:
    - Clinic Round Logo + Doctor credentials & address
    - Divider
    - 2-Column Patient Metadata Table with aligned colon labels
    - Diagnosis Section
    - Green Theme Medicines Table (#f0fdf4 header / #166534 text)
    - Additional Instructions
    - Doctor Cursive Signature + Underline + Title (Right-aligned)
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm
    )

    styles = getSampleStyleSheet()

    # Colors
    text_dark = colors.HexColor('#0f172a')
    text_muted = colors.HexColor('#64748b')
    clinic_green = colors.HexColor('#15803d')
    table_header_green = colors.HexColor('#166534')
    table_header_bg = colors.HexColor('#f0fdf4')
    divider_color = colors.HexColor('#cbd5e1')
    table_border_color = colors.HexColor('#e2e8f0')

    # Typography Styles
    doctor_name_style = ParagraphStyle(
        'DocName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=text_dark
    )
    clinic_tag_style = ParagraphStyle(
        'ClinicTag',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=clinic_green
    )
    clinic_addr_style = ParagraphStyle(
        'ClinicAddr',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=text_muted
    )
    meta_style = ParagraphStyle(
        'MetaText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=text_dark
    )
    section_title_style = ParagraphStyle(
        'SectionTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=text_dark
    )
    section_body_style = ParagraphStyle(
        'SectionBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    tbl_th_center_style = ParagraphStyle(
        'TblThCenter',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=table_header_green
    )
    tbl_th_left_style = ParagraphStyle(
        'TblThLeft',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=0,
        textColor=table_header_green
    )
    tbl_td_center_style = ParagraphStyle(
        'TblTdCenter',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=1,
        textColor=colors.HexColor('#334155')
    )
    tbl_td_left_style = ParagraphStyle(
        'TblTdLeft',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        alignment=0,
        textColor=text_dark
    )
    tbl_td_bold_style = ParagraphStyle(
        'TblTdBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        alignment=0,
        textColor=text_dark
    )
    sig_cursive_style = ParagraphStyle(
        'SigCursive',
        parent=styles['Normal'],
        fontName='Times-BoldItalic',
        fontSize=18,
        leading=20,
        alignment=2,
        textColor=text_dark
    )
    sig_name_style = ParagraphStyle(
        'SigName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        alignment=2,
        textColor=text_dark
    )
    sig_sub_style = ParagraphStyle(
        'SigSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        alignment=2,
        textColor=text_muted
    )

    elements = []

    # 1. Clinic Header with Logo
    logo_path = os.path.join(os.path.dirname(__file__), 'doctor-portal-logo.png')
    header_cells = []
    if os.path.exists(logo_path):
        header_cells.append(Image(logo_path, width=17 * mm, height=17 * mm))
    else:
        header_cells.append(Paragraph("", styles['Normal']))

    clinic_info_p = [
        Paragraph("Dr. Kumar Tripathi Ampeh (Pat.)", doctor_name_style),
        Spacer(1, 1 * mm),
        Paragraph("HOMEOPATHY CLINIC", clinic_tag_style),
        Spacer(1, 1 * mm),
        Paragraph("12, Green Park, MG Road, Bangalore, Karnataka - 560001", clinic_addr_style),
        Paragraph("Ph: +91 98765 43210 &nbsp;|&nbsp; clinic.tripathi@gmail.com", clinic_addr_style),
    ]
    header_cells.append(clinic_info_p)

    header_table = Table([header_cells], colWidths=[22 * mm, 156 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)

    # Divider
    elements.append(Spacer(1, 2 * mm))
    elements.append(HRFlowable(width="100%", thickness=1, color=divider_color, spaceBefore=4, spaceAfter=8))

    # 2. Patient Metadata 2-Column Grid
    p_name = prescription_data.get('patientName') or prescription_data.get('patient_name') or prescription_data.get('name') or 'Patient'
    p_id = prescription_data.get('patientId') or prescription_data.get('patient_id_ref') or ''
    p_age_gender = prescription_data.get('ageGender') or prescription_data.get('age_gender') or ''
    p_phone = prescription_data.get('mobile') or prescription_data.get('patient_phone') or prescription_data.get('phone') or ''
    rx_date = prescription_data.get('date') or ''
    reason_for_visit = (
        prescription_data.get('reasonForVisit') or
        prescription_data.get('reason_for_visit') or
        prescription_data.get('reason') or
        prescription_data.get('mainComplaint') or
        prescription_data.get('complaint') or
        prescription_data.get('consultationType') or
        'General Consultation'
    )
    p_apt = prescription_data.get('aptNumber') or prescription_data.get('appointment_id') or prescription_data.get('apt_number') or prescription_data.get('appointmentId') or ''

    meta_rows = [
        [
            Paragraph(f"<font color='#64748b'>Patient Name&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{p_name}</b>", meta_style),
            Paragraph(f"<font color='#64748b'>Patient ID&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{p_id}</b>", meta_style),
        ],
        [
            Paragraph(f"<font color='#64748b'>Age / Gender&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{p_age_gender}</b>", meta_style),
            Paragraph(f"<font color='#64748b'>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{rx_date}</b>", meta_style),
        ],
        [
            Paragraph(f"<font color='#64748b'>Contact&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{p_phone}</b>", meta_style),
            Paragraph(f"<font color='#64748b'>Reason for Visit&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{reason_for_visit}</b>", meta_style),
        ]
    ]
    if p_apt:
        meta_rows.append([
            Paragraph(f"<font color='#64748b'>APT Number&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</font>&nbsp;&nbsp;<b>{p_apt}</b>", meta_style),
            Paragraph("", meta_style),
        ])
    meta_table = Table(meta_rows, colWidths=[95 * mm, 83 * mm])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    elements.append(meta_table)

    # 3. Diagnosis
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph("Diagnosis", section_title_style))
    elements.append(Spacer(1, 1 * mm))
    diag = prescription_data.get('diagnosis') or prescription_data.get('complaint') or 'Skin allergy due to seasonal change.'
    elements.append(Paragraph(diag, section_body_style))

    # 4. Medicines Table
    elements.append(Spacer(1, 4 * mm))
    table_data = [
        [
            Paragraph("No.", tbl_th_center_style),
            Paragraph("Medicine Name", tbl_th_left_style),
            Paragraph("Potency", tbl_th_center_style),
            Paragraph("Dosage", tbl_th_center_style),
            Paragraph("Duration", tbl_th_center_style),
            Paragraph("Instructions", tbl_th_left_style),
        ]
    ]

    raw_medicines = prescription_data.get('medicines') or []
    if not isinstance(raw_medicines, list):
        raw_medicines = []

    for idx, med in enumerate(raw_medicines, 1):
        if not isinstance(med, dict):
            continue
        m_name = med.get('name') or med.get('medicine_name') or ''
        if not m_name.strip():
            continue
        m_pot = med.get('potency') or ''
        m_dose = med.get('dosage') or ''
        m_dur = med.get('duration') or ''
        m_inst = med.get('instructions') or med.get('timing') or ''

        table_data.append([
            Paragraph(str(idx), tbl_td_center_style),
            Paragraph(m_name, tbl_td_bold_style),
            Paragraph(m_pot, tbl_td_center_style),
            Paragraph(m_dose, tbl_td_center_style),
            Paragraph(m_dur, tbl_td_center_style),
            Paragraph(m_inst, tbl_td_left_style),
        ])

    meds_table = Table(
        table_data,
        colWidths=[12 * mm, 50 * mm, 24 * mm, 24 * mm, 24 * mm, 44 * mm]
    )
    meds_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), table_header_bg),
        ('LINEABOVE', (0, 0), (-1, 0), 1, table_border_color),
        ('LINEBELOW', (0, 0), (-1, 0), 1, table_border_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 1), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
    ]))
    elements.append(meds_table)

    # 5. Additional Instructions
    elements.append(Spacer(1, 4 * mm))
    elements.append(Paragraph("Additional Instructions", section_title_style))
    elements.append(Spacer(1, 1 * mm))
    instructions = prescription_data.get('additionalInstructions') or prescription_data.get('additional_instructions') or 'Avoid spicy food. Drink plenty of water. Follow-up after 15 days.'
    elements.append(Paragraph(instructions, section_body_style))

    # 6. Doctor Signature Block (Aligned Right)
    elements.append(Spacer(1, 6 * mm))
    sig_content = [
        Paragraph("KTripathi", sig_cursive_style),
        Spacer(1, 1 * mm),
        HRFlowable(width=45 * mm, thickness=1.5, color=colors.HexColor('#334155'), hAlign='RIGHT', spaceBefore=1, spaceAfter=2),
        Paragraph("Dr. K. Tripathi Ampeh (Pat.)", sig_name_style),
        Paragraph("Homeopathy Consultant", sig_sub_style),
    ]

    sig_table = Table([[Paragraph("", styles['Normal']), sig_content]], colWidths=[120 * mm, 58 * mm])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(sig_table)

    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
