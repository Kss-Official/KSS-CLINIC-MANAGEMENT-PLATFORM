from rest_framework import permissions


class IsAdminOrSelf(permissions.BasePermission):
    """
    Allow access to self (the user requesting their own details) or admin staff.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'ADMIN':
            return True
        return obj == request.user


class IsDoctor(permissions.BasePermission):
    """
    Allows access only to authenticated users with Doctor role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'DOCTOR')

