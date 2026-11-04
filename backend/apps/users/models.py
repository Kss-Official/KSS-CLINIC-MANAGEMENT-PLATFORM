from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        DOCTOR = 'DOCTOR', 'Doctor'
        RECEPTIONIST = 'RECEPTIONIST', 'Receptionist'
        PATIENT = 'PATIENT', 'Patient'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
        help_text="Designated role within the clinic management system"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    gender = models.CharField(max_length=50, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)

    def is_doctor(self):
        return self.role == self.Role.DOCTOR

    def is_receptionist(self):
        return self.role == self.Role.RECEPTIONIST

    def is_patient(self):
        return self.role == self.Role.PATIENT

    @property
    def is_staff_or_admin(self):
        return (
            self.role in [self.Role.ADMIN, self.Role.DOCTOR, self.Role.RECEPTIONIST]
            or self.is_staff
            or self.is_superuser
        )

    def save(self, *args, **kwargs):
        if self.role in [self.Role.ADMIN, self.Role.DOCTOR, self.Role.RECEPTIONIST]:
            self.is_staff = True
        elif self.role == self.Role.PATIENT:
            # Patients must never be staff or superuser
            self.is_staff = False
            self.is_superuser = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
