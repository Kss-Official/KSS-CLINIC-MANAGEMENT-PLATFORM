from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import models
from apps.users.models import User
from apps.users.serializers import UserSerializer
from .models import PasswordResetCode
from .serializers import LoginSerializer, RegisterSerializer
import logging

logger = logging.getLogger(__name__)


def obfuscate_email(email):
    if not email or '@' not in email:
        return email
    parts = email.split('@', 1)
    name = parts[0]
    domain = parts[1]
    if len(name) <= 2:
        masked = name[0] + '***'
    else:
        masked = name[:2] + '***' + name[-1]
    return f"{masked}@{domain}"


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'Login successful'
        }, status=status.HTTP_200_OK)


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)

        # If user is a patient, automatically establish their permanent Patient record in Neon
        if user.role == 'PATIENT':
            from apps.appointments.models import Patient
            full_name = f"{user.first_name} {user.last_name}".strip() or user.username
            patient = Patient.objects.filter(user=user).first()
            if not patient and user.email:
                patient = Patient.objects.filter(email__iexact=user.email).first()
                if patient:
                    patient.user = user
                    if not patient.phone and user.phone_number:
                        patient.phone = user.phone_number
                    patient.save()
            if not patient:
                Patient.objects.create(
                    user=user,
                    name=full_name,
                    email=user.email or f"{user.username}@gmail.com",
                    phone=user.phone_number or '',
                    status='Active',
                    primary_concern='General Consultation',
                )

        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)


class LogoutView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class CurrentUserView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class ForgotPasswordView(views.APIView):
    """
    Handles request for forgot password.
    Generates a secure 6-digit OTP code and emails it to the user via Brevo SMTP.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = str(request.data.get('identifier', '')).strip()
        if not identifier:
            return Response(
                {'success': False, 'error': 'Please enter your username or registered email address.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)
        ).first()

        if not user:
            return Response(
                {'success': False, 'error': 'No account found with this username or email.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not user.email or '@' not in user.email:
            return Response(
                {'success': False, 'error': 'No registered email address found for this account. Please contact clinic support.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reset_record = PasswordResetCode.generate_for_user(user)

        sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'pratikshaharode0@gmail.com')
        recipient = user.email
        subject = f"Password Reset Code: {reset_record.code} - Dr. Kumar Tripathi Clinic"

        full_name = f"{user.first_name} {user.last_name}".strip() or user.username

        text_content = (
            f"Hello {full_name},\n\n"
            f"You requested to reset your password for your clinic account ({user.username}).\n\n"
            f"Your 6-digit verification code is: {reset_record.code}\n\n"
            f"This code is valid for 15 minutes.\n"
            f"If you did not request this, please ignore this email or notify the clinic administrator.\n"
        )

        html_content = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f5; padding: 30px 15px;">
          <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e5eae6;">
            <div style="background: linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%); padding: 24px 28px; color: #ffffff;">
              <span style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 999px; display: inline-block; margin-bottom: 8px;">SECURITY VERIFICATION</span>
              <h2 style="margin: 0; font-size: 22px; font-weight: 700;">Password Reset Request</h2>
              <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9;">Dr. Kumar Tripathi Ampeh (Pat.) &bull; Homeopathy Clinic</p>
            </div>
            
            <div style="padding: 28px;">
              <p style="color: #1f2937; font-size: 15px; margin: 0 0 14px 0;">Hello <strong>{full_name}</strong>,</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
                We received a request to reset the password for your account (<strong>{user.username}</strong>). Use the verification code below to set your new password:
              </p>

              <div style="background-color: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
                <span style="font-size: 11px; font-weight: 700; color: #166534; text-transform: uppercase; letter-spacing: 1.2px; display: block; margin-bottom: 6px;">Your 6-Digit Verification Code</span>
                <div style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1b4332; font-family: 'Courier New', Courier, monospace;">{reset_record.code}</div>
              </div>

              <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 16px 0;">
                ⏳ This verification code will expire in <strong>15 minutes</strong>.
              </p>

              <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px 16px; border-left: 3px solid #94a3b8; margin-top: 20px;">
                <p style="color: #64748b; font-size: 12.5px; margin: 0; line-height: 1.5;">
                  If you did not make this request, you can safely ignore this email. Your current password will remain unchanged.
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
                from_email=f"Homeopathy Clinic <{sender}>",
                to=[recipient]
            )
            email_msg.attach_alternative(html_content, "text/html")
            email_msg.send(fail_silently=False)

            masked = obfuscate_email(user.email)
            return Response({
                'success': True,
                'message': f"A 6-digit verification code has been sent to {masked}.",
                'email': masked,
                'username': user.username
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error sending password reset email via Brevo: {e}", exc_info=True)
            return Response(
                {'success': False, 'error': f"Failed to send verification email: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ResetPasswordView(views.APIView):
    """
    Validates the 6-digit code and sets a new password for the user.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        identifier = str(request.data.get('identifier', '')).strip()
        code = str(request.data.get('code', '')).strip()
        new_password = str(request.data.get('new_password', '')).strip()

        if not identifier or not code or not new_password:
            return Response(
                {'success': False, 'error': 'Identifier, verification code, and new password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'success': False, 'error': 'Password must be at least 6 characters long.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.filter(
            models.Q(email__iexact=identifier) | models.Q(username__iexact=identifier)
        ).first()

        if not user:
            return Response(
                {'success': False, 'error': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        reset_code = PasswordResetCode.objects.filter(
            user=user,
            code=code,
            is_used=False
        ).first()

        if not reset_code or not reset_code.is_valid():
            return Response(
                {'success': False, 'error': 'Invalid or expired verification code. Please request a new code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        # Invalidate code
        reset_code.is_used = True
        reset_code.save()

        return Response({
            'success': True,
            'message': 'Password has been reset successfully. You can now login with your new password.'
        }, status=status.HTTP_200_OK)

