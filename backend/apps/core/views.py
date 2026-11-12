import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)

class ContactFormView(APIView):
    """
    Handles Contact Us / Write to Us form submissions.
    Sends email notification via Brevo SMTP to clinic doctor.
    Fully public endpoint: authentication_classes = [] ensures expired tokens,
    session cookies, or CSRF checks never block patient inquiries.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        full_name = str(data.get('fullName') or data.get('full_name') or data.get('name') or '').strip()
        phone = str(data.get('phone') or data.get('phone_number') or data.get('mobile') or '').strip()
        email = str(data.get('email') or '').strip()
        purpose = str(data.get('purpose') or data.get('purpose_of_contact') or 'General Consultation').strip()
        message = str(data.get('message') or data.get('msg') or '').strip()

        if not full_name or not phone or not message:
            return Response(
                {'success': False, 'error': 'Full name, phone, and message are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from datetime import datetime
        now = datetime.now()
        now_date = now.strftime('%d %b %Y')
        now_time = now.strftime('%I:%M %p')
        timestamp_str = f"{now_date}, {now_time}"

        # 1. Always record in Admin Notification so clinic never loses the inquiry
        try:
            from apps.appointments.models import Notification
            Notification.objects.create(
                title=f"New Patient Inquiry ({purpose})",
                message=f"{full_name} ({phone}): {message[:140]}",
                patient_name=full_name,
                appointment_date=now_date,
                booking_time=now_time,
                is_read=False,
            )
        except Exception as notif_err:
            logger.warning(f"Could not create admin notification for contact inquiry: {notif_err}")

        recipient = getattr(settings, 'CLINIC_CONTACT_EMAIL', 'pratikshaharode0@gmail.com')
        sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'pratikshaharode0@gmail.com')
        reply_to = [email] if email else [recipient]

        subject = f"New Patient Inquiry: {full_name} ({purpose})"
        text_content = (
            f"=============================================\n"
            f"NEW PATIENT INQUIRY - WRITE TO US\n"
            f"Homeopathy Clinic Website\n"
            f"=============================================\n\n"
            f"• Patient Name   : {full_name}\n"
            f"• Phone Number   : +91 {phone}\n"
            f"• Email Address  : {email if email else 'Not provided'}\n"
            f"• Inquiry Purpose: {purpose}\n"
            f"• Submitted On   : {timestamp_str}\n\n"
            f"---------------------------------------------\n"
            f"PATIENT MESSAGE:\n"
            f"---------------------------------------------\n"
            f"{message}\n\n"
            f"=============================================\n"
            f"Reply to this email or call +91 {phone} to respond to the patient.\n"
        )

        email_row_html = (
            f'<a href="mailto:{email}" style="color: #1b4332; text-decoration: none; word-break: break-all; overflow-wrap: anywhere; font-weight: 600;">{email}</a>'
        ) if email else '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'

        reply_btn_html = (
            f'<a href="mailto:{email}" style="display: inline-block; background-color: #ffffff; color: #1b4332; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 8px; border: 1.5px solid #1b4332; margin: 4px;">&#9993; Reply via Email</a>'
        ) if email else ''

        html_content = f"""<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Patient Inquiry</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #edf2ee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-text-size-adjust: 100%;">
          <div style="background-color: #edf2ee; padding: 20px 10px; width: 100%; box-sizing: border-box;">
            <div style="max-width: 580px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #dce4de; box-sizing: border-box;">
              
              <!-- Header Banner -->
              <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 24px 20px; color: #ffffff; box-sizing: border-box;">
                <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 8px;">NEW INQUIRY</span>
                <h2 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.3; color: #ffffff;">Write to Us &bull; Patient Contact</h2>
                <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.92; line-height: 1.4; color: #e8f5e9;">A patient submitted a new inquiry on the clinic website.</p>
              </div>

              <!-- Content Body -->
              <div style="padding: 22px 20px; box-sizing: border-box;">
                
                <!-- Field: Patient Name -->
                <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Patient Name</div>
                  <div style="font-size: 16px; font-weight: 700; color: #0f172a; word-break: break-word;">{full_name}</div>
                </div>

                <!-- Field: Phone Number -->
                <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Phone Number</div>
                  <div style="font-size: 15px; font-weight: 700;">
                    <a href="tel:{phone}" style="color: #1b4332; text-decoration: none; word-break: break-word;">+91 {phone}</a>
                  </div>
                </div>

                <!-- Field: Email Address -->
                <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Email Address</div>
                  <div style="font-size: 14.5px; word-break: break-all; overflow-wrap: anywhere; line-height: 1.4;">
                    {email_row_html}
                  </div>
                </div>

                <!-- Field: Purpose of Contact -->
                <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px;">Inquiry Purpose</div>
                  <span style="display: inline-block; background-color: #e8f5e9; color: #1b4332; font-weight: 700; font-size: 13px; padding: 4px 10px; border-radius: 6px;">
                    {purpose}
                  </span>
                </div>

                <!-- Field: Submitted On -->
                <div style="padding: 10px 0; border-bottom: 1px solid #edf2ee;">
                  <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Submitted On</div>
                  <div style="font-size: 13.5px; color: #475569; font-weight: 500;">{timestamp_str}</div>
                </div>

                <!-- Field: Patient Message Box -->
                <div style="background-color: #f8faf9; border-left: 4px solid #1b4332; border-radius: 8px; padding: 16px 14px; margin-top: 16px; box-sizing: border-box;">
                  <span style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; letter-spacing: 0.8px; display: block; margin-bottom: 6px;">PATIENT MESSAGE</span>
                  <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 14.5px; white-space: pre-wrap; word-break: break-word; overflow-wrap: anywhere;">{message}</p>
                </div>

                <!-- Action Buttons -->
                <div style="margin-top: 22px; text-align: center;">
                  <a href="tel:{phone}" style="display: inline-block; background-color: #1b4332; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 18px; border-radius: 8px; margin: 4px;">&#128222; Call Patient</a>
                  {reply_btn_html}
                </div>

                <!-- Footer Note -->
                <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #edf2ee; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                  Sent to <strong>{recipient}</strong> via Brevo SMTP relay.<br/>
                  You can also click <strong>Reply</strong> in your email client to respond directly.
                </div>

              </div>
            </div>
          </div>
        </body>
        </html>
        """

        email_sent = False
        try:
            email_msg = EmailMultiAlternatives(
                subject=subject,
                body=text_content,
                from_email=f"Homeopathy Clinic Website <{sender}>",
                to=[recipient],
                reply_to=reply_to
            )
            email_msg.attach_alternative(html_content, "text/html")
            email_msg.send(fail_silently=False)
            email_sent = True
        except Exception as e:
            logger.error(f"Error sending email via Brevo SMTP: {e}", exc_info=True)

        return Response(
            {
                'success': True,
                'message': 'Your message has been sent successfully. Our clinic team will get back to you shortly.',
                'email_sent': email_sent
            },
            status=status.HTTP_200_OK
        )

