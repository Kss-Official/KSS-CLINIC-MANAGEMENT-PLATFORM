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

    def get_patient_id(self, obj):
        patient = getattr(obj, 'patient_records', None)
        if patient and patient.exists():
            return patient.first().patient_id
        return None

    def get_profile_image_url(self, obj):
        if not obj.profile_image:
            return None
        try:
            url = obj.profile_image.url
            if url.startswith('http://') or url.startswith('https://'):
                return url
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(url)
            return f"http://localhost:8000{url}"
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
