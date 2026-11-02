from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from apps.users.serializers import UserSerializer
from .serializers import LoginSerializer, RegisterSerializer


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

