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
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        data = request.data
        full_name = data.get('fullName', '').strip()
        phone = data.get('phone', '').strip()
        email = data.get('email', '').strip()
        purpose = data.get('purpose', 'General Consultation').strip()
        message = data.get('message', '').strip()

        if not full_name or not phone or not message:
            return Response(
                {'success': False, 'error': 'Full name, phone, and message are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        recipient = getattr(settings, 'CLINIC_CONTACT_EMAIL', 'pratikshaharode0@gmail.com')
        sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'pratikshaharode0@gmail.com')
        reply_to = [email] if email else [recipient]

        subject = f"New Patient Inquiry: {full_name} ({purpose})"
        text_content = (
            f"New Inquiry from Website Contact Form:\n\n"
            f"Full Name: {full_name}\n"
            f"Phone: +91 {phone}\n"
            f"Email: {email if email else 'Not provided'}\n"
            f"Purpose: {purpose}\n\n"
            f"Message:\n{message}\n"
        )

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f5; padding: 30px 15px;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5eae6;">
            <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 24px 28px; color: #ffffff;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 8px;">NEW INQUIRY</span>
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Write to Us &bull; Patient Contact</h2>
              <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">A patient submitted a new inquiry on the clinic website.</p>
            </div>
            
            <div style="padding: 28px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 22px;">
                <tr style="border-bottom: 1px solid #f0f3f1;">
                  <td style="padding: 11px 0; color: #6b7280; font-weight: 600; width: 140px;">Patient Name:</td>
                  <td style="padding: 11px 0; color: #111827; font-weight: 700;">{full_name}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f3f1;">
                  <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Phone Number:</td>
                  <td style="padding: 11px 0; color: #111827; font-weight: 600;"><a href="tel:{phone}" style="color: #1b4332; text-decoration: none;">+91 {phone}</a></td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f3f1;">
                  <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Email Address:</td>
                  <td style="padding: 11px 0; color: #111827;">{'<a href="mailto:' + email + '" style="color: #1b4332; text-decoration: none;">' + email + '</a>' if email else '<span style="color: #9ca3af; font-style: italic;">Not provided</span>'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f0f3f1;">
                  <td style="padding: 11px 0; color: #6b7280; font-weight: 600;">Inquiry Purpose:</td>
                  <td style="padding: 11px 0; color: #111827; font-weight: 600;">{purpose}</td>
                </tr>
              </table>

              <div style="background-color: #f9fbf9; border-left: 4px solid #1b4332; border-radius: 8px; padding: 16px; margin-top: 10px;">
                <span style="font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 6px;">Patient Message:</span>
                <p style="margin: 0; color: #1f2937; line-height: 1.6; font-size: 14.5px; white-space: pre-wrap;">{message}</p>
              </div>

              <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f0f3f1; text-align: center;">
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  Sent directly to <strong>{recipient}</strong> via Brevo SMTP relay.<br/>
                  You can click <strong>Reply</strong> to respond directly to the patient.
                </p>
              </div>
            </div>
          </div>
        </div>
        """

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

            return Response(
                {'success': True, 'message': 'Message sent successfully via Brevo.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error sending email via Brevo SMTP: {e}", exc_info=True)
            return Response(
                {'success': False, 'error': f'Failed to send email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

