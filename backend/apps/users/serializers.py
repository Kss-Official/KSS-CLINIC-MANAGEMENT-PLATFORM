from rest_framework import serializers
from django.conf import settings
from .models import User


class UserSerializer(serializers.ModelSerializer):

    def validate_email(self, value):
        if value:
            val = value.strip().lower()
            if '.com' in val:
                idx = val.find('.com')
                if idx + 4 < len(val):
                    raise serializers.ValidationError("No characters are allowed after .com in the email address.")
        return value

    patient_id = serializers.SerializerMethodField()
    profile_image_url = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        name = f"{obj.first_name or ''} {obj.last_name or ''}".strip()
        if not name:
            patient = getattr(obj, 'patient_records', None)
            if patient and patient.exists():
                return patient.first().name
        return name or obj.username or 'Patient'

    def get_initials(self, obj):
        name = self.get_full_name(obj)
        parts = name.strip().split()
        if len(parts) >= 2:
            return f"{parts[0][0]}{parts[-1][0]}".upper()
        if len(parts) == 1:
            return parts[0][0].upper()
        return "P"

    def get_patient_id(self, obj):
        patient = getattr(obj, 'patient_records', None)
        if patient and patient.exists():
            return patient.first().patient_id
        return None

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        try:
            val = str(obj.profile_image).strip()
            if not val or 'test_avatar.png' in val or 'placeholder_doctor' in val:
                return None
            if val.startswith('http://localhost') or val.startswith('http://127.0.0.1'):
                return None
            if val.startswith('data:image/') or val.startswith('http://') or val.startswith('https://'):
                return val
            if hasattr(obj.profile_image, 'url'):
                url = obj.profile_image.url
                if not url or 'test_avatar.png' in url or 'placeholder_doctor' in url:
                    return None
                if url.startswith('http://localhost') or url.startswith('http://127.0.0.1'):
                    return None
                if url.startswith('http://') or url.startswith('https://') or url.startswith('data:image/'):
                    return url
                request = self.context.get('request')
                if request:
                    full_url = request.build_absolute_uri(url)
                    if request.is_secure() and full_url.startswith('http://'):
                        full_url = full_url.replace('http://', 'https://', 1)
                    return full_url
                return f"https://clinic-ms-kss-backend.vercel.app{url}"
            return val
        except Exception:
            return None

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'phone_number',
            'date_of_birth',
            'gender',
            'address',
            'is_active',
            'date_joined',
            'patient_id',
            'profile_image_url',
            'initials',
            'full_name',
        ]
        read_only_fields = ['id', 'date_joined', 'profile_image_url']


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    def validate_email(self, value):
        if value:
            val = value.strip().lower()
            if '.com' in val:
                idx = val.find('.com')
                if idx + 4 < len(val):
                    raise serializers.ValidationError("No characters are allowed after .com in the email address.")
        return value

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'phone_number',
            'date_of_birth',
            'gender',
            'address',
        ]

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        return user
