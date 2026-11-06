from rest_framework import serializers
from .models import Appointment, Notification, Prescription


class AppointmentSerializer(serializers.ModelSerializer):
    patient_id_ref = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'appointment_id',
            'patient_record',
            'patient_id_ref',
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

    def get_patient_id_ref(self, obj):
        if obj.patient_record and obj.patient_record.patient_id:
            return obj.patient_record.patient_id
        if obj.patient_record_id:
            return f"PAT-{obj.patient_record_id}"
        return "PAT-1010"

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



class AppointmentSettingsSerializer(serializers.Serializer):
    workingDays = serializers.ListField(child=serializers.CharField(), required=False)
    working_days = serializers.ListField(child=serializers.CharField(), required=False)
    consultationHours = serializers.CharField(required=False, allow_blank=True)
    consultation_hours = serializers.CharField(required=False, allow_blank=True)
    slotDuration = serializers.CharField(required=False, allow_blank=True)
    slot_duration = serializers.CharField(required=False, allow_blank=True)
    dateRestrictions = serializers.ListField(required=False)
    date_restrictions = serializers.ListField(required=False)
    customWorkingHours = serializers.ListField(required=False)
    custom_working_hours = serializers.ListField(required=False)
    notifications = serializers.DictField(required=False)
    notificationChannels = serializers.DictField(required=False)
    notification_channels = serializers.DictField(required=False)

    def validate(self, attrs):
        working_days = attrs.get('workingDays') or attrs.get('working_days')
        consultation_hours = attrs.get('consultationHours') or attrs.get('consultation_hours')
        slot_duration = attrs.get('slotDuration') or attrs.get('slot_duration')
        date_restrictions = attrs.get('dateRestrictions') if 'dateRestrictions' in attrs else attrs.get('date_restrictions')
        custom_working_hours = attrs.get('customWorkingHours') if 'customWorkingHours' in attrs else attrs.get('custom_working_hours')

        res = {}
        if working_days is not None:
            valid_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            cleaned = [d for d in working_days if d in valid_days]
            res['workingDays'] = cleaned
            res['working_days'] = cleaned
        if consultation_hours is not None:
            res['consultationHours'] = str(consultation_hours).strip()
            res['consultation_hours'] = str(consultation_hours).strip()
        if slot_duration is not None:
            res['slotDuration'] = str(slot_duration).strip()
            res['slot_duration'] = str(slot_duration).strip()
        if date_restrictions is not None:
            res['dateRestrictions'] = date_restrictions
            res['date_restrictions'] = date_restrictions
        if custom_working_hours is not None:
            res['customWorkingHours'] = custom_working_hours
            res['custom_working_hours'] = custom_working_hours
        return res


