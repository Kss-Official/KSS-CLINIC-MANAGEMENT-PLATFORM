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


import io
import base64
from PIL import Image

class ProfileImageUploadView(views.APIView):
    """
    Dedicated endpoint for patients to upload/update their profile picture.
    POST /api/users/me/profile-image/
    Accepts multipart/form-data with field 'profile_image', or JSON with 'profile_image' (base64/url).
    Returns updated user data including profile_image_url.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        image_file = request.FILES.get('profile_image')
        raw_image_data = request.data.get('profile_image') or request.data.get('profile_image_url')

        data_uri = None

        if image_file:
            # Validate file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5 MB
            if image_file.size > max_size:
                return Response(
                    {'error': 'Image file is too large. Maximum allowed size is 5 MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate file type
            content_type = getattr(image_file, 'content_type', '') or 'image/jpeg'
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
            if content_type.lower() not in allowed_types:
                return Response(
                    {'error': 'Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                file_bytes = image_file.read()
                try:
                    img = Image.open(io.BytesIO(file_bytes))
                    if img.mode in ('RGBA', 'LA') and content_type.lower() in ['image/jpeg', 'image/jpg']:
                        bg = Image.new('RGB', img.size, (255, 255, 255))
                        bg.paste(img, mask=img.split()[-1])
                        img = bg
                    elif img.mode != 'RGB' and content_type.lower() in ['image/jpeg', 'image/jpg']:
                        img = img.convert('RGB')

                    # Resize to avatar dimensions (max 400x400)
                    img.thumbnail((400, 400), Image.Resampling.LANCZOS)
                    buffer = io.BytesIO()
                    img.save(buffer, format='JPEG', quality=85, optimize=True)
                    compressed_bytes = buffer.getvalue()
                    mime = 'image/jpeg'
                except Exception as img_err:
                    compressed_bytes = file_bytes
                    mime = content_type

                b64 = base64.b64encode(compressed_bytes).decode('utf-8')
                data_uri = f"data:{mime};base64,{b64}"
            except Exception as e:
                return Response(
                    {'error': f'Failed to process image file: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        elif raw_image_data and isinstance(raw_image_data, str) and (raw_image_data.startswith('data:image/') or raw_image_data.startswith('http')):
            data_uri = raw_image_data
        else:
            return Response(
                {'error': 'No image file provided. Please upload a valid image file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.profile_image = data_uri
        user.save(update_fields=['profile_image'])

        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Profile picture updated successfully.',
            'user': serializer.data,
            'profile_image_url': data_uri,
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Remove profile picture and revert to initials avatar."""
        user = request.user
        user.profile_image = ''
        user.save(update_fields=['profile_image'])

        serializer = UserSerializer(user, context={'request': request})
        return Response({
            'message': 'Profile picture removed successfully.',
            'user': serializer.data,
            'profile_image_url': None,
        }, status=status.HTTP_200_OK)
