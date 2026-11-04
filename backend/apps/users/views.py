from rest_framework import viewsets, permissions, filters, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.permissions import IsStaffOrAdmin
from .models import User
from .serializers import UserSerializer, UserCreateUpdateSerializer
from .permissions import IsAdminOrSelf


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'first_name', 'last_name', 'email', 'role']
    ordering_fields = ['date_joined', 'username', 'role']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer

    def get_permissions(self):
        if self.action in ['list', 'create', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, IsStaffOrAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated, IsAdminOrSelf]
        return [permission() for permission in permission_classes]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ProfileImageUploadView(views.APIView):
    """
    Dedicated endpoint for patients to upload/update their profile picture.
    POST /api/users/me/profile-image/
    Accepts multipart/form-data with field 'profile_image'.
    Returns updated user data including profile_image_url.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        image_file = request.FILES.get('profile_image')

        if not image_file:
            return Response(
                {'error': 'No image file provided. Please upload a valid image file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5 MB
        if image_file.size > max_size:
            return Response(
                {'error': 'Image file is too large. Maximum allowed size is 5 MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Delete old profile image file from storage if exists
        if user.profile_image:
            try:
                user.profile_image.delete(save=False)
            except Exception:
                pass

        user.profile_image = image_file
        user.save(update_fields=['profile_image'])

        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Profile picture updated successfully.',
            'user': serializer.data,
            'profile_image_url': serializer.data.get('profile_image_url'),
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Remove profile picture and revert to initials avatar."""
        user = request.user
        if user.profile_image:
            try:
                user.profile_image.delete(save=False)
            except Exception:
                pass
            user.profile_image = None
            user.save(update_fields=['profile_image'])

        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Profile picture removed successfully.',
            'user': serializer.data,
            'profile_image_url': None,
        }, status=status.HTTP_200_OK)
