import io
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm

def generate_appointment_confirmation_pdf_bytes(appointment_data):
    """
    Generates a world-class, official A4 Appointment Confirmation Slip PDF in memory using ReportLab.
    Matches clinic branding, eliminates all column misalignments, prevents awkward line-wraps,
    and fills the A4 page gracefully with structured cards and verified authentication details.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=13 * mm,
        bottomMargin=13 * mm
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    text_dark = colors.HexColor('#0f172a')
    text_slate = colors.HexColor('#334155')
    text_muted = colors.HexColor('#64748b')
    clinic_green = colors.HexColor('#14532d')
    accent_green = colors.HexColor('#166534')
    banner_bg = colors.HexColor('#f0fdf4')
    banner_border = colors.HexColor('#bbf7d0')
    card_bg = colors.HexColor('#ffffff')
    card_header_bg = colors.HexColor('#f8fafc')
    card_border = colors.HexColor('#cbd5e1')
    divider_color = colors.HexColor('#e2e8f0')

    # Typography Styles
    doc_name_style = ParagraphStyle('DocName', fontName='Helvetica-Bold', fontSize=13.5, leading=16.5, textColor=clinic_green)
    clinic_tag_style = ParagraphStyle('ClinicTag', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=accent_green)
    clinic_addr_style = ParagraphStyle('ClinicAddr', fontName='Helvetica', fontSize=8, leading=11, textColor=text_muted)
    banner_title_style = ParagraphStyle('BannerTitle', fontName='Helvetica-Bold', fontSize=10, leading=13, textColor=clinic_green)
    banner_sub_style = ParagraphStyle('BannerSub', fontName='Helvetica', fontSize=8, leading=10.5, textColor=accent_green)
    banner_status_style = ParagraphStyle('BannerStatus', fontName='Helvetica-Bold', fontSize=8.5, leading=11, alignment=2, textColor=accent_green)

    badge_title_style = ParagraphStyle('BadgeTitle', fontName='Helvetica-Bold', fontSize=8, leading=10, alignment=1, textColor=accent_green)
    badge_text_style = ParagraphStyle('BadgeText', fontName='Helvetica', fontSize=7.2, leading=9.5, alignment=1, textColor=text_slate)

    card_header_style = ParagraphStyle('CardHeader', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=clinic_green)
    label_style = ParagraphStyle('Label', fontName='Helvetica-Bold', fontSize=8, leading=11, textColor=text_muted)
    val_style = ParagraphStyle('Val', fontName='Helvetica', fontSize=8.5, leading=11, textColor=text_dark)
    val_bold_style = ParagraphStyle('ValBold', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=text_dark)

    instr_title_style = ParagraphStyle('InstrTitle', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=clinic_green)
    instr_bullet_style = ParagraphStyle('InstrBullet', fontName='Helvetica', fontSize=8, leading=11.5, textColor=text_slate)

    auth_title_style = ParagraphStyle('AuthTitle', fontName='Helvetica-Bold', fontSize=8, leading=10.5, textColor=clinic_green)
    auth_body_style = ParagraphStyle('AuthBody', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=text_muted)
    auth_code_style = ParagraphStyle('AuthCode', fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=accent_green)

    sig_cursive_style = ParagraphStyle('SigCursive', fontName='Times-BoldItalic', fontSize=19, leading=21, alignment=2, textColor=clinic_green)
    sig_name_style = ParagraphStyle('SigName', fontName='Helvetica-Bold', fontSize=9, leading=12, alignment=2, textColor=text_dark)
    sig_sub_style = ParagraphStyle('SigSub', fontName='Helvetica', fontSize=7.5, leading=10, alignment=2, textColor=text_muted)

    footer_text_style = ParagraphStyle('FooterText', fontName='Helvetica', fontSize=7.5, leading=10, textColor=text_muted)
    footer_bold_style = ParagraphStyle('FooterBold', fontName='Helvetica-Bold', fontSize=7.5, leading=10, alignment=2, textColor=accent_green)
    footer_sub_style = ParagraphStyle('FooterSub', fontName='Helvetica', fontSize=7, leading=9, alignment=1, textColor=colors.HexColor('#94a3b8'))

    elements = []

    # Metadata extraction
    apt_id = appointment_data.get('appointment_id') or appointment_data.get('id') or 'APT-1001'
    p_name = appointment_data.get('patient_name') or appointment_data.get('patientName') or 'Patient'
    p_phone = appointment_data.get('patient_phone') or appointment_data.get('mobileNumber') or appointment_data.get('mobile') or '—'
    p_email = appointment_data.get('patient_email') or appointment_data.get('email') or '—'
    doctor_name = appointment_data.get('doctor_name') or 'Dr. Kumar Tripathi Ampeh (Pat.)'
    service_name = appointment_data.get('reason_for_visit') or appointment_data.get('service') or ''
    apt_date = appointment_data.get('appointment_date') or appointment_data.get('date') or '—'
    apt_time = appointment_data.get('time_slot') or appointment_data.get('time') or '—'
    clinic_address = appointment_data.get('clinic_address') or '12, Green Park, MG Road, Bangalore, Karnataka - 560001'

    # 1. Header with Logo & Verification Badge
    logo_path = os.path.join(os.path.dirname(__file__), 'doctor-portal-logo.png')
    header_logo = Image(logo_path, width=20 * mm, height=18.6 * mm) if os.path.exists(logo_path) else Paragraph('', styles['Normal'])

    clinic_info = [
        Paragraph("Dr. Kumar Tripathi Ampeh (Pat.)", doc_name_style),
        Spacer(1, 0.8 * mm),
        Paragraph("HOMEOPATHY CLINIC & WELLNESS CENTER", clinic_tag_style),
        Spacer(1, 0.8 * mm),
        Paragraph("Specialized Classical Homeopathy & Advanced Natural Healing", clinic_addr_style),
        Paragraph("12, Green Park, MG Road, Bangalore, Karnataka - 560001", clinic_addr_style),
        Paragraph("Ph: +91 98765 43210 &nbsp;|&nbsp; clinic.tripathi@gmail.com", clinic_addr_style),
    ]

    badge_content = [
        Paragraph("✓ VERIFIED SLIP", badge_title_style),
        Spacer(1, 0.8 * mm),
        Paragraph(f"<b>ID: {apt_id}</b>", badge_text_style),
        Paragraph(f"DATE: {apt_date}", badge_text_style),
    ]
    badge_table = Table([[badge_content]], colWidths=[38 * mm])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), banner_bg),
        ('BOX', (0, 0), (-1, -1), 0.6, banner_border),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 2 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 2 * mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    header_table = Table([[header_logo, clinic_info, badge_table]], colWidths=[23 * mm, 115 * mm, 40 * mm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 3 * mm))
    elements.append(HRFlowable(width='100%', thickness=1.2, color=clinic_green, spaceBefore=2, spaceAfter=4))

    # 2. Status Banner
    banner_cells = [
        [
            [
                Paragraph("✓ &nbsp; OFFICIAL APPOINTMENT CONFIRMATION SLIP", banner_title_style),
                Spacer(1, 0.8 * mm),
                Paragraph("Your consultation slot is officially reserved. Please present this slip upon clinic arrival.", banner_sub_style),
            ],
            Paragraph("STATUS: <font color=\"#15803d\"><b>CONFIRMED</b></font>", banner_status_style)
        ]
    ]
    banner_table = Table(banner_cells, colWidths=[130 * mm, 48 * mm])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), banner_bg),
        ('BOX', (0, 0), (-1, -1), 0.6, banner_border),
        ('LINELEFT', (0, 0), (0, 0), 2.5, clinic_green),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.8 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.8 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 4.5 * mm))

    # 3. Two Balanced Cards Side-by-Side (4 Columns: 35mm, 54mm, 35mm, 54mm = 178mm)
    grid_rows = [
        # Row 0: Section Headers
        [
            Paragraph("APPOINTMENT SCHEDULE", card_header_style), "",
            Paragraph("PATIENT DETAILS", card_header_style), ""
        ],
        # Row 1
        [
            Paragraph("Appointment ID", label_style),
            Paragraph(f": &nbsp; <b>{apt_id}</b>", val_bold_style),
            Paragraph("Patient Name", label_style),
            Paragraph(f": &nbsp; <b>{p_name}</b>", val_bold_style)
        ],
        # Row 2
        [
            Paragraph("Scheduled Date", label_style),
            Paragraph(f": &nbsp; <b>{apt_date}</b>", val_bold_style),
            Paragraph("Mobile Number", label_style),
            Paragraph(f": &nbsp; <b>{p_phone}</b>", val_bold_style)
        ],
        # Row 3
        [
            Paragraph("Time Slot", label_style),
            Paragraph(f": &nbsp; <font color=\"#166534\"><b>{apt_time}</b></font>", val_bold_style),
            Paragraph("Email Address", label_style),
            Paragraph(f": &nbsp; {p_email}", val_style)
        ],
        # Row 4
        [
            Paragraph("Consulting Doctor", label_style),
            Paragraph(f": &nbsp; {doctor_name}", val_style),
            Paragraph("Booking Status", label_style),
            Paragraph(": &nbsp; <font color=\"#166534\"><b>Confirmed</b></font>", val_bold_style)
        ],
        # Row 5
        [
            Paragraph("Reason for Visit", label_style),
            Paragraph(f": &nbsp; {service_name}", val_style),
            Paragraph("Consultation Type", label_style),
            Paragraph(": &nbsp; In-Clinic Visit", val_style)
        ],
    ]

    col_widths = [35 * mm, 54 * mm, 35 * mm, 54 * mm]
    grid_table = Table(grid_rows, colWidths=col_widths)
    grid_table.setStyle(TableStyle([
        # Headers spanning
        ('SPAN', (0, 0), (1, 0)),
        ('SPAN', (2, 0), (3, 0)),
        ('BACKGROUND', (0, 0), (1, 0), card_header_bg),
        ('BACKGROUND', (2, 0), (3, 0), card_header_bg),
        ('LINEBELOW', (0, 0), (1, 0), 0.6, card_border),
        ('LINEBELOW', (2, 0), (3, 0), 0.6, card_border),

        # Card backgrounds and outer borders
        ('BACKGROUND', (0, 1), (1, -1), card_bg),
        ('BACKGROUND', (2, 1), (3, -1), card_bg),
        ('BOX', (0, 0), (1, -1), 0.6, card_border),
        ('BOX', (2, 0), (3, -1), 0.6, card_border),

        # Internal dividers between rows
        ('LINEBELOW', (0, 1), (1, -2), 0.35, colors.HexColor('#f1f5f9')),
        ('LINEBELOW', (2, 1), (3, -2), 0.35, colors.HexColor('#f1f5f9')),

        # Paddings
        ('TOPPADDING', (0, 0), (-1, -1), 2.4 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.4 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(grid_table)
    elements.append(Spacer(1, 4.5 * mm))

    # 4. Clinic Venue Card (Full Width 178mm, 2 columns: 35mm, 143mm)
    venue_rows = [
        [Paragraph("CLINIC LOCATION & CONSULTATION VENUE", card_header_style), ""],
        [Paragraph("Clinic Name", label_style), Paragraph(": &nbsp; <b>Dr. Kumar Tripathi Ampeh Homeopathy Clinic & Wellness Center</b>", val_bold_style)],
        [Paragraph("Full Address", label_style), Paragraph(f": &nbsp; {clinic_address}", val_style)],
        [Paragraph("Landmark", label_style), Paragraph(": &nbsp; Opp. 1 MG-Lido Mall, near Trinity Circle (Central Bengaluru)", val_style)],
        [Paragraph("Desk Contact", label_style), Paragraph(": &nbsp; Ph: +91 98765 43210 &nbsp;|&nbsp; clinic.tripathi@gmail.com &nbsp;|&nbsp; Mon–Sat: 9:00 AM – 6:00 PM", val_style)],
    ]
    venue_table = Table(venue_rows, colWidths=[35 * mm, 143 * mm])
    venue_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('BACKGROUND', (0, 0), (1, 0), card_header_bg),
        ('LINEBELOW', (0, 0), (1, 0), 0.6, card_border),
        ('BACKGROUND', (0, 1), (1, -1), card_bg),
        ('BOX', (0, 0), (-1, -1), 0.6, card_border),
        ('LINEBELOW', (0, 1), (1, -2), 0.35, colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(venue_table)
    elements.append(Spacer(1, 4.5 * mm))

    # 5. Instructions Card (Full Width 178mm)
    instr_rows = [
        [Paragraph("IMPORTANT INSTRUCTIONS FOR YOUR VISIT", instr_title_style)],
        [Paragraph("• &nbsp; <b>Reporting Time:</b> Please report 10 minutes prior to your allocated slot for vitals check-in and queue token issuance.", instr_bullet_style)],
        [Paragraph("• &nbsp; <b>Medical Records:</b> Bring past prescriptions, lab investigation reports, and a list of current allopathic or ayurvedic medications.", instr_bullet_style)],
        [Paragraph("• &nbsp; <b>Pre-Visit Precautions:</b> Avoid strong aromatic food/beverages (coffee, raw garlic/onion, mint, camphor) 30 minutes before consultation.", instr_bullet_style)],
        [Paragraph("• &nbsp; <b>Rescheduling & Cancellations:</b> Please manage via Patient Portal or notify clinic reception at least 4 hours in advance.", instr_bullet_style)],
    ]
    instr_table = Table(instr_rows, colWidths=[178 * mm])
    instr_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), card_header_bg),
        ('LINEBELOW', (0, 0), (0, 0), 0.6, card_border),
        ('BACKGROUND', (0, 1), (0, -1), card_header_bg),
        ('BOX', (0, 0), (-1, -1), 0.6, card_border),
        ('LINELEFT', (0, 0), (-1, -1), 2.5, clinic_green),
        ('TOPPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.2 * mm),
        ('LEFTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 3.5 * mm),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(instr_table)
    elements.append(Spacer(1, 5 * mm))

    # 6. Authorization & Signature
    auth_left = [
        Paragraph("OFFICIAL COMPUTER-GENERATED DOCUMENT", auth_title_style),
        Spacer(1, 1 * mm),
        Paragraph("This confirmation slip is electronically authenticated and issued by the Clinic Management System. No physical signature is required. Present this document on your mobile device or in print upon clinic entry.", auth_body_style),
        Spacer(1, 1.2 * mm),
        Paragraph(f"SECURITY TOKEN: SEC-AUTH-{apt_id} • PORTAL VERIFIED", auth_code_style),
    ]
    sig_right = [
        Paragraph("KTripathi", sig_cursive_style),
        HRFlowable(width='60%', thickness=1.2, color=clinic_green, spaceBefore=2, spaceAfter=2, hAlign='RIGHT'),
        Paragraph("Dr. Kumar Tripathi Ampeh (Pat.)", sig_name_style),
        Paragraph("Chief Medical Officer & Consultant Homeopath", sig_sub_style),
        Paragraph("Reg. No: HOM-KA-48921 • Central Council of Homeopathy", sig_sub_style),
    ]
    auth_table = Table([[auth_left, sig_right]], colWidths=[108 * mm, 70 * mm])
    auth_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(auth_table)
    elements.append(Spacer(1, 5 * mm))

    # 7. Footer
    elements.append(HRFlowable(width='100%', thickness=0.8, color=divider_color, spaceBefore=2, spaceAfter=3))
    footer_row = [
        Paragraph("Dr. Kumar Tripathi Ampeh Homeopathy Clinic &bull; Dedicated to Gentle & Permanent Healing", footer_text_style),
        Paragraph("Official Slip &bull; Page 1 of 1", footer_bold_style)
    ]
    footer_table = Table([footer_row], colWidths=[130 * mm, 48 * mm])
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(footer_table)
    elements.append(Spacer(1, 1 * mm))
    elements.append(Paragraph("Helpline: +91 98765 43210 &nbsp;|&nbsp; Website: https://drtripathihomeopathy.com &nbsp;|&nbsp; Mon–Sat: 9:00 AM – 6:00 PM", footer_sub_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
