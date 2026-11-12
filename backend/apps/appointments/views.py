import os
import io
import uuid
import json
import base64
import logging
import tempfile
from PIL import Image
from django.conf import settings
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.core.permissions import IsStaffOrAdmin, IsPatientUser
from .models import Appointment, Notification, Prescription, Patient
from apps.users.models import User
from .serializers import AppointmentSerializer, NotificationSerializer, ClinicSettingsSerializer, AppointmentSettingsSerializer
from datetime import datetime, time, date
import zoneinfo
from django.utils import timezone
from .services.whatsapp_service import whatsapp_service
from .services.prescription_pdf import generate_prescription_pdf_bytes

logger = logging.getLogger(__name__)


def normalize_date_str(date_str):
    if not date_str:
        return ''
    date_str = str(date_str).strip()
    formats = [
        '%d %B %Y',      # 16 October 2026
        '%d %b %Y',      # 16 Oct 2026
        '%Y-%m-%d',     # 2026-10-16
        '%d-%m-%Y',     # 16-10-2026
        '%d/%m/%Y',     # 16/10/2026
        '%b %d, %Y',    # Oct 16, 2026
        '%B %d, %Y',    # October 16, 2026
        '%d %B, %Y',    # 16 October, 2026
        '%d %b, %Y',    # 16 Oct, 2026
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).strftime('%Y-%m-%d')
        except (ValueError, TypeError):
            continue
    return date_str.lower().strip()


def is_upcoming_or_today(date_str):
    if not date_str:
        return True
    norm = normalize_date_str(date_str)
    if norm and len(norm.split('-')) == 3:
        try:
            apt_d = datetime.strptime(norm, '%Y-%m-%d').date()
            return apt_d >= datetime.now().date()
        except Exception:
            return True
    return True


def normalize_time_str(time_str):
    if not time_str:
        return ''
    import re
    raw = str(time_str).strip()
    parts = re.split(r'\s*[-–—]\s*|\s+to\s+', raw, flags=re.IGNORECASE)
    t = parts[0].strip().upper() if parts else raw.upper()
    for fmt in ['%I:%M %p', '%H:%M', '%I:%M%p', '%I:%M %P', '%I:%M']:
        try:
            return datetime.strptime(t, fmt).strftime('%I:%M %p')
        except (ValueError, TypeError):
            continue
    m = re.match(r'^(\d{1,2}):(\d{2})\s*(AM|PM)?$', t, re.IGNORECASE)
    if m:
        h, mn, p = m.groups()
        h_int = int(h)
        if p:
            return f"{h_int:02d}:{mn} {p.upper()}"
        else:
            period = 'AM' if h_int < 12 else 'PM'
            disp_h = h_int if 1 <= h_int <= 12 else (h_int - 12 if h_int > 12 else 12)
            return f"{disp_h:02d}:{mn} {period}"
    return t

