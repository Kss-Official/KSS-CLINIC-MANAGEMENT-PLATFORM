from django.urls import path
from .views import (
    LoginView,
    AdminLoginView,
    PatientLoginView,
    RegisterView,
    LogoutView,
    CurrentUserView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth_login'),
    path('admin/login/', AdminLoginView.as_view(), name='auth_admin_login'),
    path('patient/login/', PatientLoginView.as_view(), name='auth_patient_login'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('me/', CurrentUserView.as_view(), name='auth_me'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='auth_forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='auth_reset_password'),
]
