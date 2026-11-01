from rest_framework import serializers
from django.contrib.auth import authenticate
from apps.users.models import User


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            if '@' in username:
                try:
                    user_obj = User.objects.filter(email__iexact=username).first()
                    if user_obj:
                        username = user_obj.username
                except Exception:
                    pass
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid username or password.')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
        else:
            raise serializers.ValidationError('Must include "username" and "password".')

        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)


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
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user

