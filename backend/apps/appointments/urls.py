from django.urls import path
from .views import (
    AppointmentListCreateView,
    AppointmentDetailView,
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    PatientHistoryListView,
    PatientDetailUpdateView,
    PrescriptionListView,
    ClinicSettingsView,
)

urlpatterns = [
    path('appointments/', AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('appointments/<str:pk_or_id>/', AppointmentDetailView.as_view(), name='appointment-detail'),
    path('notifications/', NotificationListView.as_view(), name='notification-list'),
    path('notifications/<int:pk>/read/', NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/mark-all-read/', NotificationMarkAllReadView.as_view(), name='notification-mark-all-read'),
    path('patients/', PatientHistoryListView.as_view(), name='patient-history-list'),
    path('patients/<str:patient_id>/', PatientDetailUpdateView.as_view(), name='patient-detail-update'),
    path('prescriptions/', PrescriptionListView.as_view(), name='prescription-list'),
    path('settings/clinic/', ClinicSettingsView.as_view(), name='clinic-settings'),
]
