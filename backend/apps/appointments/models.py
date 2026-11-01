from django.db import models
from apps.core.models import TimeStampedModel
from django.conf import settings
import uuid


class Patient(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patient_records'
    )
    patient_id = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=50, blank=True, default='')
    email = models.EmailField(blank=True, null=True)
    age_gender = models.CharField(max_length=100, blank=True, default='30 / Adult')
    blood_group = models.CharField(max_length=20, blank=True, default='O+')
    address = models.TextField(blank=True, default='')
    known_allergies = models.TextField(blank=True, default='None')
    primary_concern = models.TextField(blank=True, default='General Consultation')
    medical_history = models.TextField(blank=True, default='')
    notes = models.TextField(blank=True, default='Registered via Appointment Booking.')
    status = models.CharField(max_length=50, default='Active')

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.patient_id:
            count = Patient.objects.count() + 1
            self.patient_id = f"PAT-{1000 + count}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patient_id} - {self.name}"


class Appointment(TimeStampedModel):
    STATUS_CHOICES = [
        ('Confirmed', 'Confirmed'),
        ('Pending', 'Pending'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='patient_appointments'
    )
    patient_record = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appointments'
    )
    appointment_id = models.CharField(max_length=50, unique=True, blank=True)
    patient_name = models.CharField(max_length=150)
    patient_phone = models.CharField(max_length=25)
    patient_email = models.EmailField(blank=True, null=True)
    appointment_date = models.CharField(max_length=50)
    time_slot = models.CharField(max_length=50)
    reason_for_visit = models.TextField(blank=True, default='')
    consultation_type = models.CharField(max_length=50, default='In-clinic Visit')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending')

    def save(self, *args, **kwargs):
        if not self.appointment_id:
            self.appointment_id = f"APT-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.appointment_id} - {self.patient_name} ({self.appointment_date})"


class Notification(TimeStampedModel):
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True
    )
    title = models.CharField(max_length=200, default='New Appointment Booked')
    message = models.TextField(blank=True)
    patient_name = models.CharField(max_length=150)
    appointment_date = models.CharField(max_length=50)
    booking_time = models.CharField(max_length=50)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification: {self.patient_name} - {'Read' if self.is_read else 'Unread'}"


class Prescription(TimeStampedModel):
    STATUS_CHOICES = [
        ('Delivered', 'Delivered'),
        ('Sent', 'Sent'),
        ('Pending', 'Pending'),
        ('Failed', 'Failed'),
    ]

    patient_record = models.ForeignKey(
        Patient,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions'
    )
    prescription_id = models.CharField(max_length=50, unique=True, blank=True)
    appointment = models.ForeignKey(
        Appointment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='prescriptions'
    )
    patient_name = models.CharField(max_length=150)
    patient_phone = models.CharField(max_length=50, blank=True, default='')
    patient_id_ref = models.CharField(max_length=50, blank=True, default='')
    age_gender = models.CharField(max_length=100, blank=True, default='')
    date = models.CharField(max_length=50)
    time = models.CharField(max_length=50, default='10:00 AM')
    complaint = models.TextField(blank=True, default='')
    symptoms = models.TextField(blank=True, default='')
    diagnosis = models.TextField(blank=True, default='')
    medicines = models.JSONField(default=list, blank=True)
    additional_instructions = models.TextField(blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Delivered')

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.prescription_id:
            from datetime import datetime
            year = datetime.now().year
            count = Prescription.objects.count() + 1
            self.prescription_id = f"RX-{year}-{1000 + count}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.prescription_id} - {self.patient_name} ({self.date})"
