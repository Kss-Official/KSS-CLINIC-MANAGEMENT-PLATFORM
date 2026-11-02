from rest_framework import serializers
from .models import Appointment, Notification, Prescription


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            'id',
            'appointment_id',
            'patient_name',
            'patient_phone',
            'patient_email',
            'appointment_date',
            'time_slot',
            'reason_for_visit',
            'consultation_type',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'appointment_id', 'created_at', 'updated_at']


class NotificationSerializer(serializers.ModelSerializer):
    created_at_formatted = serializers.SerializerMethodField()
    appointment_details = AppointmentSerializer(source='appointment', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id',
            'appointment',
            'appointment_details',
            'title',
            'message',
            'patient_name',
            'appointment_date',
            'booking_time',
            'is_read',
            'created_at',
            'created_at_formatted',
        ]

    def get_created_at_formatted(self, obj):
        return obj.created_at.strftime('%d %b %Y, %I:%M %p')



class ClinicSettingsSerializer(serializers.Serializer):
    clinicName = serializers.CharField(max_length=35, required=False)
    clinic_name = serializers.CharField(max_length=35, required=False)
    doctorName = serializers.CharField(max_length=35, required=False)
    doctor_name = serializers.CharField(max_length=35, required=False)
    email = serializers.EmailField(required=True)
    contactNumber = serializers.CharField(max_length=25, required=False, allow_blank=True)
    contact_number = serializers.CharField(max_length=25, required=False, allow_blank=True)
    alternateNumber = serializers.CharField(max_length=25, required=False, allow_blank=True)
    alternate_number = serializers.CharField(max_length=25, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        import re

        clinic_name = attrs.get('clinicName') or attrs.get('clinic_name')
        if not clinic_name or not clinic_name.strip():
            raise serializers.ValidationError({'clinicName': "Clinic Name is required."})
        if len(clinic_name.strip()) > 35:
            raise serializers.ValidationError({'clinicName': "Clinic Name must not exceed 35 characters."})

        doctor_name = attrs.get('doctorName') or attrs.get('doctor_name')
        if not doctor_name or not doctor_name.strip():
            raise serializers.ValidationError({'doctorName': "Doctor Name is required."})
        if len(doctor_name.strip()) > 35:
            raise serializers.ValidationError({'doctorName': "Doctor Name must not exceed 35 characters."})
        if not re.match(r'^[A-Za-z\s.()]+$', doctor_name.strip()):
            raise serializers.ValidationError({'doctorName': "Doctor Name can only contain letters, spaces, dots (.), and parentheses ( )."})

        email = (attrs.get('email') or '').strip().lower()
        if not email:
            raise serializers.ValidationError({'email': "Email address is required."})
        if '.com' in email:
            idx = email.find('.com')
            if idx + 4 < len(email):
                raise serializers.ValidationError({'email': "No characters are allowed after .com in the email address."})

        return {
            'clinicName': clinic_name.strip(),
            'doctorName': doctor_name.strip(),
            'email': email,
            'contactNumber': attrs.get('contactNumber') or attrs.get('contact_number') or '',
            'alternateNumber': attrs.get('alternateNumber') or attrs.get('alternate_number') or '',
            'address': (attrs.get('address') or '').strip(),
        }

class PrescriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Prescription
        fields = [
            'id',
            'prescription_id',
            'appointment',
            'patient_name',
            'patient_phone',
            'patient_id_ref',
            'age_gender',
            'date',
            'time',
            'complaint',
            'symptoms',
            'diagnosis',
            'medicines',
            'additional_instructions',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'prescription_id', 'created_at', 'updated_at']
