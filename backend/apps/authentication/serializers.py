import re
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db import models
from apps.users.models import User
from apps.appointments.models import Patient


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    portal = serializers.CharField(required=False, allow_blank=True, default='')

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        portal = (attrs.get('portal') or '').lower().strip()

        if username and password:
            raw_input = str(username).strip()
            candidates = []
            seen_ids = set()

            def add_candidate(u):
                if u and u.pk not in seen_ids:
                    seen_ids.add(u.pk)
                    candidates.append(u)

            # 1. Email lookup (User and linked Patient records)
            if '@' in raw_input:
                for u in User.objects.filter(email__iexact=raw_input):
                    add_candidate(u)
                for p in Patient.objects.filter(email__iexact=raw_input).select_related('user'):
                    if p.user:
                        add_candidate(p.user)

            # 2. Patient ID lookup (e.g., PAT-1018, PAT1018, PAT 1018)
            pat_match = re.match(r'^pat[\s\-_]*(\d+)$', raw_input, re.IGNORECASE)
            normalized_pat_id = f"PAT-{pat_match.group(1)}" if pat_match else raw_input
            if pat_match or raw_input.upper().startswith('PAT'):
                for p in Patient.objects.filter(
                    models.Q(patient_id__iexact=raw_input) | models.Q(patient_id__iexact=normalized_pat_id)
                ).select_related('user'):
                    if p.user:
                        add_candidate(p.user)
                    elif p.email:
                        for u in User.objects.filter(email__iexact=p.email, role=User.Role.PATIENT):
                            add_candidate(u)

            # 3. Exact username
            for u in User.objects.filter(username__iexact=raw_input):
                add_candidate(u)

            # 4. Username prefix before random suffix (e.g., harodepratiksha65, gaurav.tripathi)
            for u in User.objects.filter(username__istartswith=raw_input + '_'):
                add_candidate(u)

            # 5. Patient full name or first/last name match across all matching patients
            if portal != 'admin':
                for p in Patient.objects.filter(name__iexact=raw_input).select_related('user'):
                    if p.user:
                        add_candidate(p.user)
                    elif p.email:
                        for u in User.objects.filter(email__iexact=p.email, role=User.Role.PATIENT):
                            add_candidate(u)
                for u in User.objects.filter(
                    models.Q(first_name__iexact=raw_input) | models.Q(last_name__iexact=raw_input),
                    role=User.Role.PATIENT
                ):
                    add_candidate(u)

                # 6. Phone number match (clean digits across Patient and User records)
                clean_phone = ''.join(c for c in raw_input if c.isdigit())
                if len(clean_phone) >= 10:
                    last10 = clean_phone[-10:]
                    for u in User.objects.filter(phone_number__endswith=last10, role=User.Role.PATIENT):
                        add_candidate(u)
                    for mp in Patient.objects.filter(phone__endswith=last10, user__isnull=False).select_related('user'):
                        add_candidate(mp.user)

            # Authenticate against candidates in priority order; pick the one whose password matches
            user = None
            first_matched_role_blocked = None
            for cand in candidates:
                authed = authenticate(username=cand.username, password=password)
                if authed:
                    cand_is_staff = (
                        authed.role in [User.Role.ADMIN, User.Role.DOCTOR, User.Role.RECEPTIONIST]
                        or authed.is_staff
                        or authed.is_superuser
                    )
                    if portal == 'admin' and (not cand_is_staff or authed.role == User.Role.PATIENT):
                        first_matched_role_blocked = authed
                        continue
                    if portal == 'patient' and (cand_is_staff or authed.role != User.Role.PATIENT):
                        first_matched_role_blocked = authed
                        continue
                    user = authed
                    break

            if not user:
                if first_matched_role_blocked is not None:
                    if portal == 'admin':
                        raise serializers.ValidationError(
                            'Access denied. Patient accounts cannot log in through the Admin Portal. Please use the Patient Login.'
                        )
                    if portal == 'patient':
                        raise serializers.ValidationError(
                            'Access denied. Administrator accounts cannot log in through the Patient Portal. Please use the Admin Login.'
                        )
                # Direct fallback authenticate if no candidate existed
                if not candidates:
                    user = authenticate(username=raw_input, password=password)
                if not user:
                    raise serializers.ValidationError('Invalid username or password.')

            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')

            is_staff_or_admin = (
                user.role in [User.Role.ADMIN, User.Role.DOCTOR, User.Role.RECEPTIONIST]
                or user.is_staff
                or user.is_superuser
            )

            # Portal-specific role validation
            if portal == 'admin':
                if not is_staff_or_admin or user.role == User.Role.PATIENT:
                    raise serializers.ValidationError(
                        'Access denied. Patient accounts cannot log in through the Admin Portal. Please use the Patient Login.'
                    )
            elif portal == 'patient':
                if is_staff_or_admin or user.role != User.Role.PATIENT:
                    raise serializers.ValidationError(
                        'Access denied. Administrator accounts cannot log in through the Patient Portal. Please use the Admin Login.'
                    )
        else:
            raise serializers.ValidationError('Must include "username" and "password".')

        attrs['user'] = user
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=True, max_length=35)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=35, default='')
    phone_number = serializers.CharField(required=True)

    def validate_first_name(self, value):
        val = (value or '').strip()
        if not val:
            raise serializers.ValidationError('Please enter your full name.')
        if len(val) > 35:
            raise serializers.ValidationError('Name cannot exceed 35 characters.')
        if not re.match(r'^[a-zA-Z\s]+$', val):
            raise serializers.ValidationError(
                'Name must contain only alphabetic characters. Numbers and special characters are not allowed.'
            )
        return val

    def validate_last_name(self, value):
        val = (value or '').strip()
        if val:
            if len(val) > 35:
                raise serializers.ValidationError('Name cannot exceed 35 characters.')
            if not re.match(r'^[a-zA-Z\s]+$', val):
                raise serializers.ValidationError(
                    'Name must contain only alphabetic characters. Numbers and special characters are not allowed.'
                )
        return val

    def validate_email(self, value):
        val = (value or '').strip().lower()
        if not val:
            raise serializers.ValidationError('Please enter your email address.')

        # Proper email format validation
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$'
        if not re.match(email_regex, val):
            raise serializers.ValidationError(
                'Please enter a valid email address (e.g., name@example.com).'
            )

        # Do not allow any additional characters or text after the .com domain extension
        if '.com' in val:
            idx = val.find('.com')
            if idx + 4 < len(val):
                raise serializers.ValidationError(
                    'Invalid email address. No additional characters or text are allowed after the .com domain extension.'
                )

        if User.objects.filter(email__iexact=val).exists():
            raise serializers.ValidationError(
                'An account with this email address already exists.'
            )
        return val

    def validate_phone_number(self, value):
        val = str(value or '').strip()
        if not val:
            raise serializers.ValidationError('Please enter your phone number.')

        # Accept only numeric input
        if not val.isdigit():
            raise serializers.ValidationError(
                'Phone number must contain only numeric digits. Letters and special characters are not allowed.'
            )

        # Validate that the number contains exactly 10 digits and starts with 6, 7, 8, or 9
        if len(val) != 10 or val[0] not in ['6', '7', '8', '9']:
            raise serializers.ValidationError(
                'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.'
            )

        return val

    def validate(self, attrs):
        # Combined full name length validation
        first = (attrs.get('first_name') or '').strip()
        last = (attrs.get('last_name') or '').strip()
        full_name = f"{first} {last}".strip()
        if len(full_name) > 35:
            raise serializers.ValidationError({
                'first_name': f'Full name cannot exceed 35 characters (currently {len(full_name)} characters).'
            })
        return attrs

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone_number']

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Public self-registration is strictly for patients
        validated_data['role'] = User.Role.PATIENT
        user = User.objects.create_user(password=password, **validated_data)
        return user