class ClinicSettingsSerializer(serializers.Serializer):
    clinicName = serializers.CharField(max_length=35, required=False)
    clinic_name = serializers.CharField(max_length=35, required=False)
    doctorName = serializers.CharField(max_length=35, required=False)
    doctor_name = serializers.CharField(max_length=35, required=False)
    email = serializers.EmailField(required=False, allow_blank=True)
    contactNumber = serializers.CharField(max_length=25, required=False, allow_blank=True)
    contact_number = serializers.CharField(max_length=25, required=False, allow_blank=True)
    alternateNumber = serializers.CharField(max_length=25, required=False, allow_blank=True)
    alternate_number = serializers.CharField(max_length=25, required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)
    profile_image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    profileImageUrl = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    workingDays = serializers.ListField(child=serializers.CharField(), required=False)
    working_days = serializers.ListField(child=serializers.CharField(), required=False)
    consultationHours = serializers.CharField(required=False, allow_blank=True)
    consultation_hours = serializers.CharField(required=False, allow_blank=True)
    slotDuration = serializers.CharField(required=False, allow_blank=True)
    slot_duration = serializers.CharField(required=False, allow_blank=True)
    dateRestrictions = serializers.ListField(required=False)
    date_restrictions = serializers.ListField(required=False)
    customWorkingHours = serializers.ListField(required=False)
    custom_working_hours = serializers.ListField(required=False)
    notifications = serializers.DictField(required=False)
    notificationChannels = serializers.DictField(required=False)
    notification_channels = serializers.DictField(required=False)

    def validate(self, attrs):
        import re

        clinic_name = attrs.get('clinicName') or attrs.get('clinic_name')
        doctor_name = attrs.get('doctorName') or attrs.get('doctor_name')
        email = (attrs.get('email') or '').strip().lower()

        # If full clinic info is being saved, validate clinic and doctor name
        if clinic_name is not None:
            if not clinic_name.strip():
                raise serializers.ValidationError({'clinicName': "Clinic Name is required."})
            if len(clinic_name.strip()) > 35:
                raise serializers.ValidationError({'clinicName': "Clinic Name must not exceed 35 characters."})

        if doctor_name is not None:
            if not doctor_name.strip():
                raise serializers.ValidationError({'doctorName': "Doctor Name is required."})
            if len(doctor_name.strip()) > 35:
                raise serializers.ValidationError({'doctorName': "Doctor Name must not exceed 35 characters."})
            if not re.match(r'^[A-Za-z\s.()]+$', doctor_name.strip()):
                raise serializers.ValidationError({'doctorName': "Doctor Name can only contain letters, spaces, dots (.), and parentheses ( )."})

        if email:
            if '.com' in email:
                idx = email.find('.com')
                if idx + 4 < len(email):
                    raise serializers.ValidationError({'email': "No characters are allowed after .com in the email address."})

        res = {}
        if clinic_name is not None:
            res['clinicName'] = clinic_name.strip()
            res['clinic_name'] = clinic_name.strip()
        if doctor_name is not None:
            res['doctorName'] = doctor_name.strip()
            res['doctor_name'] = doctor_name.strip()
        if email:
            res['email'] = email
        if 'contactNumber' in attrs or 'contact_number' in attrs:
            val = attrs.get('contactNumber') or attrs.get('contact_number') or ''
            res['contactNumber'] = val
            res['contact_number'] = val
        if 'alternateNumber' in attrs or 'alternate_number' in attrs:
            val = attrs.get('alternateNumber') or attrs.get('alternate_number') or ''
            res['alternateNumber'] = val
            res['alternate_number'] = val
        if 'address' in attrs:
            res['address'] = (attrs.get('address') or '').strip()
        if 'profile_image_url' in attrs or 'profileImageUrl' in attrs:
            val = attrs.get('profile_image_url') or attrs.get('profileImageUrl') or None
            res['profile_image_url'] = val
            res['profileImageUrl'] = val

        working_days = attrs.get('workingDays') or attrs.get('working_days')
        if working_days is not None:
            valid_days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            cleaned = [d for d in working_days if d in valid_days]
            res['workingDays'] = cleaned
            res['working_days'] = cleaned

        consultation_hours = attrs.get('consultationHours') or attrs.get('consultation_hours')
        if consultation_hours is not None:
            res['consultationHours'] = str(consultation_hours).strip()
            res['consultation_hours'] = str(consultation_hours).strip()

        slot_duration = attrs.get('slotDuration') or attrs.get('slot_duration')
        if slot_duration is not None:
            res['slotDuration'] = str(slot_duration).strip()
            res['slot_duration'] = str(slot_duration).strip()

        date_restrictions = attrs.get('dateRestrictions') if 'dateRestrictions' in attrs else attrs.get('date_restrictions')
        if date_restrictions is not None:
            res['dateRestrictions'] = date_restrictions
            res['date_restrictions'] = date_restrictions

        custom_working_hours = attrs.get('customWorkingHours') if 'customWorkingHours' in attrs else attrs.get('custom_working_hours')
        if custom_working_hours is not None:
            res['customWorkingHours'] = custom_working_hours
            res['custom_working_hours'] = custom_working_hours

        notifications = attrs.get('notifications')
        if notifications is not None and isinstance(notifications, dict):
            res['notifications'] = notifications

        channels = attrs.get('notificationChannels') or attrs.get('notification_channels')
        if channels is not None and isinstance(channels, dict):
            res['notificationChannels'] = channels
            res['notification_channels'] = channels

        return res

class PrescriptionSerializer(serializers.ModelSerializer):
    appointment_id = serializers.SerializerMethodField()
    appointment_number = serializers.SerializerMethodField()
    apt_number = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = [
            'id',
            'prescription_id',
            'appointment',
            'appointment_id',
            'appointment_number',
            'apt_number',
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

    def get_appointment_id(self, obj):
        if obj.appointment and obj.appointment.appointment_id:
            return obj.appointment.appointment_id
        if obj.patient_record:
            apt = obj.patient_record.appointments.exclude(status='Cancelled').order_by('-created_at').first()
            if apt and apt.appointment_id:
                return apt.appointment_id
        if obj.patient_name:
            apt = Appointment.objects.filter(patient_name__iexact=obj.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
            if apt and apt.appointment_id:
                return apt.appointment_id
        return ''

    def get_appointment_number(self, obj):
        return self.get_appointment_id(obj)

    def get_apt_number(self, obj):
        return self.get_appointment_id(obj)