def parse_time_to_minutes(time_str):
    if not time_str:
        return None
    import re
    cleaned = str(time_str).strip()
    match = re.match(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', cleaned, re.IGNORECASE)
    if not match:
        for fmt in ['%I:%M %p', '%H:%M', '%I:%M%p', '%I:%M %P']:
            try:
                dt = datetime.strptime(cleaned, fmt)
                return dt.hour * 60 + dt.minute
            except (ValueError, TypeError):
                continue
        return None
    h, m, p = match.groups()
    hours = int(h)
    minutes = int(m)
    period = p.upper()
    if period == 'PM' and hours != 12:
        hours += 12
    elif period == 'AM' and hours == 12:
        hours = 0
    return hours * 60 + minutes


def check_date_restriction(date_str_or_obj, restrictions):
    """
    Checks if a given date falls inside any active date restriction.
    Returns (is_restricted: bool, reason: str or None)
    """
    if not date_str_or_obj or not restrictions:
        return False, None
    norm = normalize_date_str(str(date_str_or_obj))
    if not norm or len(norm.split('-')) != 3:
        return False, None
    for item in restrictions:
        if not isinstance(item, dict):
            continue
        start_d = normalize_date_str(item.get('startDate') or item.get('start_date') or '')
        end_d = normalize_date_str(item.get('endDate') or item.get('end_date') or '')
        if start_d and end_d:
            if start_d <= norm <= end_d:
                reason = item.get('reason') or item.get('label') or 'Clinic closed on this date'
                return True, reason
    return False, None


def get_working_hours_for_date(date_str_or_obj, clinic_settings):
    """
    Returns (start_time: str, end_time: str, is_custom: bool, reason: str or None)
    """
    default_hours = clinic_settings.get('consultationHours') or clinic_settings.get('consultation_hours') or '09:00 AM - 06:00 PM'
    parts = [p.strip() for p in default_hours.split('-')]
    def_start = parts[0] if len(parts) > 0 else '09:00 AM'
    def_end = parts[1] if len(parts) > 1 else '06:00 PM'

    norm = normalize_date_str(str(date_str_or_obj)) if date_str_or_obj else None
    if not norm or len(norm.split('-')) != 3:
        return def_start, def_end, False, None

    custom_list = clinic_settings.get('customWorkingHours') or clinic_settings.get('custom_working_hours') or []
    for item in custom_list:
        if not isinstance(item, dict):
            continue
        start_d = normalize_date_str(item.get('startDate') or item.get('start_date') or '')
        end_d = normalize_date_str(item.get('endDate') or item.get('end_date') or '')
        if start_d and end_d and start_d <= norm <= end_d:
            c_start = item.get('startTime') or item.get('start_time') or def_start
            c_end = item.get('endTime') or item.get('end_time') or def_end
            reason = item.get('reason') or item.get('label') or 'Special working hours'
            return c_start, c_end, True, reason

    return def_start, def_end, False, None


def generate_time_slots(start_time_str, end_time_str, slot_duration_str):
    try:
        duration_mins = int(''.join(c for c in str(slot_duration_str) if c.isdigit())) or 30
    except Exception:
        duration_mins = 30
    if duration_mins <= 0:
        duration_mins = 30

    def _to_mins(t_str):
        if not t_str:
            return None
        t_clean = str(t_str).strip().upper()
        for fmt in ('%I:%M %p', '%I:%M%p', '%H:%M'):
            try:
                dt = datetime.strptime(t_clean, fmt)
                return dt.hour * 60 + dt.minute
            except Exception:
                pass
        return None

    s_mins = _to_mins(start_time_str)
    e_mins = _to_mins(end_time_str)
    if s_mins is None:
        s_mins = 9 * 60
    if e_mins is None:
        e_mins = 18 * 60

    slots = []
    curr = s_mins
    while curr < e_mins:
        h = curr // 60
        m = curr % 60
        period = 'AM' if h < 12 else 'PM'
        display_h = h if 1 <= h <= 12 else (h - 12 if h > 12 else 12)
        slot_str = f"{display_h:02d}:{m:02d} {period}"
        slots.append(slot_str)
        curr += duration_mins
    return slots


class AppointmentSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date_param = request.query_params.get('date') or request.query_params.get('appointment_date')
        exclude_id = request.query_params.get('exclude_id') or request.query_params.get('exclude_appointment_id')

        active_appointments = Appointment.objects.exclude(status__iexact='Cancelled').only('appointment_date', 'time_slot')
        if exclude_id:
            if str(exclude_id).isdigit():
                active_appointments = active_appointments.exclude(pk=int(exclude_id))
            else:
                active_appointments = active_appointments.exclude(appointment_id=str(exclude_id))

        all_booked = {}

        for apt in active_appointments:
            d_norm = normalize_date_str(apt.appointment_date)
            t_norm = normalize_time_str(apt.time_slot)
            if not d_norm or not t_norm:
                continue

            t_variants = {t_norm, t_norm.lstrip('0')}

            if d_norm not in all_booked:
                all_booked[d_norm] = set()
            all_booked[d_norm].update(t_variants)

            raw_d = (apt.appointment_date or '').strip()
            if raw_d:
                if raw_d not in all_booked:
                    all_booked[raw_d] = set()
                all_booked[raw_d].update(t_variants)

        all_booked_serialized = {k: sorted(list(v)) for k, v in all_booked.items()}

        booked_slots = []
        target_norm = ''
        if date_param:
            target_norm = normalize_date_str(date_param)
            slots_set = set()
            if target_norm in all_booked_serialized:
                slots_set.update(all_booked_serialized[target_norm])
            raw_target = date_param.strip()
            if raw_target in all_booked_serialized:
                slots_set.update(all_booked_serialized[raw_target])
            booked_slots = sorted(list(slots_set))

        clinic_settings = load_clinic_settings()
        working_days = clinic_settings.get('workingDays') or clinic_settings.get('working_days') or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        is_working_day = True
        if target_norm:
            try:
                from datetime import datetime
                d_obj = datetime.strptime(target_norm, '%Y-%m-%d').date()
                is_working_day = d_obj.strftime('%a') in working_days
            except Exception:
                pass

        restrictions = clinic_settings.get('dateRestrictions') or clinic_settings.get('date_restrictions') or []
        custom_hours = clinic_settings.get('customWorkingHours') or clinic_settings.get('custom_working_hours') or []
        is_restricted, restriction_reason = check_date_restriction(target_norm, restrictions)
        effective_start, effective_end, is_custom_hours, custom_hours_reason = get_working_hours_for_date(target_norm, clinic_settings)
        slot_duration = clinic_settings.get('slotDuration') or clinic_settings.get('slot_duration') or '30 Minutes'
        consultation_hours = clinic_settings.get('consultationHours') or clinic_settings.get('consultation_hours') or '09:00 AM - 06:00 PM'
        generated_slots = generate_time_slots(effective_start, effective_end, slot_duration)

        booked_slots_set = {normalize_time_str(s) for s in booked_slots}
        booked_slots_set.update({s.lstrip('0') for s in booked_slots if s})

        # Calculate truly available slots: generated slots that are not booked
        available_slots = [
            s for s in generated_slots
            if normalize_time_str(s) not in booked_slots_set and s.lstrip('0') not in booked_slots_set
        ]

        return Response({
            'date': date_param,
            'normalized_date': target_norm,
            'booked_slots': booked_slots,
            'all_booked_slots': all_booked_serialized,
            'working_days': working_days,
            'workingDays': working_days,
            'is_working_day': is_working_day,
            'is_date_restricted': is_restricted,
            'restriction_reason': restriction_reason,
            'effective_start_time': effective_start,
            'effective_end_time': effective_end,
            'is_custom_hours': is_custom_hours,
            'custom_hours_reason': custom_hours_reason,
            'date_restrictions': restrictions,
            'dateRestrictions': restrictions,
            'custom_working_hours': custom_hours,
            'customWorkingHours': custom_hours,
            'slot_duration': slot_duration,
            'slotDuration': slot_duration,
            'consultation_hours': consultation_hours,
            'consultationHours': consultation_hours,
            'slots': generated_slots,
            'available_slots': available_slots,
        })


class AppointmentStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        tz = zoneinfo.ZoneInfo('Asia/Kolkata')
        now_kolkata = timezone.now().astimezone(tz)
        today_date = now_kolkata.date()

        start_of_today = datetime.combine(today_date, time.min, tzinfo=tz)
        end_of_today = datetime.combine(today_date, time.max, tzinfo=tz)

        stats = Appointment.objects.aggregate(
            total_count=models.Count('id'),
            today_appointments_count=models.Count('id', filter=models.Q(created_at__gte=start_of_today, created_at__lte=end_of_today)),
            completed_count=models.Count('id', filter=models.Q(status__in=['Complete', 'Completed', 'complete', 'completed'])),
            pending_count=models.Count('id', filter=models.Q(status__in=['Pending', 'Confirmed', 'pending', 'confirmed'])),
            cancelled_count=models.Count('id', filter=models.Q(status__in=['Cancelled', 'cancelled'])),
        )

        today_count = stats.get('today_appointments_count') or 0

        return Response({
            'today_appointments_count': today_count,
            'todayAppointments': today_count,
            'total_appointments_count': stats.get('total_count') or 0,
            'completed_count': stats.get('completed_count') or 0,
            'pending_count': stats.get('pending_count') or 0,
            'cancelled_count': stats.get('cancelled_count') or 0,
            'current_date': str(today_date),
        })


class AppointmentListCreateView(APIView):
    def get_permissions(self):
        return [AllowAny()]

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile')
        email = request.query_params.get('email')
        patient_id = request.query_params.get('patient_id') or request.query_params.get('patientId')
        created_today = (request.query_params.get('created_today') or '').lower() in ['true', '1']
        created_date = request.query_params.get('created_date')
        apt_date = request.query_params.get('appointment_date') or request.query_params.get('date')
        wants_stats = (request.query_params.get('stats') or '').lower() in ['true', '1']

        base_appointments = Appointment.objects.select_related('patient_record').prefetch_related('prescriptions')

        if request.user.is_authenticated:
            if getattr(request.user, 'role', None) == 'PATIENT':
                q = models.Q(user=request.user) | models.Q(patient_record__user=request.user)
                if request.user.email:
                    q |= (models.Q(patient_email__iexact=request.user.email) & (models.Q(user__isnull=True) | models.Q(user=request.user)))
                appointments = base_appointments.filter(q).order_by('-created_at')
            else:
                appointments = base_appointments.all().order_by('-created_at')
                if phone or email or patient_id:
                    q = models.Q()
                    if phone:
                        clean_p = ''.join(c for c in phone if c.isdigit())
                        if clean_p:
                            q |= models.Q(patient_phone__endswith=clean_p[-10:])
                    if email:
                        q |= models.Q(patient_email__iexact=email)
                    if patient_id:
                        q |= models.Q(patient_record__patient_id__iexact=patient_id)
                    appointments = appointments.filter(q)
        else:
            if phone or email or patient_id:
                q = models.Q()
                if phone:
                    clean_p = ''.join(c for c in phone if c.isdigit())
                    if clean_p:
                        q |= models.Q(patient_phone__endswith=clean_p[-10:])
                if email:
                    q |= models.Q(patient_email__iexact=email)
                if patient_id:
                    q |= models.Q(patient_record__patient_id__iexact=patient_id)
                appointments = base_appointments.filter(q).order_by('-created_at')
            else:
                appointments = base_appointments.all().order_by('-created_at')

        # Date and creation-date filters
        tz = zoneinfo.ZoneInfo('Asia/Kolkata')
        now_kolkata = timezone.now().astimezone(tz)
        today_date = now_kolkata.date()

        if created_today or (created_date and str(created_date).strip().lower() == 'today'):
            start_of_day = datetime.combine(today_date, time.min, tzinfo=tz)
            end_of_day = datetime.combine(today_date, time.max, tzinfo=tz)
            appointments = appointments.filter(created_at__gte=start_of_day, created_at__lte=end_of_day)
        elif created_date:
            norm_c = normalize_date_str(created_date)
            try:
                c_date = datetime.strptime(norm_c, '%Y-%m-%d').date()
                start_of_day = datetime.combine(c_date, time.min, tzinfo=tz)
                end_of_day = datetime.combine(c_date, time.max, tzinfo=tz)
                appointments = appointments.filter(created_at__gte=start_of_day, created_at__lte=end_of_day)
            except Exception:
                pass

        if apt_date:
            target_norm = normalize_date_str(apt_date)
            matching_ids = [
                a.id for a in appointments if normalize_date_str(a.appointment_date) == target_norm
            ]
            appointments = appointments.filter(id__in=matching_ids)

        if wants_stats:
            start_of_today = datetime.combine(today_date, time.min, tzinfo=tz)
            end_of_today = datetime.combine(today_date, time.max, tzinfo=tz)
            today_count = Appointment.objects.filter(created_at__gte=start_of_today, created_at__lte=end_of_today).count()
            return Response({
                'today_appointments_count': today_count,
                'todayAppointments': today_count,
                'total_appointments_count': appointments.count(),
                'completed_count': appointments.filter(status__in=['Complete', 'Completed', 'complete', 'completed']).count(),
                'pending_count': appointments.filter(status__in=['Pending', 'Confirmed', 'pending', 'confirmed']).count(),
                'cancelled_count': appointments.filter(status__in=['Cancelled', 'cancelled']).count(),
                'current_date': str(today_date),
            })

        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            req_date = serializer.validated_data.get('appointment_date')
            req_slot = serializer.validated_data.get('time_slot')

            # Ensure requested date is not in the past
            if req_date:
                try:
                    from datetime import datetime, date
                    norm_d = normalize_date_str(req_date)
                    if norm_d and len(norm_d.split('-')) == 3:
                        apt_date_obj = datetime.strptime(norm_d, '%Y-%m-%d').date()
                        if apt_date_obj < date.today():
                            return Response({
                                'error': 'Cannot book an appointment for a past date. Please select today or a future date.',
                                'detail': f"Requested date '{req_date}' is in the past."
                            }, status=status.HTTP_400_BAD_REQUEST)

                        clinic_settings = load_clinic_settings()

                        # 1. Date restriction check
                        restrictions = clinic_settings.get('dateRestrictions') or clinic_settings.get('date_restrictions') or []
                        is_restr, restr_reason = check_date_restriction(norm_d, restrictions)
                        if is_restr:
                            return Response({
                                'error': f"Appointments are unavailable on {req_date} ({restr_reason or 'Clinic closed on this date'}). Please select an open date.",
                                'detail': f"Requested date '{req_date}' is restricted: {restr_reason}"
                            }, status=status.HTTP_400_BAD_REQUEST)

                        # 2. Working day check
                        working_days = clinic_settings.get('workingDays') or clinic_settings.get('working_days') or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        day_abbr = apt_date_obj.strftime('%a')
                        day_full = apt_date_obj.strftime('%A')
                        if day_abbr not in working_days:
                            return Response({
                                'error': f"The clinic is closed on {day_full}s. Please select an available working day.",
                                'detail': f"Requested date '{req_date}' falls on {day_full}, which is a disabled non-working day."
                            }, status=status.HTTP_400_BAD_REQUEST)

                        # 3. Working hours check for requested time slot
                        if req_slot:
                            eff_start, eff_end, is_custom, custom_lbl = get_working_hours_for_date(norm_d, clinic_settings)
                            slot_mins = parse_time_to_minutes(req_slot)
                            start_mins = parse_time_to_minutes(eff_start)
                            end_mins = parse_time_to_minutes(eff_end)
                            if slot_mins is not None and start_mins is not None and end_mins is not None:
                                if slot_mins < start_mins or slot_mins >= end_mins:
                                    hours_desc = f"{eff_start} - {eff_end}" + (f" ({custom_lbl})" if custom_lbl else "")
                                    return Response({
                                        'error': f"The requested time slot '{req_slot}' is outside clinic working hours ({hours_desc}) for this date.",
                                        'detail': f"Slot {req_slot} is not within {eff_start} - {eff_end}."
                                    }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as ex:
                    logger.warning(f"Error checking date/hours restriction: {ex}")
                    pass

            # Prevent double booking: ensure slot on requested date is available
            if req_date and req_slot:
                norm_date = normalize_date_str(req_date)
                norm_slot = normalize_time_str(req_slot)

                active_apts = Appointment.objects.exclude(status__iexact='Cancelled')
                for existing in active_apts:
                    if (normalize_date_str(existing.appointment_date) == norm_date and
                        normalize_time_str(existing.time_slot) == norm_slot):
                        return Response({
                            'error': f"The appointment slot '{req_slot}' on {req_date} has already been booked. Please select an available slot.",
                            'detail': f"Slot {req_slot} on {req_date} is already taken."
                        }, status=status.HTTP_400_BAD_REQUEST)

            user = request.user if request.user.is_authenticated else None
            save_kwargs = {'user': user}
            req_gender = (request.data.get('gender') or request.data.get('patient_gender') or '').strip()
            req_dob = (request.data.get('date_of_birth') or request.data.get('dateOfBirth') or request.data.get('dob') or request.data.get('patient_dob') or '').strip()
            req_age = str(request.data.get('age') or '').strip()
            req_city = (request.data.get('city') or request.data.get('address') or request.data.get('patient_city') or '').strip()

            if req_gender:
                save_kwargs['patient_gender'] = req_gender
            if req_dob:
                save_kwargs['patient_dob'] = req_dob
            if not serializer.validated_data.get('status'):
                save_kwargs['status'] = 'Confirmed'
            if not serializer.validated_data.get('prescription_status'):
                save_kwargs['prescription_status'] = 'Pending'
            appointment = serializer.save(**save_kwargs)

            # Link or create corresponding permanent Patient record in Neon
            p_name = appointment.patient_name.strip()
            p_phone = (appointment.patient_phone or '').strip()
            p_phone_digits = ''.join(c for c in p_phone if c.isdigit())
            p_email = (appointment.patient_email or (user.email if user else '') or '').strip()

            patient = None
            if user:
                patient = Patient.objects.filter(user=user).first()
            if not patient and p_email:
                patient = Patient.objects.filter(email__iexact=p_email).first()
                if not user and patient and patient.user:
                    user = patient.user
                    appointment.user = user
                    appointment.save(update_fields=['user'])
                elif not user and p_email:
                    matched_user = User.objects.filter(email__iexact=p_email, role=User.Role.PATIENT).first()
                    if matched_user:
                        user = matched_user
                        appointment.user = user
                        appointment.save(update_fields=['user'])
            if not patient and not user and p_phone_digits:
                patient = Patient.objects.filter(phone__endswith=p_phone_digits[-10:], user__isnull=True).first()
            if not patient and not user and p_name:
                patient = Patient.objects.filter(name__iexact=p_name, user__isnull=True).first()

            if patient:
                if not patient.user and user:
                    patient.user = user
                if not patient.phone and p_phone:
                    patient.phone = p_phone
                if not patient.email and p_email:
                    patient.email = p_email
                if req_gender:
                    patient.gender = req_gender
                if req_dob:
                    patient.date_of_birth = req_dob
                if req_city:
                    patient.address = req_city
                if req_age or req_gender:
                    age_str = f"{req_age} yrs" if req_age else ''
                    patient.age_gender = f"{age_str} / {req_gender}".strip(' /') if (age_str or req_gender) else patient.age_gender
                patient.save()
            else:
                clean_name = p_name.lower().replace(' ', '.')
                age_gender_val = ''
                if req_age or req_gender:
                    age_str = f"{req_age} yrs" if req_age else ''
                    age_gender_val = f"{age_str} / {req_gender}".strip(' /')
                patient = Patient.objects.create(
                    user=user,
                    name=p_name,
                    phone=p_phone,
                    email=p_email or f"{clean_name}@gmail.com",
                    gender=req_gender,
                    date_of_birth=req_dob,
                    age_gender=age_gender_val,
                    address=req_city,
                    primary_concern=appointment.reason_for_visit or 'General Consultation',
                    known_allergies='None',
                    status='Active'
                )

            # Also update authenticated User profile if gender, dob, or city were supplied
            if user:
                user_updated = False
                if req_gender and hasattr(user, 'gender') and (not user.gender or user.gender != req_gender):
                    user.gender = req_gender
                    user_updated = True
                if req_dob and not user.date_of_birth:
                    try:
                        from datetime import datetime
                        user.date_of_birth = datetime.strptime(req_dob[:10], '%Y-%m-%d').date()
                        user_updated = True
                    except Exception:
                        pass
                if req_city and hasattr(user, 'address') and (not user.address or user.address != req_city):
                    user.address = req_city
                    user_updated = True
                if user_updated:
                    user.save()

            appointment.patient_record = patient
            appointment.save(update_fields=['patient_record'])

            # Automatically create notification for the Admin Portal if newAppointment is enabled
            clinic_settings = load_clinic_settings()
            notif_settings = clinic_settings.get('notifications') or {}
            new_apt_enabled = bool(notif_settings.get('newAppointment', True))
            notification = None
            if new_apt_enabled:
                notification = Notification.objects.create(
                    appointment=appointment,
                    title='New Appointment Booked',
                    patient_name=appointment.patient_name,
                    appointment_date=appointment.appointment_date,
                    booking_time=appointment.time_slot,
                    message=f"New appointment booked by {appointment.patient_name} for {appointment.appointment_date} at {appointment.time_slot}.",
                    is_read=False
                )

            # Automatically deliver Appointment Confirmation PDF via Meta WhatsApp Cloud API in background
            def _async_send_whatsapp_confirmation(apt_id_val):
                try:
                    from django.db import connection
                    connection.close()
                    from apps.appointments.models import Appointment
                    from apps.appointments.services.whatsapp_service import whatsapp_service
                    apt_to_send = Appointment.objects.filter(id=apt_id_val).first()
                    if apt_to_send and apt_to_send.patient_phone:
                        ok, details = whatsapp_service.send_appointment_confirmation(apt_to_send)
                        logger.info(f"WhatsApp confirmation for {apt_to_send.appointment_id}: ok={ok}, details={details}")
                        print(f"[WhatsApp] Appointment confirmation for {apt_to_send.appointment_id} -> Success={ok}, MsgId={details.get('message_id')}")
                except Exception as ex:
                    logger.error(f"Async WhatsApp confirmation dispatch failed: {ex}")
                    print(f"[WhatsApp Error] Failed to send confirmation: {ex}")

            import threading
            threading.Thread(target=_async_send_whatsapp_confirmation, args=(appointment.id,), daemon=True).start()

            return Response({
                'appointment': AppointmentSerializer(appointment).data,
                'notification': NotificationSerializer(notification).data if notification else None
            }, status=status.HTTP_201_CREATED)

        first_err = None
        for field, errs in serializer.errors.items():
            if isinstance(errs, list) and errs:
                first_err = str(errs[0])
                break
            elif isinstance(errs, str):
                first_err = errs
                break
        err_dict = dict(serializer.errors)
        if first_err and 'error' not in err_dict:
            err_dict['error'] = first_err
        if first_err and 'detail' not in err_dict:
            err_dict['detail'] = first_err
        return Response(err_dict, status=status.HTTP_400_BAD_REQUEST)


class AppointmentDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ['GET', 'HEAD', 'OPTIONS']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                apt = Appointment.objects.get(pk=int(pk_or_id))
            else:
                apt = Appointment.objects.get(appointment_id=pk_or_id)
            return Response(AppointmentSerializer(apt).data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                apt = Appointment.objects.get(pk=int(pk_or_id))
            else:
                apt = Appointment.objects.get(appointment_id=pk_or_id)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)

        # Allow staff or appointment owner
        is_staff = request.user.is_staff or request.user.is_superuser or getattr(request.user, 'role', '') in ['ADMIN', 'DOCTOR', 'STAFF', 'RECEPTIONIST']
        if not is_staff:
            user_phone = getattr(request.user, 'phone_number', None) or getattr(request.user, 'phone', None) or ''
            clean_user_phone = ''.join(c for c in str(user_phone) if c.isdigit())
            apt_phone = getattr(apt, 'patient_phone', '') or ''
            clean_apt_phone = ''.join(c for c in str(apt_phone) if c.isdigit())
            phone_match = bool(clean_user_phone and clean_apt_phone and (clean_user_phone[-10:] == clean_apt_phone[-10:]))
            email_match = bool(apt.patient_email and request.user.email and apt.patient_email.strip().lower() == request.user.email.strip().lower())

            is_owner = (
                apt.user == request.user or
                (apt.patient_record and apt.patient_record.user == request.user) or
                email_match or
                phone_match
            )
            if not is_owner:
                return Response({'error': 'You do not have permission to modify this appointment.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        new_date = request.data.get('appointment_date') or request.data.get('date')
        new_time = request.data.get('time_slot') or request.data.get('time')
        new_reason = request.data.get('reason_for_visit') or request.data.get('reason')
        new_prescription_status = request.data.get('prescription_status') or request.data.get('prescriptionStatus')

        if not any([new_status, new_date, new_time, new_reason, new_prescription_status]):
            return Response({'error': 'At least one field to update is required'}, status=status.HTTP_400_BAD_REQUEST)

        current_status_lower = str(apt.status or '').strip().lower()
        is_attempting_reschedule = bool(new_date or new_time or (new_status and str(new_status).strip().lower() == 'rescheduled'))
        if is_attempting_reschedule and current_status_lower in ['complete', 'completed', 'cancelled']:
            return Response({'error': 'Completed or cancelled appointments cannot be rescheduled.'}, status=status.HTTP_400_BAD_REQUEST)

        # Target date and time when rescheduling or modifying appointment slot
        target_date = new_date if new_date else apt.appointment_date
        target_time = new_time if new_time else apt.time_slot
        norm_target_date = normalize_date_str(target_date)
        norm_target_time = normalize_time_str(target_time)

        # Validate schedule changes (new_date or new_time provided, or reschedule requested)
        if new_date or new_time:
            # 1. Date not in the past
            if new_date:
                try:
                    if norm_target_date and len(norm_target_date.split('-')) == 3:
                        apt_date_obj = datetime.strptime(norm_target_date, '%Y-%m-%d').date()
                        today_d = timezone.now().astimezone(zoneinfo.ZoneInfo('Asia/Kolkata')).date()
                        if apt_date_obj < today_d:
                            return Response({
                                'error': 'Cannot reschedule an appointment to a past date. Please select today or a future date.',
                                'detail': f"Target date '{target_date}' is in the past."
                            }, status=status.HTTP_400_BAD_REQUEST)
                except Exception as ex:
                    logger.warning(f"Error checking past date during reschedule: {ex}")

            clinic_settings = load_clinic_settings()

            # 2. Date restrictions check
            if new_date:
                restrictions = clinic_settings.get('dateRestrictions') or clinic_settings.get('date_restrictions') or []
                is_restr, restr_reason = check_date_restriction(norm_target_date, restrictions)
                if is_restr:
                    return Response({
                        'error': f"Appointments are unavailable on {target_date} ({restr_reason or 'Clinic closed on this date'}). Please select an open date.",
                        'detail': f"Target date '{target_date}' is restricted: {restr_reason}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 3. Working days check
                working_days = clinic_settings.get('workingDays') or clinic_settings.get('working_days') or ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                try:
                    apt_date_obj = datetime.strptime(norm_target_date, '%Y-%m-%d').date()
                    day_abbr = apt_date_obj.strftime('%a')
                    day_full = apt_date_obj.strftime('%A')
                    if day_abbr not in working_days:
                        return Response({
                            'error': f"The clinic is closed on {day_full}s. Please select an available working day.",
                            'detail': f"Target date '{target_date}' falls on {day_full}, which is a disabled non-working day."
                        }, status=status.HTTP_400_BAD_REQUEST)
                except Exception:
                    pass

            # 4. Working hours check
            eff_start, eff_end, is_custom, custom_lbl = get_working_hours_for_date(norm_target_date, clinic_settings)
            slot_mins = parse_time_to_minutes(norm_target_time)
            start_mins = parse_time_to_minutes(eff_start)
            end_mins = parse_time_to_minutes(eff_end)
            if slot_mins is not None and start_mins is not None and end_mins is not None:
                if slot_mins < start_mins or slot_mins >= end_mins:
                    hours_desc = f"{eff_start} - {eff_end}" + (f" ({custom_lbl})" if custom_lbl else "")
                    return Response({
                        'error': f"The requested time slot '{target_time}' is outside clinic working hours ({hours_desc}) for this date.",
                        'detail': f"Slot {target_time} is not within {eff_start} - {eff_end}."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # 5. Prevent double booking: ensure target slot on target date is NOT already booked by another active appointment
            other_active_apts = Appointment.objects.exclude(pk=apt.pk).exclude(status__iexact='Cancelled')
            for existing in other_active_apts:
                if (normalize_date_str(existing.appointment_date) == norm_target_date and
                    normalize_time_str(existing.time_slot) == norm_target_time):
                    return Response({
                        'error': f"The appointment slot '{target_time}' on {target_date} has already been booked. Please select an available slot.",
                        'detail': f"Slot {target_time} on {target_date} is already taken by appointment {existing.appointment_id}."
                    }, status=status.HTTP_400_BAD_REQUEST)

        fields_to_update = ['updated_at']
        is_rescheduled = False

        if new_date:
            apt.appointment_date = new_date
            fields_to_update.append('appointment_date')
            is_rescheduled = True

        if new_time:
            apt.time_slot = new_time
            fields_to_update.append('time_slot')
            is_rescheduled = True

        if new_reason:
            apt.reason_for_visit = new_reason
            fields_to_update.append('reason_for_visit')

        if new_status:
            apt.status = new_status
            fields_to_update.append('status')

        req_city = (request.data.get('city') or request.data.get('address') or request.data.get('patient_city') or '').strip()
        if req_city:
            if apt.patient_record:
                apt.patient_record.address = req_city
                apt.patient_record.save(update_fields=['address'])
            if apt.user and hasattr(apt.user, 'address'):
                apt.user.address = req_city
                apt.user.save(update_fields=['address'])

            # When an appointment is marked as completed:
            if str(new_status).strip().lower() in ['complete', 'completed']:
                Notification.objects.filter(
                    appointment=apt,
                    title__in=['New Appointment Booked', 'Confirmed Appointment Reminder']
                ).update(is_read=True)

                clinic_settings = load_clinic_settings()
                notif_settings = clinic_settings.get('notifications') or {}
                rx_updates_enabled = bool(notif_settings.get('prescriptionUpdates', True))

                has_rx = (
                    Prescription.objects.filter(appointment=apt).exists() or
                    (apt.prescription_status and str(apt.prescription_status).strip().lower() in ['complete', 'completed'])
                )
                if rx_updates_enabled and not has_rx:
                    msg = f"Appointment {apt.appointment_id} for {apt.patient_name} marked as Completed. Prescription remaining to be created."
                    rx_notif = Notification.objects.filter(
                        appointment=apt,
                        title='Prescription Remaining',
                    ).first()
                    if not rx_notif:
                        Notification.objects.create(
                            appointment=apt,
                            title='Prescription Remaining',
                            patient_name=apt.patient_name,
                            appointment_date=apt.appointment_date,
                            booking_time=apt.time_slot,
                            message=msg,
                            is_read=False,
                        )
                    else:
                        rx_notif.is_read = False
                        rx_notif.message = msg
                        rx_notif.patient_name = apt.patient_name
                        rx_notif.appointment_date = apt.appointment_date
                        rx_notif.booking_time = apt.time_slot
                        rx_notif.created_at = timezone.now()
                        rx_notif.save()
        elif is_rescheduled and apt.status != 'Cancelled':
            apt.status = 'Rescheduled'
            fields_to_update.append('status')

        if new_prescription_status:
            apt.prescription_status = new_prescription_status
            fields_to_update.append('prescription_status')

        apt.save(update_fields=fields_to_update)

        # If rescheduled, notify Admin & dispatch updated WhatsApp confirmation
        if is_rescheduled or apt.status == 'Rescheduled':
            try:
                Notification.objects.create(
                    appointment=apt,
                    title='Appointment Rescheduled',
                    patient_name=apt.patient_name,
                    appointment_date=apt.appointment_date,
                    booking_time=apt.time_slot,
                    message=f"Appointment {apt.appointment_id} for {apt.patient_name} was rescheduled to {apt.appointment_date} at {apt.time_slot}.",
                    is_read=False
                )
            except Exception as e:
                logger.error(f"Failed to create reschedule notification: {e}")

            def _async_send_reschedule_whatsapp(apt_id_val):
                try:
                    from django.db import connection
                    connection.close()
                    from apps.appointments.models import Appointment
                    from apps.appointments.services.whatsapp_service import whatsapp_service
                    a_send = Appointment.objects.filter(id=apt_id_val).first()
                    if a_send and a_send.patient_phone:
                        whatsapp_service.send_appointment_confirmation(a_send)
                except Exception as ex:
                    logger.error(f"Async reschedule WhatsApp confirmation failed: {ex}")

            import threading
            threading.Thread(target=_async_send_reschedule_whatsapp, args=(apt.id,), daemon=True).start()

        return Response(AppointmentSerializer(apt).data)

    def delete(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                apt = Appointment.objects.get(pk=int(pk_or_id))
            else:
                apt = Appointment.objects.get(appointment_id=pk_or_id)
            apt.delete()
            return Response({'status': 'deleted', 'id': pk_or_id}, status=status.HTTP_204_NO_CONTENT)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        clinic_settings = load_clinic_settings()
        notif_settings = clinic_settings.get('notifications') or {}
        new_appointment_enabled = bool(notif_settings.get('newAppointment', True))
        reminder_param = request.query_params.get('appointment_reminder') or request.query_params.get('appointmentReminder')
        if reminder_param is not None:
            reminder_enabled = str(reminder_param).lower() in ['true', '1', 'yes']
        else:
            reminder_enabled = bool(notif_settings.get('appointmentReminder', False))
        prescription_updates_enabled = bool(notif_settings.get('prescriptionUpdates', True))

        if prescription_updates_enabled:
            # Ensure completed appointments without prescriptions have Prescription Remaining notification
            completed_apts = Appointment.objects.filter(models.Q(status__iexact='Complete') | models.Q(status__iexact='Completed'))
            rx_apt_ids = set(Prescription.objects.filter(appointment__isnull=False).values_list('appointment_id', flat=True))
            existing_rx_notifs = {
                n.appointment_id: n for n in Notification.objects.filter(title='Prescription Remaining')
            }
            to_create = []
            to_update = []
            for c_apt in completed_apts:
                has_rx = (
                    (c_apt.id in rx_apt_ids) or
                    (c_apt.prescription_status and str(c_apt.prescription_status).strip().lower() in ['complete', 'completed'])
                )
                if not has_rx:
                    if c_apt.id not in existing_rx_notifs:
                        to_create.append(Notification(
                            appointment=c_apt,
                            title='Prescription Remaining',
                            patient_name=c_apt.patient_name,
                            appointment_date=c_apt.appointment_date,
                            booking_time=c_apt.time_slot,
                            message=f"Appointment {c_apt.appointment_id} for {c_apt.patient_name} marked as Completed. Prescription remaining to be created.",
                            is_read=False,
                        ))
                else:
                    existing = existing_rx_notifs.get(c_apt.id)
                    if existing and not existing.is_read:
                        existing.is_read = True
                        to_update.append(existing)
            if to_create:
                Notification.objects.bulk_create(to_create)
            if to_update:
                Notification.objects.bulk_update(to_update, ['is_read'])

        notifications_qs = Notification.objects.exclude(title='__SYSTEM_CLINIC_SETTINGS__')

        # Filter notifications based on active notification settings
        if not reminder_enabled:
            notifications_qs = notifications_qs.exclude(
                models.Q(title__icontains='reminder') | models.Q(message__icontains='reminder')
            )

        if not new_appointment_enabled:
            notifications_qs = notifications_qs.exclude(
                models.Q(title__icontains='new') | models.Q(message__icontains='new') |
                (models.Q(title__icontains='appointment') & ~models.Q(title__icontains='prescription')) |
                (models.Q(message__icontains='appointment') & ~models.Q(message__icontains='prescription'))
            )

        if not prescription_updates_enabled:
            notifications_qs = notifications_qs.exclude(
                models.Q(title__icontains='prescription') | models.Q(message__icontains='prescription')
            )

        unread_count = notifications_qs.filter(is_read=False).count()
        notifications = notifications_qs.order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)

        # Query all appointments that are Confirmed (only if reminder_enabled)
        confirmed_reminders = []
        confirmed_patients_count = 0
        confirmed_appointments_count = 0

        if reminder_enabled:
            confirmed_apts = Appointment.objects.filter(status__iexact='Confirmed').order_by('appointment_date', 'time_slot', '-created_at')

            # Count total distinct patients with confirmed appointments
            confirmed_patient_keys = set()
            for apt in confirmed_apts:
                p_key = (apt.patient_phone or '').strip() or (apt.patient_name or '').strip().lower()
                if apt.patient_record_id:
                    p_key = f"rec_{apt.patient_record_id}"
                confirmed_patient_keys.add(p_key)

            confirmed_patients_count = len(confirmed_patient_keys)
            confirmed_appointments_count = len(confirmed_apts)

            # Build confirmed reminders list
            for apt in confirmed_apts:
                confirmed_reminders.append({
                    'id': f"confirmed-reminder-{apt.id}",
                    'raw_id': apt.id,
                    'appointment': apt.id,
                    'appointment_id': apt.appointment_id or f"APT-{apt.id}",
                    'title': 'Confirmed Appointment Reminder',
                    'message': f"Confirmed appointment for {apt.patient_name} on {apt.appointment_date} at {apt.time_slot}.",
                    'patient_name': apt.patient_name,
                    'patient_phone': apt.patient_phone,
                    'patient_email': apt.patient_email or '',
                    'appointment_date': apt.appointment_date,
                    'booking_time': apt.time_slot,
                    'status': 'Confirmed',
                    'is_reminder': True,
                    'is_read': False,
                    'created_at_formatted': 'Confirmed Appointment',
                    'appointment_details': AppointmentSerializer(apt).data,
                })

        # Query all upcoming appointments that are still Pending (only if reminder_enabled)
        pending_reminders = []
        pending_patients_count = 0
        pending_appointments_count = 0

        if reminder_enabled:
            pending_apts = Appointment.objects.filter(status__iexact='Pending').order_by('created_at')
            upcoming_pending = [apt for apt in pending_apts if is_upcoming_or_today(apt.appointment_date)]

            # Count total distinct patients with pending appointments
            pending_patient_keys = set()
            for apt in upcoming_pending:
                p_key = (apt.patient_phone or '').strip() or (apt.patient_name or '').strip().lower()
                if apt.patient_record_id:
                    p_key = f"rec_{apt.patient_record_id}"
                pending_patient_keys.add(p_key)

            pending_patients_count = len(pending_patient_keys)
            pending_appointments_count = len(upcoming_pending)

            # Build pending reminders list
            for apt in upcoming_pending:
                pending_reminders.append({
                    'id': f"pending-reminder-{apt.id}",
                    'raw_id': apt.id,
                    'appointment': apt.id,
                    'appointment_id': apt.appointment_id or f"APT-{apt.id}",
                    'title': 'Pending Appointment Reminder',
                    'message': f"Pending appointment for {apt.patient_name} on {apt.appointment_date} at {apt.time_slot} is awaiting confirmation.",
                    'patient_name': apt.patient_name,
                    'patient_phone': apt.patient_phone,
                    'patient_email': apt.patient_email or '',
                    'appointment_date': apt.appointment_date,
                    'booking_time': apt.time_slot,
                    'status': 'Pending',
                    'is_reminder': True,
                    'is_read': False,
                    'created_at_formatted': 'Pending Confirmation',
                    'appointment_details': AppointmentSerializer(apt).data,
                })

        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
            'new_appointment_enabled': new_appointment_enabled,
            'appointment_reminder_enabled': reminder_enabled,
            'prescription_updates_enabled': prescription_updates_enabled,
            'confirmed_patients_count': confirmed_patients_count,
            'confirmed_appointments_count': confirmed_appointments_count,
            'confirmed_reminders': confirmed_reminders,
            'pending_patients_count': pending_patients_count,
            'pending_appointments_count': pending_appointments_count,
            'pending_reminders': pending_reminders,
        })


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def post(self, request, pk):
        try:
            if isinstance(pk, str) and (pk.startswith('confirmed-reminder-') or pk.startswith('pending-reminder-')):
                return Response({'status': 'success', 'id': pk})
            notification = Notification.objects.get(pk=pk)
            notification.is_read = True
            notification.save()
            return Response({'status': 'success', 'notification': NotificationSerializer(notification).data})
        except (Notification.DoesNotExist, ValueError):
            return Response({'status': 'success', 'id': pk})


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def post(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'success', 'unread_count': 0})


class PatientHistoryListView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        # Auto-link any unlinked appointments only if any exist
        if Appointment.objects.filter(patient_record__isnull=True).exists():
            for unlinked_apt in Appointment.objects.filter(patient_record__isnull=True):
                p_name = (unlinked_apt.patient_name or '').strip()
                p_phone = (unlinked_apt.patient_phone or '').strip()
                clean_digits = ''.join(c for c in p_phone if c.isdigit())
                patient = None
                if clean_digits:
                    patient = Patient.objects.filter(phone__endswith=clean_digits[-10:]).first()
                if not patient and unlinked_apt.patient_email:
                    patient = Patient.objects.filter(email__iexact=unlinked_apt.patient_email.strip()).first()
                if not patient and p_name:
                    patient = Patient.objects.filter(name__iexact=p_name).first()
                if not patient and p_name:
                    p_user = unlinked_apt.user if (unlinked_apt.user and getattr(unlinked_apt.user, 'role', '') == User.Role.PATIENT) else None
                    patient = Patient.objects.create(
                        user=p_user,
                        name=p_name,
                        phone=p_phone,
                        email=unlinked_apt.patient_email or f"{p_name.lower().replace(' ', '.')}@gmail.com",
                        primary_concern=unlinked_apt.reason_for_visit or 'General Consultation',
                        status='Active'
                    )
                if patient:
                    unlinked_apt.patient_record = patient
                    unlinked_apt.save(update_fields=['patient_record'])

        # Auto-link any unlinked prescriptions only if any exist
        if Prescription.objects.filter(patient_record__isnull=True).exists():
            for unlinked_rx in Prescription.objects.filter(patient_record__isnull=True):
                p_name = (unlinked_rx.patient_name or '').strip()
                p_phone = (unlinked_rx.patient_phone or '').strip()
                clean_digits = ''.join(c for c in p_phone if c.isdigit())
                patient = None
                if unlinked_rx.patient_id_ref:
                    patient = Patient.objects.filter(patient_id=unlinked_rx.patient_id_ref).first()
                if not patient and clean_digits:
                    patient = Patient.objects.filter(phone__endswith=clean_digits[-10:]).first()
                if not patient and p_name:
                    patient = Patient.objects.filter(name__iexact=p_name).first()
                if patient:
                    unlinked_rx.patient_record = patient
                    unlinked_rx.save(update_fields=['patient_record'])

        patients = Patient.objects.filter(user__isnull=False, user__role=User.Role.PATIENT).prefetch_related(
            models.Prefetch('appointments', queryset=Appointment.objects.order_by('-created_at')),
            models.Prefetch('prescriptions', queryset=Prescription.objects.select_related('appointment').order_by('-created_at'))
        ).order_by('-created_at', '-id')
        data = []

        for p in patients:
            parts = p.name.strip().split()
            initials = "".join([part[0].upper() for part in parts[:2]]) if parts else "PT"

            p_apts = list(p.appointments.all())
            apts_data = [{
                'id': apt.appointment_id,
                'appointment_id': apt.appointment_id,
                'date': apt.appointment_date,
                'time': apt.time_slot,
                'reason': apt.reason_for_visit,
                'reason_for_visit': apt.reason_for_visit,
                'status': apt.status,
                'consultationType': apt.consultation_type,
            } for apt in p_apts]

            p_rxs = list(p.prescriptions.all())
            rxs_data = [{
                'id': rx.prescription_id,
                'rxId': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientId': p.patient_id,
                'patient_id_ref': p.patient_id,
                'appointment_id': rx.appointment.appointment_id if rx.appointment else '',
                'apt_number': rx.appointment.appointment_id if rx.appointment else '',
                'aptNumber': rx.appointment.appointment_id if rx.appointment else '',
                'mobile': rx.patient_phone or p.phone,
                'ageGender': rx.age_gender or p.age_gender,
                'date': rx.date,
                'time': rx.time,
                'complaint': rx.complaint,
                'reason': (rx.appointment.reason_for_visit if rx.appointment else '') or rx.complaint,
                'reason_for_visit': (rx.appointment.reason_for_visit if rx.appointment else '') or rx.complaint,
                'symptoms': rx.symptoms,
                'diagnosis': rx.diagnosis,
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions,
                'status': rx.status,
            } for rx in p_rxs]

            last_visit = p_apts[0].appointment_date if p_apts else (p_rxs[0].date if p_rxs else 'N/A')
            total_visits = len(p_apts)

            data.append({
                'id': p.patient_id,
                'database_id': p.id,
                'name': p.name,
                'initials': initials,
                'ageGender': p.age_gender,
                'mobile': p.phone,
                'email': p.email or f"{p.name.lower().replace(' ', '.')}@gmail.com",
                'address': p.address,
                'bloodGroup': p.blood_group,
                'knownAllergies': p.known_allergies,
                'primaryConcern': p.primary_concern,
                'notes': p.notes,
                'lastVisit': last_visit,
                'totalVisits': total_visits,
                'status': p.status,
                'appointments': apts_data,
                'prescriptions': rxs_data,
            })

        return Response(data)


class PatientDetailUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get_object(self, patient_id):
        try:
            if str(patient_id).isdigit():
                return Patient.objects.get(pk=int(patient_id))
            return Patient.objects.get(patient_id=patient_id)
        except Patient.DoesNotExist:
            return None

    def get(self, request, patient_id):
        patient = self.get_object(patient_id)
        if not patient:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        p_apts = patient.appointments.all().order_by('-created_at')
        p_rxs = patient.prescriptions.all().order_by('-created_at')
        parts = patient.name.strip().split()
        initials = "".join([part[0].upper() for part in parts[:2]]) if parts else "PT"

        return Response({
            'id': patient.patient_id,
            'database_id': patient.id,
            'name': patient.name,
            'initials': initials,
            'ageGender': patient.age_gender,
            'mobile': patient.phone,
            'email': patient.email,
            'address': patient.address,
            'bloodGroup': patient.blood_group,
            'knownAllergies': patient.known_allergies,
            'primaryConcern': patient.primary_concern,
            'notes': patient.notes,
            'status': patient.status,
            'totalVisits': p_apts.count(),
            'lastVisit': p_apts[0].appointment_date if p_apts.exists() else 'N/A',
            'appointments': [{
                'id': a.appointment_id,
                'appointment_id': a.appointment_id,
                'date': a.appointment_date,
                'time': a.time_slot,
                'reason': a.reason_for_visit,
                'reason_for_visit': a.reason_for_visit,
                'status': a.status,
                'consultationType': a.consultation_type,
            } for a in p_apts],
            'prescriptions': [{
                'id': r.prescription_id,
                'rxId': r.prescription_id,
                'database_id': r.id,
                'name': r.patient_name or patient.name,
                'patientName': r.patient_name or patient.name,
                'mobile': r.patient_phone or patient.phone,
                'ageGender': r.age_gender or patient.age_gender,
                'appointment_id': r.appointment.appointment_id if r.appointment else '',
                'apt_number': r.appointment.appointment_id if r.appointment else '',
                'aptNumber': r.appointment.appointment_id if r.appointment else '',
                'date': r.date,
                'time': r.time,
                'diagnosis': r.diagnosis,
                'complaint': r.complaint,
                'reason': (r.appointment.reason_for_visit if r.appointment else '') or r.complaint,
                'reason_for_visit': (r.appointment.reason_for_visit if r.appointment else '') or r.complaint,
                'symptoms': r.symptoms,
                'status': r.status,
                'medicines': r.medicines or [],
                'additionalInstructions': r.additional_instructions,
                'patientId': patient.patient_id,
                'patient_id_ref': patient.patient_id,
            } for r in p_rxs],
        })

    def patch(self, request, patient_id):
        patient = self.get_object(patient_id)
        if not patient:
            return Response({'error': 'Patient not found'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['status', 'notes', 'known_allergies', 'primary_concern', 'phone', 'email', 'address', 'age_gender', 'blood_group']:
            if field in request.data:
                setattr(patient, field, request.data[field])

        patient.save()
        return Response({'status': 'success', 'patient_id': patient.patient_id, 'patient_status': patient.status})


class PrescriptionListView(APIView):
    def get_permissions(self):
        if self.request.method in ['POST']:
            return [IsAuthenticated(), IsStaffOrAdmin()]
        return [IsAuthenticated()]

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile')
        email = request.query_params.get('email')
        patient_id = request.query_params.get('patient_id') or request.query_params.get('patientId')

        base_prescriptions = Prescription.objects.select_related('patient_record', 'appointment')

        if request.user.is_authenticated:
            if getattr(request.user, 'role', None) == 'PATIENT':
                p_ids = list(Patient.objects.filter(user=request.user).values_list('patient_id', flat=True))
                q = models.Q(patient_record__user=request.user) | models.Q(patient_id_ref__in=p_ids)
                if request.user.email:
                    q |= (models.Q(patient_record__email__iexact=request.user.email) & (models.Q(patient_record__user=request.user) | models.Q(patient_record__user__isnull=True)))
                prescriptions = base_prescriptions.filter(q).order_by('-created_at')
            else:
                prescriptions = base_prescriptions.all().order_by('-created_at')
        elif phone or email or patient_id:
            q = models.Q()
            if phone:
                clean_p = ''.join(c for c in phone if c.isdigit())
                if clean_p:
                    q |= models.Q(patient_phone__endswith=clean_p[-10:])
            if email:
                q |= models.Q(patient_record__email__iexact=email)
            if patient_id:
                q |= models.Q(patient_id_ref__iexact=patient_id) | models.Q(patient_record__patient_id__iexact=patient_id)
            prescriptions = base_prescriptions.filter(q).order_by('-created_at')
        else:
            prescriptions = base_prescriptions.all().order_by('-created_at')

        data = []
        for rx in prescriptions:
            pid = rx.patient_id_ref or (rx.patient_record.patient_id if rx.patient_record else '')
            complaint_val = (rx.complaint or '').strip()
            if not complaint_val or complaint_val.lower() == 'consultation':
                if rx.appointment and rx.appointment.reason_for_visit and rx.appointment.reason_for_visit.strip():
                    complaint_val = rx.appointment.reason_for_visit.strip()
                elif rx.patient_record:
                    linked_apt = rx.patient_record.appointments.exclude(status='Cancelled').order_by('-created_at').first()
                    if linked_apt and linked_apt.reason_for_visit and linked_apt.reason_for_visit.strip():
                        complaint_val = linked_apt.reason_for_visit.strip()
                    elif rx.patient_record.primary_concern and rx.patient_record.primary_concern.strip() and rx.patient_record.primary_concern.lower() != 'consultation':
                        complaint_val = rx.patient_record.primary_concern.strip()
                if not complaint_val and rx.patient_name:
                    linked_apt = Appointment.objects.filter(patient_name__iexact=rx.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
                    if linked_apt and linked_apt.reason_for_visit and linked_apt.reason_for_visit.strip():
                        complaint_val = linked_apt.reason_for_visit.strip()

            apt_num = ''
            if rx.appointment and rx.appointment.appointment_id:
                apt_num = rx.appointment.appointment_id
            elif rx.patient_record:
                linked_apt = rx.patient_record.appointments.exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.appointment_id:
                    apt_num = linked_apt.appointment_id
            if not apt_num and rx.patient_name:
                linked_apt = Appointment.objects.filter(patient_name__iexact=rx.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.appointment_id:
                    apt_num = linked_apt.appointment_id

            rx_reason = (rx.appointment.reason_for_visit if rx.appointment else '') or complaint_val or rx.complaint
            data.append({
                'id': rx.prescription_id,
                'rxId': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientName': rx.patient_name,
                'patientId': pid,
                'patient_id_ref': pid,
                'appointment_id': apt_num,
                'appointmentId': apt_num,
                'apt_number': apt_num,
                'aptNumber': apt_num,
                'appointment_number': apt_num,
                'mobile': rx.patient_phone,
                'contact': rx.patient_phone,
                'ageGender': rx.age_gender,
                'date': rx.date,
                'time': rx.time,
                'complaint': complaint_val or rx.complaint,
                'reason': rx_reason,
                'reason_for_visit': rx_reason,
                'reasonForVisit': rx_reason,
                'symptoms': rx.symptoms,
                'diagnosis': rx.diagnosis,
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions,
                'status': rx.status,
                'created_at': rx.created_at.isoformat() if rx.created_at else None,
            })
        return Response(data)

    def post(self, request):
        payload = request.data
        patient_info = payload.get('patient') or {}
        patient_name = (payload.get('patient_name') or patient_info.get('name') or payload.get('name') or 'Patient').strip()
        patient_phone = (payload.get('patient_phone') or patient_info.get('phone') or patient_info.get('mobile') or payload.get('mobile') or '').strip()
        patient_id_ref = (payload.get('patient_id_ref') or payload.get('patientId') or patient_info.get('id') or '').strip()
        age_gender = (payload.get('age_gender') or payload.get('ageGender') or patient_info.get('ageGender') or f"{patient_info.get('age', '')} / {patient_info.get('gender', '')}").strip(' /')

        # Validate mandatory medicines and dosage instructions
        medicines_data = payload.get('medicines') or []
        if not isinstance(medicines_data, list) or len(medicines_data) == 0:
            return Response(
                {'error': 'Please add at least one medicine and complete the prescription before proceeding.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        valid_medicines = []
        for m in medicines_data:
            if not isinstance(m, dict):
                continue
            name = (m.get('name') or m.get('medicine_name') or '').strip()
            potency = (m.get('potency') or '').strip()
            dosage = (m.get('dosage') or '').strip()
            duration = (m.get('duration') or '').strip()
            if not name or not potency or not dosage or not duration:
                return Response(
                    {'error': 'Please add at least one medicine and complete the prescription before proceeding.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            valid_medicines.append({
                'name': name,
                'potency': potency,
                'dosage': dosage,
                'duration': duration,
                'instructions': (m.get('instructions') or '').strip(),
            })

        if not valid_medicines:
            return Response(
                {'error': 'Please add at least one medicine and complete the prescription before proceeding.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Find or create corresponding permanent Patient in Neon
        patient = None
        if patient_id_ref:
            patient = Patient.objects.filter(patient_id=patient_id_ref).first()
        if not patient:
            patient = Patient.objects.filter(
                models.Q(name__iexact=patient_name) |
                (models.Q(phone__iexact=patient_phone) if patient_phone else models.Q(name__iexact=patient_name))
            ).first()
        if not patient:
            clean_name = patient_name.lower().replace(' ', '.')
            patient = Patient.objects.create(
                name=patient_name,
                phone=patient_phone,
                email=f"{clean_name}@gmail.com",
                age_gender=age_gender or '30 / Adult',
                primary_concern=payload.get('complaint') or payload.get('mainComplaint') or payload.get('reason_for_visit') or '',
                status='Active'
            )

        from datetime import datetime
        raw_date = payload.get('date') or payload.get('appointmentDate') or datetime.now().strftime('%d %b %Y')
        if raw_date and '-' in str(raw_date) and len(str(raw_date).split('-')) == 3:
            try:
                parts = str(raw_date).split('-')
                d_obj = datetime(int(parts[0]), int(parts[1]), int(parts[2]))
                formatted_date = d_obj.strftime('%d %b %Y')
            except Exception:
                formatted_date = str(raw_date)
        else:
            formatted_date = str(raw_date)

        time_str = payload.get('time') or datetime.now().strftime('%I:%M %p')

        # Helper to generate date string variations for precise matching
        def _get_date_variations(d_str):
            variations = set()
            if not d_str:
                return variations
            s = str(d_str).strip()
            variations.add(s)
            if '-' in s and len(s.split('-')) == 3:
                try:
                    parts = s.split('-')
                    y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
                    dt = datetime(y, m, d)
                    variations.add(dt.strftime('%d %b %Y'))
                    variations.add(f"{d} {dt.strftime('%b')} {y}")
                    variations.add(dt.strftime('%d %B %Y'))
                    variations.add(f"{d} {dt.strftime('%B')} {y}")
                    variations.add(f"{y}-{m:02d}-{d:02d}")
                except Exception:
                    pass
            else:
                for fmt in ('%d %b %Y', '%d %B %Y', '%Y-%m-%d'):
                    try:
                        dt = datetime.strptime(s, fmt)
                        variations.add(dt.strftime('%d %b %Y'))
                        variations.add(f"{dt.day} {dt.strftime('%b')} {dt.year}")
                        variations.add(dt.strftime('%d %B %Y'))
                        variations.add(f"{dt.day} {dt.strftime('%B')} {dt.year}")
                        variations.add(f"{dt.year}-{dt.month:02d}-{dt.day:02d}")
                        break
                    except Exception:
                        continue
            return variations

        # 1. First, check if exact appointment ID was provided in payload
        apt_id = (
            payload.get('appointment_id') or
            payload.get('appointmentId') or
            payload.get('apt_number') or
            payload.get('aptNumber') or
            payload.get('appointment_number')
        )
        matched_apt = None
        if apt_id:
            s_apt = str(apt_id).strip()
            matched_apt = Appointment.objects.filter(
                models.Q(appointment_id__iexact=s_apt) |
                (models.Q(id=int(s_apt)) if s_apt.isdigit() else models.Q(appointment_id__iexact=s_apt))
            ).first()

        # 2. If not found by ID, match specifically by Patient AND Appointment Date
        if not matched_apt:
            patient_q = models.Q(patient_name__iexact=patient_name)
            if patient:
                patient_q |= models.Q(patient_record=patient)
            if patient_phone:
                patient_q |= (models.Q(patient_phone__iexact=patient_phone) & models.Q(patient_name__icontains=patient_name.split()[0]))

            date_vars = _get_date_variations(raw_date) | _get_date_variations(formatted_date)
            date_q = models.Q()
            for dv in date_vars:
                date_q |= models.Q(appointment_date__iexact=dv)

            # Match only the exact appointment for this patient on this specific date
            matched_apt = Appointment.objects.filter(patient_q).filter(date_q).exclude(status='Cancelled').order_by('-created_at').first()

        # 3. Fallback to latest appointment for patient if not matched by date
        if not matched_apt and patient:
            matched_apt = patient.appointments.exclude(status='Cancelled').order_by('-created_at').first()
        if not matched_apt and patient_name:
            matched_apt = Appointment.objects.filter(patient_name__iexact=patient_name).exclude(status='Cancelled').order_by('-created_at').first()

        # Resolve actual Reason for Visit entered during appointment booking
        raw_complaint = (
            payload.get('complaint') or
            payload.get('mainComplaint') or
            payload.get('reason_for_visit') or
            payload.get('reason') or
            ''
        ).strip()

        if not raw_complaint or raw_complaint.lower() == 'consultation':
            if matched_apt and matched_apt.reason_for_visit and matched_apt.reason_for_visit.strip():
                raw_complaint = matched_apt.reason_for_visit.strip()
            elif patient:
                linked_apt = patient.appointments.exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.reason_for_visit and linked_apt.reason_for_visit.strip():
                    raw_complaint = linked_apt.reason_for_visit.strip()
                elif patient.primary_concern and patient.primary_concern.strip() and patient.primary_concern.lower() != 'consultation':
                    raw_complaint = patient.primary_concern.strip()
            if not raw_complaint and patient_name:
                linked_apt = Appointment.objects.filter(patient_name__iexact=patient_name).exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.reason_for_visit and linked_apt.reason_for_visit.strip():
                    raw_complaint = linked_apt.reason_for_visit.strip()

        rx = Prescription.objects.create(
            patient_record=patient,
            appointment=matched_apt,
            patient_name=patient_name,
            patient_phone=patient_phone,
            patient_id_ref=patient.patient_id,
            age_gender=age_gender,
            date=formatted_date,
            time=time_str,
            complaint=raw_complaint,
            symptoms=payload.get('symptoms') or '',
            diagnosis=payload.get('diagnosis') or (raw_complaint if raw_complaint else 'Clinical Consultation'),
            medicines=valid_medicines,
            additional_instructions=payload.get('additionalInstructions') or payload.get('additional_instructions') or '',
            status=payload.get('status') or 'Pending',
        )

        # Update matched appointment's prescription status to Complete (appointment status remains until admin manually marks Complete)
        if matched_apt and matched_apt.status != 'Cancelled':
            matched_apt.prescription_status = 'Complete'
            matched_apt.save(update_fields=['prescription_status'])
            Notification.objects.filter(
                appointment=matched_apt,
                title__icontains='Prescription Remaining'
            ).update(is_read=True)

        if rx.patient_name:
            Notification.objects.filter(
                patient_name__iexact=rx.patient_name,
                title__icontains='Prescription Remaining'
            ).update(is_read=True)

        # Create notification if prescriptionUpdates setting is enabled (or by default True)
        clinic_settings = load_clinic_settings()
        notif_settings = clinic_settings.get('notifications') or {}
        rx_notif_enabled = bool(notif_settings.get('prescriptionUpdates', True))
        if rx_notif_enabled:
            try:
                Notification.objects.create(
                    appointment=matched_apt,
                    title='Prescription Updated',
                    patient_name=rx.patient_name,
                    appointment_date=rx.date,
                    booking_time=rx.time,
                    message=f"Prescription {rx.prescription_id} issued for {rx.patient_name}",
                    is_read=False,
                )
            except Exception as e:
                print('Error creating Prescription Updated notification:', e)

        return Response({
            'id': rx.prescription_id,
            'rxId': rx.prescription_id,
            'database_id': rx.id,
            'name': rx.patient_name,
            'patientName': rx.patient_name,
            'patientId': rx.patient_id_ref,
            'patient_id_ref': rx.patient_id_ref,
            'mobile': rx.patient_phone,
            'contact': rx.patient_phone,
            'appointment_id': matched_apt.appointment_id if matched_apt else (payload.get('appointment_id') or payload.get('appointmentId') or ''),
            'appointmentId': matched_apt.appointment_id if matched_apt else (payload.get('appointment_id') or payload.get('appointmentId') or ''),
            'apt_number': matched_apt.appointment_id if matched_apt else (payload.get('appointment_id') or payload.get('appointmentId') or ''),
            'aptNumber': matched_apt.appointment_id if matched_apt else (payload.get('appointment_id') or payload.get('appointmentId') or ''),
            'appointment_number': matched_apt.appointment_id if matched_apt else (payload.get('appointment_id') or payload.get('appointmentId') or ''),
            'appointment_database_id': matched_apt.id if matched_apt else None,
            'ageGender': rx.age_gender,
            'date': rx.date,
            'time': rx.time,
            'complaint': rx.complaint,
            'reason': (matched_apt.reason_for_visit if matched_apt else '') or rx.complaint,
            'reason_for_visit': (matched_apt.reason_for_visit if matched_apt else '') or rx.complaint,
            'reasonForVisit': (matched_apt.reason_for_visit if matched_apt else '') or rx.complaint,
            'symptoms': rx.symptoms,
            'diagnosis': rx.diagnosis,
            'medicines': rx.medicines or [],
            'additionalInstructions': rx.additional_instructions,
            'status': rx.status,
            'created_at': rx.created_at.isoformat() if rx.created_at else None,
            'message': f"Prescription {rx.prescription_id} saved successfully for {rx.patient_name}!"
        }, status=status.HTTP_201_CREATED)

    def patch(self, request):
        rx_id = request.data.get('id') or request.data.get('prescription_id') or request.data.get('rxId')
        if not rx_id:
            return Response({'error': 'id field required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            if str(rx_id).isdigit():
                rx = Prescription.objects.get(pk=int(rx_id))
            else:
                rx = Prescription.objects.get(prescription_id=rx_id)
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

        updated_fields = []
        if 'status' in request.data:
            rx.status = request.data['status']
            updated_fields.append('status')
        if 'medicines' in request.data:
            rx.medicines = request.data['medicines']
            updated_fields.append('medicines')
        if 'diagnosis' in request.data:
            rx.diagnosis = request.data['diagnosis']
            updated_fields.append('diagnosis')
        if 'symptoms' in request.data:
            rx.symptoms = request.data['symptoms']
            updated_fields.append('symptoms')
        if 'additionalInstructions' in request.data or 'additional_instructions' in request.data:
            rx.additional_instructions = request.data.get('additionalInstructions') or request.data.get('additional_instructions')
            updated_fields.append('additional_instructions')

        if updated_fields:
            rx.save(update_fields=updated_fields)

        return Response({
            'id': rx.prescription_id,
            'rxId': rx.prescription_id,
            'status': rx.status,
            'medicines': rx.medicines,
            'diagnosis': rx.diagnosis,
            'symptoms': rx.symptoms,
            'additionalInstructions': rx.additional_instructions,
            'message': f'Prescription {rx.prescription_id} updated successfully'
        })


class PrescriptionDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                rx = Prescription.objects.get(pk=int(pk_or_id))
            else:
                rx = Prescription.objects.get(prescription_id=pk_or_id)
            pid = rx.patient_id_ref or (rx.patient_record.patient_id if rx.patient_record else '')
            complaint_val = (rx.complaint or '').strip()
            if not complaint_val or complaint_val.lower() == 'consultation':
                if rx.appointment and rx.appointment.reason_for_visit and rx.appointment.reason_for_visit.strip():
                    complaint_val = rx.appointment.reason_for_visit.strip()
                elif rx.patient_name:
                    matched_apt = Appointment.objects.filter(patient_name__iexact=rx.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
                    if matched_apt and matched_apt.reason_for_visit and matched_apt.reason_for_visit.strip():
                        complaint_val = matched_apt.reason_for_visit.strip()

            apt_num = ''
            if rx.appointment and rx.appointment.appointment_id:
                apt_num = rx.appointment.appointment_id
            elif rx.patient_record:
                linked_apt = rx.patient_record.appointments.exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.appointment_id:
                    apt_num = linked_apt.appointment_id
            if not apt_num and rx.patient_name:
                linked_apt = Appointment.objects.filter(patient_name__iexact=rx.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
                if linked_apt and linked_apt.appointment_id:
                    apt_num = linked_apt.appointment_id

            rx_reason = (rx.appointment.reason_for_visit if rx.appointment else '') or complaint_val or rx.complaint
            return Response({
                'id': rx.prescription_id,
                'rxId': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientName': rx.patient_name,
                'patientId': pid,
                'appointment_id': apt_num,
                'appointmentId': apt_num,
                'apt_number': apt_num,
                'aptNumber': apt_num,
                'appointment_number': apt_num,
                'status': rx.status,
                'date': rx.date,
                'time': rx.time,
                'complaint': complaint_val or rx.complaint,
                'reason': rx_reason,
                'reason_for_visit': rx_reason,
                'reasonForVisit': rx_reason,
                'diagnosis': rx.diagnosis,
                'symptoms': rx.symptoms,
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions,
            })
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk_or_id):
        cleaned_id = str(pk_or_id).strip()
        lookup = models.Q(prescription_id__iexact=cleaned_id)
        if cleaned_id.isdigit():
            lookup |= models.Q(pk=int(cleaned_id))
        rx = Prescription.objects.filter(lookup).first()
        if not rx:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

        updated_fields = []
        if 'status' in request.data:
            rx.status = request.data['status']
            updated_fields.append('status')
        if 'medicines' in request.data:
            rx.medicines = request.data['medicines']
            updated_fields.append('medicines')
        if 'diagnosis' in request.data:
            rx.diagnosis = request.data['diagnosis']
            updated_fields.append('diagnosis')
        if 'symptoms' in request.data:
            rx.symptoms = request.data['symptoms']
            updated_fields.append('symptoms')
        if 'additionalInstructions' in request.data or 'additional_instructions' in request.data:
            rx.additional_instructions = request.data.get('additionalInstructions') or request.data.get('additional_instructions')
            updated_fields.append('additional_instructions')

        if updated_fields:
            rx.save(update_fields=updated_fields)

        return Response({
            'id': rx.prescription_id,
            'rxId': rx.prescription_id,
            'status': rx.status,
            'medicines': rx.medicines,
            'diagnosis': rx.diagnosis,
            'symptoms': rx.symptoms,
            'additionalInstructions': rx.additional_instructions,
            'message': f'Prescription {rx.prescription_id} updated successfully'
        })


CLINIC_SETTINGS_FILE = os.path.join(settings.BASE_DIR, 'clinic_settings.json')
TMP_CLINIC_SETTINGS_FILE = os.path.join(tempfile.gettempdir(), 'clinic_settings.json')
_IN_MEMORY_CLINIC_SETTINGS = {}

DEFAULT_CLINIC_SETTINGS = {
    'clinicName': 'HOMEOPATHY CLINIC',
    'doctorName': 'Dr. Kumar Tripathi Ampeh (Pat.)',
    'contactNumber': '+91 98765 43210',
    'alternateNumber': '+91 99887 66554',
    'email': 'clinic.tripathi@gmail.com',
    'address': '12, Green Park, Bangalore',
    'profile_image_url': None,
    'working_days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'workingDays': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    'consultation_hours': '09:00 AM - 06:00 PM',
    'consultationHours': '09:00 AM - 06:00 PM',
    'slot_duration': '30 Minutes',
    'slotDuration': '30 Minutes',
    'date_restrictions': [],
    'dateRestrictions': [],
    'custom_working_hours': [],
    'customWorkingHours': [],
    'notifications': {
        'newAppointment': True,
        'appointmentReminder': False,
        'prescriptionUpdates': True,
    },
    'notificationChannels': {
        'whatsapp': True,
        'email': True,
        'sms': False,
    },
}

def load_clinic_settings():
    base = DEFAULT_CLINIC_SETTINGS.copy()

    # 1. Primary repo file
    if os.path.exists(CLINIC_SETTINGS_FILE):
        try:
            with open(CLINIC_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                if isinstance(loaded, dict):
                    base.update(loaded)
        except Exception:
            pass

    # 2. Serverless /tmp writable file
    if os.path.exists(TMP_CLINIC_SETTINGS_FILE):
        try:
            with open(TMP_CLINIC_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                loaded_tmp = json.load(f)
                if isinstance(loaded_tmp, dict):
                    base.update(loaded_tmp)
        except Exception:
            pass

    # 3. Active in-memory cache
    if _IN_MEMORY_CLINIC_SETTINGS:
        base.update(_IN_MEMORY_CLINIC_SETTINGS)

    # 4. Neon PostgreSQL persistent storage (consistent across serverless lambda instances)
    try:
        from .models import Notification
        sys_notif = Notification.objects.filter(title='__SYSTEM_CLINIC_SETTINGS__').first()
        if sys_notif and sys_notif.message:
            db_settings = json.loads(sys_notif.message)
            if isinstance(db_settings, dict):
                base.update(db_settings)
    except Exception:
        pass

    return base

def save_clinic_settings(data):
    current = load_clinic_settings()
    current.update(data)
    _IN_MEMORY_CLINIC_SETTINGS.update(current)

    # 1. Attempt writing to repo file (works on local development / writable disks)
    try:
        with open(CLINIC_SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(current, f, indent=2)
    except (OSError, IOError, PermissionError) as e:
        logger.info(f"Primary clinic_settings.json is read-only (serverless environment): {e}")

    # 2. Attempt writing to /tmp directory (always writable on serverless Vercel / AWS Lambda)
    try:
        with open(TMP_CLINIC_SETTINGS_FILE, 'w', encoding='utf-8') as f:
            json.dump(current, f, indent=2)
    except Exception as e:
        logger.info(f"Unable to write to tmp clinic_settings.json: {e}")

    # 3. Persist to Neon PostgreSQL database
    try:
        from .models import Notification
        sys_notif, _ = Notification.objects.get_or_create(title='__SYSTEM_CLINIC_SETTINGS__')
        sys_notif.message = json.dumps(current)
        sys_notif.save(update_fields=['message'])
    except Exception as e:
        logger.info(f"DB clinic settings save notice: {e}")

    return current

class PatientMyProfileView(APIView):
    permission_classes = [IsAuthenticated, IsPatientUser]

    def get(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        # 1. Primary lookup: Patient record directly associated with this authenticated User
        patient = Patient.objects.filter(user=request.user).first()
        if not patient and request.user.email:
            patient = Patient.objects.filter(email__iexact=request.user.email, user__isnull=True).first()
            if patient:
                patient.user = request.user
                patient.save(update_fields=['user'])

        # 2. If authenticated patient has no record yet, create an isolated new record for them
        if not patient:
            full_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            patient = Patient.objects.create(
                user=request.user,
                name=full_name,
                email=request.user.email or f"{request.user.username}@gmail.com",
                phone=getattr(request.user, 'phone_number', '') or '',
                status='Active',
                primary_concern='General Consultation',
                known_allergies='None'
            )

        # Ensure patient name matches user's full name if set
        user_full_name = f"{request.user.first_name} {request.user.last_name}".strip()
        if user_full_name and patient.name != user_full_name:
            patient.name = user_full_name
            patient.save(update_fields=['name'])

        # Synchronize any guest appointments booked with this patient's registered email
        if request.user.email:
            Appointment.objects.filter(
                patient_email__iexact=request.user.email
            ).filter(
                models.Q(user__isnull=True) | models.Q(patient_record__isnull=True) | ~models.Q(patient_record=patient)
            ).update(
                user=request.user,
                patient_record=patient
            )

            # Re-link duplicate unlinked patient records for this email
            dup_patients = Patient.objects.filter(email__iexact=request.user.email, user__isnull=True).exclude(pk=patient.pk)
            for dp in dup_patients:
                Appointment.objects.filter(patient_record=dp).update(patient_record=patient, user=request.user)
                Prescription.objects.filter(patient_record=dp).update(patient_record=patient)
                dp.delete()

        # Fetch appointments strictly belonging to this patient
        p_q = models.Q(patient_record=patient) | models.Q(user=request.user)
        if request.user.email:
            p_q |= models.Q(patient_email__iexact=request.user.email)
        p_apts = Appointment.objects.filter(p_q).prefetch_related('prescriptions').order_by('-created_at')

        # Fetch prescriptions strictly belonging to this patient
        rx_q = models.Q(patient_record=patient)
        if patient.patient_id:
            rx_q |= models.Q(patient_id_ref=patient.patient_id)
        if request.user.email:
            rx_q |= models.Q(patient_record__email__iexact=request.user.email)
        p_rxs = Prescription.objects.filter(rx_q).select_related('patient_record').order_by('-created_at')

        parts = patient.name.strip().split()
        initials = "".join([part[0].upper() for part in parts[:2]]) if parts else "PT"

        dob_val = (
            getattr(patient, 'date_of_birth', '')
            or (request.user.date_of_birth.strftime('%Y-%m-%d') if (request.user.is_authenticated and getattr(request.user, 'date_of_birth', None)) else '')
            or ''
        )
        gender_val = (
            getattr(patient, 'gender', '')
            or (getattr(request.user, 'gender', '') if request.user.is_authenticated else '')
            or ''
        )
        city_val = patient.address or (getattr(request.user, 'address', '') if request.user.is_authenticated else '') or ''
        if request.user.is_authenticated:
            if not patient.address and getattr(request.user, 'address', None):
                patient.address = request.user.address
                patient.save(update_fields=['address'])
                city_val = patient.address
            elif patient.address and hasattr(request.user, 'address') and not request.user.address:
                request.user.address = patient.address
                request.user.save(update_fields=['address'])

        profile_image_url = None
        if request.user.is_authenticated and getattr(request.user, 'profile_image', None):
            try:
                val = str(request.user.profile_image).strip()
                if val.startswith('data:image/') or val.startswith('http://') or val.startswith('https://'):
                    profile_image_url = val
                elif hasattr(request.user.profile_image, 'url'):
                    url = request.user.profile_image.url
                    if url.startswith('http://') or url.startswith('https://') or url.startswith('data:image/'):
                        profile_image_url = url
                    else:
                        profile_image_url = request.build_absolute_uri(url)
                else:
                    profile_image_url = val if val else None
            except Exception:
                profile_image_url = None

        apts_list = list(p_apts)
        rxs_list = list(p_rxs)

        return Response({
            'id': patient.patient_id,
            'database_id': patient.id,
            'name': patient.name,
            'initials': initials,
            'profile_image_url': profile_image_url,
            'gender': gender_val,
            'dateOfBirth': dob_val,
            'date_of_birth': dob_val,
            'dob': dob_val,
            'ageGender': patient.age_gender or (f"{gender_val}" if gender_val else ''),
            'mobile': patient.phone or (getattr(request.user, 'phone_number', '') if request.user.is_authenticated else ''),
            'email': patient.email or (getattr(request.user, 'email', '') if request.user.is_authenticated else ''),
            'address': city_val,
            'city': city_val,
            'bloodGroup': patient.blood_group or '',
            'knownAllergies': patient.known_allergies or '',
            'primaryConcern': patient.primary_concern or '',
            'notes': patient.notes or '',
            'status': patient.status or 'Active',
            'totalVisits': len(apts_list),
            'lastVisit': apts_list[0].appointment_date if apts_list else 'N/A',
            'appointments': [{
                'id': a.appointment_id,
                'appointmentId': a.appointment_id,
                'date': a.appointment_date,
                'time': a.time_slot,
                'reason': a.reason_for_visit,
                'status': a.status,
                'consultationType': a.consultation_type,
                'hasPrescription': bool(len(a.prescriptions.all())),
                'patientName': a.patient_name,
                'patientPhone': a.patient_phone,
                'patientEmail': a.patient_email or '',
                'patientAge': getattr(a, 'patient_age', '') or (patient.age_gender.split('/')[0].strip() if (patient and patient.age_gender) else ''),
                'patientGender': a.patient_gender or (patient.gender if patient else ''),
                'patientDob': getattr(a, 'patient_dob', '') or (patient.date_of_birth if patient else ''),
                'city': (patient.address if patient else '') or city_val,
            } for a in apts_list],
            'prescriptions': [{
                'id': r.prescription_id,
                'rxId': r.prescription_id,
                'prescription_id': r.prescription_id,
                'date': r.date,
                'time': r.time,
                'patientName': r.patient_name,
                'name': r.patient_name,
                'patientId': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else ''),
                'patient_id_ref': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else ''),
                'ageGender': r.age_gender or (r.patient_record.age_gender if r.patient_record else ''),
                'contact': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                'mobile': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                'diagnosis': r.diagnosis,
                'complaint': r.complaint,
                'symptoms': r.symptoms,
                'status': r.status,
                'medicines': r.medicines or [],
                'additionalInstructions': r.additional_instructions,
                'additional_instructions': r.additional_instructions,
                'notes': r.additional_instructions,
                'created_at': r.created_at.isoformat() if r.created_at else None,
                'patient': {
                    'name': r.patient_name,
                    'id': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else ''),
                    'ageGender': r.age_gender or (r.patient_record.age_gender if r.patient_record else ''),
                    'phone': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                    'contact': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                }
            } for r in rxs_list],
        })

    def patch(self, request):
        if not request.user or not request.user.is_authenticated:
            return Response({'error': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)

        patient = Patient.objects.filter(user=request.user).first()
        if not patient and request.user.email:
            patient = Patient.objects.filter(email__iexact=request.user.email, user__isnull=True).first()
            if patient:
                patient.user = request.user
                patient.save(update_fields=['user'])

        if not patient:
            full_name = f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username
            patient = Patient.objects.create(
                user=request.user,
                name=full_name,
                email=request.user.email or f"{request.user.username}@gmail.com",
                phone=getattr(request.user, 'phone_number', '') or '',
                status='Active',
                primary_concern='General Consultation',
                known_allergies='None'
            )

        # 1. Update patient fields
        if 'name' in request.data and request.data['name']:
            patient.name = str(request.data['name']).strip()
        if 'phone' in request.data:
            clean_p = ''.join(c for c in str(request.data['phone']) if c.isdigit())
            patient.phone = clean_p if clean_p else str(request.data['phone']).strip()
        if 'email' in request.data and request.data['email']:
            patient.email = str(request.data['email']).strip()
        if 'gender' in request.data:
            patient.gender = str(request.data['gender']).strip()
            if patient.gender:
                import re
                m = re.search(r'\d+', patient.age_gender or '')
                if m:
                    patient.age_gender = f"{m.group(0)} yrs / {patient.gender}"
                else:
                    patient.age_gender = patient.gender
        if 'date_of_birth' in request.data:
            patient.date_of_birth = str(request.data['date_of_birth']).strip()
        if 'city' in request.data:
            patient.address = str(request.data['city']).strip()
        elif 'address' in request.data:
            patient.address = str(request.data['address']).strip()
        if 'age_gender' in request.data and request.data['age_gender']:
            patient.age_gender = str(request.data['age_gender']).strip()

        for field in ['blood_group', 'known_allergies', 'primary_concern', 'notes']:
            if field in request.data:
                setattr(patient, field, request.data[field])

        patient.save()

        # 2. Synchronize request.user
        user_updated_fields = []
        if request.user.is_authenticated:
            u = request.user
            if 'name' in request.data and request.data['name']:
                name_parts = str(request.data['name']).strip().split(' ', 1)
                u.first_name = name_parts[0]
                u.last_name = name_parts[1] if len(name_parts) > 1 else ''
                user_updated_fields.extend(['first_name', 'last_name'])
            if 'phone' in request.data and hasattr(u, 'phone_number'):
                clean_p = ''.join(c for c in str(request.data['phone']) if c.isdigit())
                u.phone_number = clean_p if clean_p else str(request.data['phone']).strip()
                user_updated_fields.append('phone_number')
            if 'email' in request.data and request.data['email']:
                new_email = str(request.data['email']).strip().lower()
                if u.email != new_email:
                    from django.contrib.auth import get_user_model
                    User = get_user_model()
                    if not User.objects.filter(email=new_email).exclude(pk=u.pk).exists():
                        u.email = new_email
                        user_updated_fields.append('email')
            if 'gender' in request.data and hasattr(u, 'gender'):
                u.gender = str(request.data['gender']).strip()
                user_updated_fields.append('gender')
            if ('city' in request.data or 'address' in request.data) and hasattr(u, 'address'):
                u.address = patient.address
                user_updated_fields.append('address')
            if 'date_of_birth' in request.data:
                try:
                    from datetime import datetime
                    dob_str = str(request.data['date_of_birth']).strip()[:10]
                    u.date_of_birth = datetime.strptime(dob_str, '%Y-%m-%d').date()
                    user_updated_fields.append('date_of_birth')
                except Exception:
                    pass
            if 'profile_image' in request.data or 'profile_image_url' in request.data:
                img_val = request.data.get('profile_image') or request.data.get('profile_image_url')
                if img_val is not None:
                    u.profile_image = str(img_val)
                    user_updated_fields.append('profile_image')

            if user_updated_fields:
                u.save(update_fields=list(set(user_updated_fields)))

        # 3. Synchronize patient appointments
        Appointment.objects.filter(patient_record=patient).update(
            patient_name=patient.name,
            patient_phone=patient.phone,
            patient_email=patient.email
        )

        from apps.users.serializers import UserSerializer
        user_ser = UserSerializer(request.user, context={'request': request}).data if request.user.is_authenticated else None
        return Response({
            'status': 'success',
            'message': 'Profile updated successfully.',
            'patient_id': patient.patient_id,
            'name': patient.name,
            'mobile': patient.phone,
            'email': patient.email,
            'gender': patient.gender,
            'dateOfBirth': patient.date_of_birth,
            'date_of_birth': patient.date_of_birth,
            'city': patient.address,
            'address': patient.address,
            'profile_image_url': user_ser.get('profile_image_url') if user_ser else None,
            'user': user_ser,
        })


class ClinicSettingsView(APIView):
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated(), IsStaffOrAdmin()]

    def get(self, request):
        settings_data = load_clinic_settings()

        # Clean any stale dummy or insecure localhost test URL to prevent Mixed Content
        cur_url = settings_data.get('profile_image_url') or ''
        if 'test_avatar.png' in cur_url or 'placeholder_doctor' in cur_url:
            settings_data['profile_image_url'] = None
            settings_data['profileImageUrl'] = None
            save_clinic_settings(settings_data)
        elif cur_url.startswith('http://') and ('localhost' in cur_url or '127.0.0.1' in cur_url):
            if request.is_secure() or not settings.DEBUG:
                settings_data['profile_image_url'] = None
                settings_data['profileImageUrl'] = None
                save_clinic_settings(settings_data)

        # If user has profile image and not yet in clinic settings, reflect it
        if not settings_data.get('profile_image_url'):
            admin_user = (request.user if (request.user and request.user.is_authenticated and getattr(request.user, 'profile_image', None)) else None)
            if not admin_user:
                admin_user = User.objects.filter(role='ADMIN', profile_image__isnull=False).exclude(profile_image='').first()
            if not admin_user:
                admin_user = User.objects.filter(is_superuser=True, profile_image__isnull=False).exclude(profile_image='').first()
            if admin_user and getattr(admin_user, 'profile_image', None):
                user_img = admin_user.profile_image
                val = str(user_img).strip() if user_img else ''
                if val and not ('test_avatar.png' in val or 'placeholder_doctor' in val):
                    if not (val.startswith('http://') or val.startswith('https://') or val.startswith('data:image/')):
                        val = request.build_absolute_uri(val)
                    settings_data['profile_image_url'] = val
                    settings_data['profileImageUrl'] = val
        return Response(settings_data)

    def post(self, request):
        serializer = ClinicSettingsSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            save_clinic_settings(validated_data)
            return Response(validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.post(request)


class AppointmentSettingsView(APIView):
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [IsAuthenticated(), IsStaffOrAdmin()]

    def get(self, request):
        settings_data = load_clinic_settings()
        return Response({
            'working_days': settings_data.get('working_days', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
            'workingDays': settings_data.get('workingDays', ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
            'consultation_hours': settings_data.get('consultation_hours', '09:00 AM - 06:00 PM'),
            'consultationHours': settings_data.get('consultationHours', '09:00 AM - 06:00 PM'),
            'slot_duration': settings_data.get('slot_duration', '30 Minutes'),
            'slotDuration': settings_data.get('slotDuration', '30 Minutes'),
            'date_restrictions': settings_data.get('date_restrictions', []),
            'dateRestrictions': settings_data.get('dateRestrictions', []),
            'custom_working_hours': settings_data.get('custom_working_hours', []),
            'customWorkingHours': settings_data.get('customWorkingHours', []),
        })

    def post(self, request):
        serializer = AppointmentSettingsSerializer(data=request.data)
        if serializer.is_valid():
            save_clinic_settings(serializer.validated_data)
            all_settings = load_clinic_settings()
            return Response({
                'working_days': all_settings.get('working_days'),
                'workingDays': all_settings.get('workingDays'),
                'consultation_hours': all_settings.get('consultation_hours'),
                'consultationHours': all_settings.get('consultationHours'),
                'slot_duration': all_settings.get('slot_duration'),
                'slotDuration': all_settings.get('slotDuration'),
                'date_restrictions': all_settings.get('date_restrictions', []),
                'dateRestrictions': all_settings.get('dateRestrictions', []),
                'custom_working_hours': all_settings.get('custom_working_hours', []),
                'customWorkingHours': all_settings.get('customWorkingHours', []),
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.post(request)


class NotificationSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrAdmin]

    def get(self, request):
        try:
            clinic_settings = load_clinic_settings()
            return Response({
                'notifications': clinic_settings.get('notifications', {
                    'newAppointment': True,
                    'appointmentReminder': True,
                    'prescriptionUpdates': True,
                }),
                'notificationChannels': clinic_settings.get('notificationChannels', {
                    'whatsapp': True,
                    'email': True,
                    'sms': False,
                })
            })
        except Exception as e:
            logger.error(f"Error reading notification settings: {e}")
            return Response({
                'notifications': {
                    'newAppointment': True,
                    'appointmentReminder': True,
                    'prescriptionUpdates': True,
                },
                'notificationChannels': {
                    'whatsapp': True,
                    'email': True,
                    'sms': False,
                }
            }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            clinic_settings = load_clinic_settings()
            notifications_data = request.data.get('notifications')
            channels_data = request.data.get('notificationChannels') or request.data.get('notification_channels')

            if notifications_data is None and any(k in request.data for k in ['newAppointment', 'appointmentReminder', 'prescriptionUpdates']):
                notifications_data = {
                    'newAppointment': request.data.get('newAppointment', True),
                    'appointmentReminder': request.data.get('appointmentReminder', True),
                    'prescriptionUpdates': request.data.get('prescriptionUpdates', True),
                }

            if notifications_data is not None and isinstance(notifications_data, dict):
                current_notifs = clinic_settings.get('notifications') or {}
                current_notifs.update(notifications_data)
                clinic_settings['notifications'] = current_notifs

            if channels_data is not None and isinstance(channels_data, dict):
                current_channels = clinic_settings.get('notificationChannels') or {}
                current_channels.update(channels_data)
                clinic_settings['notificationChannels'] = current_channels

            save_clinic_settings(clinic_settings)
            return Response({
                'status': 'success',
                'notifications': clinic_settings.get('notifications'),
                'notificationChannels': clinic_settings.get('notificationChannels')
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error saving notification settings: {e}")
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.post(request)


class ClinicProfileImageView(APIView):
    """
    Dedicated endpoint for Admin to upload/update and remove the Clinic Profile picture.
    POST /api/settings/clinic/profile-image/
    DELETE /api/settings/clinic/profile-image/
    Accepts multipart/form-data or JSON with base64 data_uri.
    """
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        return [AllowAny()]

    def post(self, request):
        if request.user.is_authenticated and getattr(request.user, 'role', '') == 'PATIENT':
            return Response(
                {'error': 'Patients are not permitted to change clinic profile picture.'},
                status=status.HTTP_403_FORBIDDEN
            )

        image_file = request.FILES.get('profile_image')
        raw_image_data = (
            request.data.get('profile_image_data')
            or request.data.get('profile_image')
            or request.data.get('profileImageUrl')
            or request.data.get('profile_image_url')
        )

        data_uri = None

        if image_file:
            max_size = 5 * 1024 * 1024  # 5 MB
            if image_file.size > max_size:
                return Response(
                    {'error': 'Image file is too large. Maximum allowed size is 5 MB.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            content_type = getattr(image_file, 'content_type', '') or 'image/jpeg'
            file_bytes = image_file.read()

            try:
                img = Image.open(io.BytesIO(file_bytes))
                if img.mode in ('RGBA', 'LA') and content_type.lower() in ['image/jpeg', 'image/jpg']:
                    bg = Image.new('RGB', img.size, (255, 255, 255))
                    bg.paste(img, mask=img.split()[-1])
                    img = bg
                elif img.mode != 'RGB' and content_type.lower() in ['image/jpeg', 'image/jpg']:
                    img = img.convert('RGB')

                # Resize avatar for optimal performance
                img.thumbnail((600, 600), Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=88, optimize=True)
                compressed_bytes = buffer.getvalue()
                mime = 'image/jpeg'
            except Exception:
                compressed_bytes = file_bytes
                mime = content_type or 'image/jpeg'

            b64 = base64.b64encode(compressed_bytes).decode('utf-8')
            data_uri = f"data:{mime};base64,{b64}"

            # Also save file to MEDIA_ROOT/profiles if directory is writable
            try:
                filename = f"clinic_profile_{uuid.uuid4().hex[:8]}.jpg"
                profiles_dir = os.path.join(settings.MEDIA_ROOT, 'profiles')
                os.makedirs(profiles_dir, exist_ok=True)
                file_dest = os.path.join(profiles_dir, filename)
                with open(file_dest, 'wb') as f:
                    f.write(compressed_bytes)
            except Exception:
                pass

        elif raw_image_data and isinstance(raw_image_data, str) and (raw_image_data.startswith('data:image/') or raw_image_data.startswith('http')):
            data_uri = raw_image_data
        else:
            return Response(
                {'error': 'No image file or image data provided. Please upload a valid image file.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update clinic_settings.json with the resilient data_uri
        settings_data = load_clinic_settings()
        settings_data['profile_image_url'] = data_uri
        settings_data['profileImageUrl'] = data_uri
        save_clinic_settings(settings_data)

        # Update admin user's profile image in persistent database
        admins = User.objects.filter(role='ADMIN')
        if not admins.exists():
            admins = User.objects.filter(is_superuser=True)
        for u in admins:
            try:
                u.profile_image = data_uri
                u.save(update_fields=['profile_image'])
            except Exception:
                pass

        return Response({
            'message': 'Clinic profile picture updated successfully.',
            'profile_image_url': data_uri,
            'profileImageUrl': data_uri,
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        if request.user.is_authenticated and getattr(request.user, 'role', '') == 'PATIENT':
            return Response(
                {'error': 'Patients are not permitted to change clinic settings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        admins = User.objects.filter(role='ADMIN')
        if not admins.exists():
            admins = User.objects.filter(is_superuser=True)
        for u in admins:
            try:
                u.profile_image = None
                u.save(update_fields=['profile_image'])
            except Exception:
                pass

        settings_data = load_clinic_settings()
        settings_data['profile_image_url'] = None
        settings_data['profileImageUrl'] = None
        save_clinic_settings(settings_data)

        return Response({
            'message': 'Clinic profile picture removed successfully.',
            'profile_image_url': None,
            'profileImageUrl': None,
        }, status=status.HTTP_200_OK)


class SendPrescriptionWhatsAppView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, rx_id=None):
        payload = request.data or {}

        # 1. Resolve Prescription by rx_id or request payload
        target_id = rx_id or payload.get('prescription_id') or payload.get('id') or payload.get('rxId')
        rx = None
        if target_id:
            cleaned_target = str(target_id).strip()
            lookup_q = models.Q(prescription_id__iexact=cleaned_target)
            if cleaned_target.isdigit():
                lookup_q |= models.Q(id=int(cleaned_target))
            rx = Prescription.objects.filter(lookup_q).first()

        # 2. Extract prescription data
        if rx:
            rx_data = {
                'rxId': rx.prescription_id,
                'patientName': rx.patient_name,
                'patientId': rx.patient_id_ref,
                'mobile': payload.get('phone') or payload.get('mobile') or rx.patient_phone or getattr(rx.patient_record, 'phone', ''),
                'ageGender': rx.age_gender,
                'date': rx.date,
                'diagnosis': rx.diagnosis or rx.complaint,
                'symptoms': rx.symptoms,
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions,
            }
        else:
            rx_data = {
                'rxId': payload.get('rxId') or payload.get('prescription_id') or 'RX-2026',
                'patientName': payload.get('patientName') or payload.get('name') or 'Patient',
                'patientId': payload.get('patientId') or payload.get('patient_id_ref') or '',
                'mobile': payload.get('phone') or payload.get('mobile') or payload.get('contact'),
                'ageGender': payload.get('ageGender') or 'Adult',
                'date': payload.get('date') or datetime.now().strftime('%d %b %Y'),
                'diagnosis': payload.get('diagnosis') or 'Clinical Consultation',
                'symptoms': payload.get('symptoms') or '',
                'medicines': payload.get('medicines') or [],
                'additionalInstructions': payload.get('additionalInstructions') or payload.get('additional_instructions') or '',
            }

        recipient_phone = rx_data.get('mobile')
        if not recipient_phone:
            return Response({
                'success': False,
                'error': 'Patient mobile number is required to send prescription via WhatsApp.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # 3. Obtain PDF bytes: either from client base64 or generated via ReportLab
        pdf_base64 = payload.get('pdf_base64')
        if pdf_base64:
            try:
                if ',' in str(pdf_base64):
                    pdf_base64 = str(pdf_base64).split(',', 1)[1]
                pdf_bytes = base64.b64decode(pdf_base64)
            except Exception as e:
                logger.warning(f"Could not decode client base64 PDF, falling back to ReportLab: {e}")
                pdf_bytes = generate_prescription_pdf_bytes(rx_data)
        else:
            pdf_bytes = generate_prescription_pdf_bytes(rx_data)

        # 4. Dispatch via Meta WhatsApp Cloud API
        success, result = whatsapp_service.send_prescription_pdf(
            recipient_phone=recipient_phone,
            pdf_bytes=pdf_bytes,
            patient_name=rx_data.get('patientName', 'Patient'),
            rx_id=rx_data.get('rxId', 'RX-2026')
        )

        if success:
            if not rx and rx_data.get('patientName'):
                rx = Prescription.objects.filter(
                    patient_name__iexact=rx_data.get('patientName')
                ).order_by('-created_at').first()

            if rx:
                rx.status = 'Delivered'
                rx.save(update_fields=['status'])

            return Response({
                'success': True,
                'status': 'Delivered',
                'rxId': rx.prescription_id if rx else rx_data.get('rxId'),
                'message': f"Prescription PDF successfully sent via WhatsApp to {rx_data.get('patientName')} (+{result.get('recipient')})!",
                'whatsapp_message_id': result.get('message_id'),
                'recipient': result.get('recipient'),
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Failed to send WhatsApp message.'),
                'meta_details': result
            }, status=status.HTTP_400_BAD_REQUEST)


class SendAppointmentWhatsAppView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, appointment_id=None):
        payload = request.data or {}
        target_id = appointment_id or payload.get('appointment_id') or payload.get('id')
        apt = None
        if target_id:
            cleaned_target = str(target_id).strip()
            lookup_q = models.Q(appointment_id__iexact=cleaned_target)
            if cleaned_target.isdigit():
                lookup_q |= models.Q(id=int(cleaned_target))
            apt = Appointment.objects.filter(lookup_q).first()

        if not apt:
            return Response({
                'success': False,
                'error': f'Appointment not found: {target_id}'
            }, status=status.HTTP_404_NOT_FOUND)

        if payload.get('phone') or payload.get('mobile'):
            apt.patient_phone = payload.get('phone') or payload.get('mobile')

        success, result = whatsapp_service.send_appointment_confirmation(apt)
        if success:
            return Response({
                'success': True,
                'message': f"Appointment confirmation PDF successfully sent via WhatsApp to {apt.patient_name} (+{result.get('recipient')})!",
                'whatsapp_message_id': result.get('message_id'),
                'recipient': result.get('recipient'),
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'success': False,
                'error': result.get('error', 'Failed to send WhatsApp appointment confirmation.'),
                'meta_details': result
            }, status=status.HTTP_400_BAD_REQUEST)


class PrescriptionPdfDownloadView(APIView):
    """
    Publicly serves / streams official prescription PDF with clinic letterhead.
    Accessible directly via WhatsApp link.
    """
    permission_classes = [AllowAny]

    def get(self, request, rx_id):
        cleaned_id = str(rx_id).strip()
        lookup_q = models.Q(prescription_id__iexact=cleaned_id)
        if cleaned_id.isdigit():
            lookup_q |= models.Q(id=int(cleaned_id))
        rx = Prescription.objects.filter(lookup_q).first()

        if not rx:
            return Response({'error': f'Prescription {rx_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        apt_num = ''
        if rx.appointment and rx.appointment.appointment_id:
            apt_num = rx.appointment.appointment_id
        elif rx.patient_record:
            linked_apt = rx.patient_record.appointments.exclude(status='Cancelled').order_by('-created_at').first()
            if linked_apt and linked_apt.appointment_id:
                apt_num = linked_apt.appointment_id
        if not apt_num and rx.patient_name:
            linked_apt = Appointment.objects.filter(patient_name__iexact=rx.patient_name).exclude(status='Cancelled').order_by('-created_at').first()
            if linked_apt and linked_apt.appointment_id:
                apt_num = linked_apt.appointment_id

        rx_data = {
            'rxId': rx.prescription_id,
            'patientName': rx.patient_name,
            'patientId': rx.patient_id_ref,
            'aptNumber': apt_num,
            'appointment_id': apt_num,
            'mobile': rx.patient_phone or getattr(rx.patient_record, 'phone', ''),
            'ageGender': rx.age_gender,
            'date': rx.date,
            'diagnosis': rx.diagnosis or rx.complaint,
            'symptoms': rx.symptoms,
            'medicines': rx.medicines or [],
            'additionalInstructions': rx.additional_instructions,
        }

        try:
            pdf_bytes = generate_prescription_pdf_bytes(rx_data)
            from django.http import HttpResponse
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            safe_name = (rx.patient_name or 'Patient').replace(' ', '_')
            filename = f"Prescription_{safe_name}_{rx.prescription_id}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except Exception as e:
            logger.error(f"Failed to generate prescription PDF for {rx_id}: {e}")
            return Response({'error': 'Failed to generate PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AppointmentPdfDownloadView(APIView):
    """
    Publicly serves / streams official appointment & prescription PDF with clinic letterhead.
    Supports viewing (inline) and downloading for any appointment.
    """
    permission_classes = [AllowAny]

    def get(self, request, appointment_id):
        cleaned_id = str(appointment_id).strip()
        lookup_q = models.Q(appointment_id__iexact=cleaned_id)
        if cleaned_id.isdigit():
            lookup_q |= models.Q(id=int(cleaned_id))
        apt = Appointment.objects.filter(lookup_q).first()

        if not apt:
            return Response({'error': f'Appointment {appointment_id} not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Check if appointment has an associated prescription
        rx = apt.prescriptions.first()
        if not rx and apt.patient_record:
            rx = Prescription.objects.filter(patient_record=apt.patient_record, date=apt.appointment_date).first()

        if rx:
            rx_data = {
                'rxId': rx.prescription_id,
                'patientName': rx.patient_name or apt.patient_name,
                'patientId': rx.patient_id_ref or (apt.patient_record.patient_id if apt.patient_record else ''),
                'mobile': rx.patient_phone or apt.patient_phone or '',
                'ageGender': rx.age_gender or (f"{apt.patient_gender}" if apt.patient_gender else 'Adult'),
                'date': rx.date or apt.appointment_date,
                'consultationType': apt.consultation_type or 'In-clinic Visit',
                'diagnosis': rx.diagnosis or rx.complaint or apt.reason_for_visit or 'Clinical Consultation',
                'symptoms': rx.symptoms or '',
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions or f"Appointment ID: {apt.appointment_id} • Time: {apt.time_slot}",
            }
        else:
            p_id = apt.patient_record.patient_id if apt.patient_record else ''
            rx_data = {
                'rxId': apt.appointment_id,
                'patientName': apt.patient_name or 'Patient',
                'patientId': p_id,
                'mobile': apt.patient_phone or '',
                'ageGender': f"{apt.patient_gender}" if apt.patient_gender else 'Adult',
                'date': apt.appointment_date,
                'consultationType': apt.consultation_type or 'In-clinic Visit',
                'diagnosis': apt.reason_for_visit or 'Clinical Consultation',
                'symptoms': f"Status: {apt.status}",
                'medicines': [
                    {
                        'name': 'Clinical Consultation Record',
                        'potency': 'Standard',
                        'dosage': 'Visit Completed',
                        'duration': apt.appointment_date,
                        'instructions': f"Slot: {apt.time_slot}",
                    }
                ] if apt.status == 'Complete' else [],
                'additionalInstructions': f"Appointment ID: {apt.appointment_id}\nScheduled Time: {apt.time_slot}\nStatus: {apt.status}\nConsultation Type: {apt.consultation_type}",
            }

        try:
            if rx:
                pdf_bytes = generate_prescription_pdf_bytes(rx_data)
            else:
                from .services.appointment_pdf import generate_appointment_confirmation_pdf_bytes
                apt_data = {
                    'appointment_id': apt.appointment_id,
                    'patient_name': apt.patient_name or 'Patient',
                    'patient_phone': apt.patient_phone or '',
                    'patient_email': apt.patient_email or '',
                    'doctor_name': 'Dr. Kumar Tripathi Ampeh (Pat.)',
                    'service': apt.reason_for_visit or '',
                    'appointment_date': apt.appointment_date,
                    'time_slot': apt.time_slot,
                    'clinic_address': getattr(apt, 'clinic_address', '') or '12, Green Park, MG Road, Bangalore, Karnataka - 560001'
                }
                pdf_bytes = generate_appointment_confirmation_pdf_bytes(apt_data)

            from django.http import HttpResponse
            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            safe_name = (apt.patient_name or 'Patient').replace(' ', '_')
            filename = f"Appointment_{apt.appointment_id}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            return response
        except Exception as e:
            logger.error(f"Failed to generate appointment PDF for {appointment_id}: {e}")
            return Response({'error': 'Failed to generate PDF.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

