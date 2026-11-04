from rest_framework import viewsets, permissions, filters
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
