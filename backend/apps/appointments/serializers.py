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
            'patient_gender',
            'patient_dob',
            'appointment_date',
            'time_slot',
            'reason_for_visit',
            'consultation_type',
            'status',
            'prescription_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'appointment_id', 'created_at', 'updated_at']

    def validate_patient_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Patient name is required.")
        if len(val) > 35:
            raise serializers.ValidationError("Patient name must not exceed 35 characters.")
        import re
        if not re.match(r'^[a-zA-Z\s]+$', val):
            raise serializers.ValidationError("Patient name must contain only alphabetic characters and spaces. Numbers and special characters are not allowed.")
        return val

    def validate_patient_phone(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Mobile number is required.")
        import re
        digits = re.sub(r'\D', '', val)
        if len(digits) != 10:
            raise serializers.ValidationError("Mobile number must be exactly 10 digits.")
        if not digits.startswith(('6', '7', '8', '9')):
            raise serializers.ValidationError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.")
        return digits

    def validate_patient_email(self, value):
        if not value:
            return value
        val = value.strip()
        if not val:
            return None
        import re
        if re.search(r'\.com.+$', val, re.IGNORECASE):
            raise serializers.ValidationError("Invalid email address. No characters or text allowed after .com.")
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$'
        if not re.match(email_regex, val):
            raise serializers.ValidationError("Please enter a valid email address.")
        return val

    def validate_reason_for_visit(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError("Reason for visit is required.")
        return val


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
            'prescription_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'prescription_id', 'created_at', 'updated_at']
