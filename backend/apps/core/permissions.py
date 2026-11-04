from rest_framework import permissions


class IsAdminUserOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access to unauthenticated/regular users,
    but only admins and staff can edit or delete.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, 'role', None) in ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
                or getattr(request.user, 'is_staff', False)
                or getattr(request.user, 'is_superuser', False)
            )
        )


class IsStaffOrAdmin(permissions.BasePermission):
    """
    Allows access only to authenticated admin, doctor, or staff users.
    Patients and unauthenticated requests are strictly rejected.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (
                getattr(request.user, 'role', None) in ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
                or getattr(request.user, 'is_staff', False)
                or getattr(request.user, 'is_superuser', False)
            )
        )


class IsPatientUser(permissions.BasePermission):
    """
    Allows access only to authenticated patient users.
    Staff, admins, and unauthenticated requests are strictly rejected.
    """

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', None) == 'PATIENT'
        )


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object or admins to edit it.
    """

    def has_object_permission(self, request, view, obj):
        if request.user and (
            getattr(request.user, 'is_staff', False)
            or getattr(request.user, 'role', None) in ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
            or getattr(request.user, 'is_superuser', False)
        ):
            return True
        # Check if the object has user attribute
        return getattr(obj, 'user', None) == request.user or obj == request.user
