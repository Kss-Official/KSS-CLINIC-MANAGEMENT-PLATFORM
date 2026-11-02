import os
import json
from django.conf import settings
from django.db import models
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import Appointment, Notification, Prescription, Patient
from .serializers import AppointmentSerializer, NotificationSerializer, ClinicSettingsSerializer
from datetime import datetime


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


def normalize_time_str(time_str):
    if not time_str:
        return ''
    t = str(time_str).strip().upper()
    for fmt in ['%I:%M %p', '%H:%M', '%I:%M%p', '%I:%M %P']:
        try:
            return datetime.strptime(t, fmt).strftime('%I:%M %p')
        except (ValueError, TypeError):
            continue
    return t


class AppointmentSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        date_param = request.query_params.get('date') or request.query_params.get('appointment_date')
        active_appointments = Appointment.objects.exclude(status__iexact='Cancelled')
        all_booked = {}

        for apt in active_appointments:
            d_norm = normalize_date_str(apt.appointment_date)
            t_norm = normalize_time_str(apt.time_slot)
            if not d_norm or not t_norm:
                continue

            if d_norm not in all_booked:
                all_booked[d_norm] = set()
            all_booked[d_norm].add(t_norm)

            raw_d = (apt.appointment_date or '').strip()
            if raw_d:
                if raw_d not in all_booked:
                    all_booked[raw_d] = set()
                all_booked[raw_d].add(t_norm)

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

        return Response({
            'date': date_param,
            'normalized_date': target_norm,
            'booked_slots': booked_slots,
            'all_booked_slots': all_booked_serialized,
        })


class AppointmentListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile')
        email = request.query_params.get('email')
        patient_id = request.query_params.get('patient_id') or request.query_params.get('patientId')

        if request.user.is_authenticated:
            if getattr(request.user, 'role', None) == 'PATIENT':
                q = models.Q(user=request.user) | models.Q(patient_record__user=request.user)
                if request.user.email:
                    q |= models.Q(patient_email__iexact=request.user.email)
                if getattr(request.user, 'phone_number', None):
                    clean_u = ''.join(c for c in request.user.phone_number if c.isdigit())
                    if clean_u:
                        q |= models.Q(patient_phone__endswith=clean_u[-10:])
                appointments = Appointment.objects.filter(q).order_by('-created_at')
            else:
                appointments = Appointment.objects.all().order_by('-created_at')
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
                appointments = Appointment.objects.filter(q).order_by('-created_at')
            else:
                appointments = Appointment.objects.all().order_by('-created_at')

        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            req_date = serializer.validated_data.get('appointment_date')
            req_slot = serializer.validated_data.get('time_slot')

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
            if not patient and p_phone_digits:
                patient = Patient.objects.filter(phone__endswith=p_phone_digits[-10:]).first()
            if not patient and p_email:
                patient = Patient.objects.filter(email__iexact=p_email).first()
            if not patient and p_name:
                patient = Patient.objects.filter(name__iexact=p_name).first()

            if patient:
                if not patient.user and user:
                    patient.user = user
                if not patient.phone and p_phone:
                    patient.phone = p_phone
                if not patient.email and p_email:
                    patient.email = p_email
                patient.save()
            else:
                clean_name = p_name.lower().replace(' ', '.')
                patient = Patient.objects.create(
                    user=user,
                    name=p_name,
                    phone=p_phone,
                    email=p_email or f"{clean_name}@gmail.com",
                    primary_concern=appointment.reason_for_visit or 'General Consultation',
                    known_allergies='None',
                    status='Active'
                )

            appointment.patient_record = patient
            appointment.save(update_fields=['patient_record'])

            # Automatically create notification for the Admin Portal
            notification = Notification.objects.create(
                appointment=appointment,
                title='New Appointment Booked',
                patient_name=appointment.patient_name,
                appointment_date=appointment.appointment_date,
                booking_time=appointment.time_slot,
                message=f"New appointment booked by {appointment.patient_name} for {appointment.appointment_date} at {appointment.time_slot}.",
                is_read=False
            )

            return Response({
                'appointment': AppointmentSerializer(appointment).data,
                'notification': NotificationSerializer(notification).data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AppointmentDetailView(APIView):
    permission_classes = [AllowAny]

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

        new_status = request.data.get('status')
        if new_status:
            apt.status = new_status
            apt.save(update_fields=['status', 'updated_at'])
            return Response(AppointmentSerializer(apt).data)
        return Response({'error': 'status field required'}, status=status.HTTP_400_BAD_REQUEST)


class NotificationListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        notifications = Notification.objects.all().order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        unread_count = Notification.objects.filter(is_read=False).count()
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count
        })


class NotificationMarkReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk)
            notification.is_read = True
            notification.save()
            return Response({'status': 'success', 'notification': NotificationSerializer(notification).data})
        except Notification.DoesNotExist:
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)


class NotificationMarkAllReadView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': 'success', 'unread_count': 0})


class PatientHistoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Auto-link any unlinked appointments
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
                patient = Patient.objects.create(
                    user=unlinked_apt.user,
                    name=p_name,
                    phone=p_phone,
                    email=unlinked_apt.patient_email or f"{p_name.lower().replace(' ', '.')}@gmail.com",
                    primary_concern=unlinked_apt.reason_for_visit or 'General Consultation',
                    status='Active'
                )
            if patient:
                unlinked_apt.patient_record = patient
                unlinked_apt.save(update_fields=['patient_record'])

        # Auto-link any unlinked prescriptions
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

        patients = Patient.objects.all().prefetch_related('appointments', 'prescriptions').order_by('-created_at', '-id')
        data = []

        for p in patients:
            parts = p.name.strip().split()
            initials = "".join([part[0].upper() for part in parts[:2]]) if parts else "PT"

            p_apts = p.appointments.all().order_by('-created_at')
            apts_data = [{
                'id': apt.appointment_id,
                'date': apt.appointment_date,
                'time': apt.time_slot,
                'reason': apt.reason_for_visit,
                'status': apt.status,
                'consultationType': apt.consultation_type,
            } for apt in p_apts]

            p_rxs = p.prescriptions.all().order_by('-created_at')
            rxs_data = [{
                'id': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientId': p.patient_id,
                'patient_id_ref': p.patient_id,
                'mobile': rx.patient_phone or p.phone,
                'ageGender': rx.age_gender or p.age_gender,
                'date': rx.date,
                'time': rx.time,
                'complaint': rx.complaint,
                'symptoms': rx.symptoms,
                'diagnosis': rx.diagnosis,
                'medicines': rx.medicines or [],
                'additionalInstructions': rx.additional_instructions,
                'status': rx.status,
            } for rx in p_rxs]

            last_visit = p_apts[0].appointment_date if p_apts.exists() else (p_rxs[0].date if p_rxs.exists() else 'N/A')
            total_visits = p_apts.count()

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
    permission_classes = [AllowAny]

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
                'date': a.appointment_date,
                'time': a.time_slot,
                'reason': a.reason_for_visit,
                'status': a.status,
                'consultationType': a.consultation_type,
            } for a in p_apts],
            'prescriptions': [{
                'id': r.prescription_id,
                'rxId': r.prescription_id,
                'date': r.date,
                'time': r.time,
                'diagnosis': r.diagnosis,
                'complaint': r.complaint,
                'symptoms': r.symptoms,
                'status': r.status,
                'medicines': r.medicines or [],
                'additionalInstructions': r.additional_instructions,
                'patientId': patient.patient_id,
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
    permission_classes = [AllowAny]

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile')
        email = request.query_params.get('email')
        patient_id = request.query_params.get('patient_id') or request.query_params.get('patientId')

        if request.user.is_authenticated and getattr(request.user, 'role', None) == 'PATIENT':
            q = models.Q(patient_record__user=request.user)
            if request.user.email:
                q |= models.Q(patient_record__email__iexact=request.user.email)
            if getattr(request.user, 'phone_number', None):
                clean_u = ''.join(c for c in request.user.phone_number if c.isdigit())
                if clean_u:
                    q |= models.Q(patient_phone__endswith=clean_u[-10:])
            prescriptions = Prescription.objects.filter(q).order_by('-created_at')
        elif not request.user.is_authenticated and (phone or email or patient_id):
            q = models.Q()
            if phone:
                clean_p = ''.join(c for c in phone if c.isdigit())
                if clean_p:
                    q |= models.Q(patient_phone__endswith=clean_p[-10:])
            if email:
                q |= models.Q(patient_record__email__iexact=email)
            if patient_id:
                q |= models.Q(patient_id_ref__iexact=patient_id) | models.Q(patient_record__patient_id__iexact=patient_id)
            prescriptions = Prescription.objects.filter(q).order_by('-created_at')
        else:
            prescriptions = Prescription.objects.all().order_by('-created_at')

        data = []
        for rx in prescriptions:
            pid = rx.patient_id_ref or (rx.patient_record.patient_id if rx.patient_record else 'PAT-1001')
            data.append({
                'id': rx.prescription_id,
                'rxId': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientName': rx.patient_name,
                'patientId': pid,
                'patient_id_ref': pid,
                'mobile': rx.patient_phone,
                'contact': rx.patient_phone,
                'ageGender': rx.age_gender,
                'date': rx.date,
                'time': rx.time,
                'complaint': rx.complaint,
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

        matched_apt = Appointment.objects.filter(
            models.Q(patient_name__iexact=patient_name) |
            (models.Q(patient_phone__iexact=patient_phone) if patient_phone else models.Q(patient_name__iexact=patient_name))
        ).order_by('-created_at').first()

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
                primary_concern=payload.get('complaint') or payload.get('mainComplaint') or 'Consultation',
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

        rx = Prescription.objects.create(
            patient_record=patient,
            appointment=matched_apt,
            patient_name=patient_name,
            patient_phone=patient_phone,
            patient_id_ref=patient.patient_id,
            age_gender=age_gender,
            date=formatted_date,
            time=time_str,
            complaint=payload.get('complaint') or payload.get('mainComplaint') or 'Consultation',
            symptoms=payload.get('symptoms') or '',
            diagnosis=payload.get('diagnosis') or 'Clinical Consultation',
            medicines=payload.get('medicines') or [],
            additional_instructions=payload.get('additionalInstructions') or payload.get('additional_instructions') or '',
            status=payload.get('status') or 'Pending',
        )

        # Automatically update corresponding appointment's status and prescription status from Confirmed to Complete
        if matched_apt and matched_apt.status != 'Cancelled':
            matched_apt.prescription_status = 'Complete'
            matched_apt.status = 'Complete'
            matched_apt.save(update_fields=['prescription_status', 'status'])
        
        # Also ensure all active/confirmed appointments for this patient are marked Complete
        patient_apts = Appointment.objects.filter(
            models.Q(patient_name__iexact=patient_name) |
            (models.Q(patient_phone__iexact=patient_phone) if patient_phone else models.Q(patient_name__iexact=patient_name)) |
            (models.Q(patient_record=patient) if patient else models.Q(patient_name__iexact=patient_name))
        )
        patient_apts.exclude(status='Cancelled').update(prescription_status='Complete', status='Complete')

        return Response({
            'id': rx.prescription_id,
            'rxId': rx.prescription_id,
            'database_id': rx.id,
            'name': rx.patient_name,
            'patientName': rx.patient_name,
            'patientId': rx.patient_id_ref,
            'patient_id_ref': rx.patient_id_ref,
            'mobile': rx.patient_phone,
            'ageGender': rx.age_gender,
            'date': rx.date,
            'time': rx.time,
            'complaint': rx.complaint,
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

        new_status = request.data.get('status')
        if new_status:
            rx.status = new_status
            rx.save(update_fields=['status'])
            return Response({
                'id': rx.prescription_id,
                'status': rx.status,
                'message': f'Prescription {rx.prescription_id} status updated to {rx.status}'
            })
        return Response({'error': 'status field required'}, status=status.HTTP_400_BAD_REQUEST)


class PrescriptionDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                rx = Prescription.objects.get(pk=int(pk_or_id))
            else:
                rx = Prescription.objects.get(prescription_id=pk_or_id)
            pid = rx.patient_id_ref or (rx.patient_record.patient_id if rx.patient_record else 'PAT-1001')
            return Response({
                'id': rx.prescription_id,
                'rxId': rx.prescription_id,
                'database_id': rx.id,
                'name': rx.patient_name,
                'patientName': rx.patient_name,
                'patientId': pid,
                'status': rx.status,
                'date': rx.date,
                'diagnosis': rx.diagnosis,
            })
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk_or_id):
        try:
            if str(pk_or_id).isdigit():
                rx = Prescription.objects.get(pk=int(pk_or_id))
            else:
                rx = Prescription.objects.get(prescription_id=pk_or_id)
        except Prescription.DoesNotExist:
            return Response({'error': 'Prescription not found'}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status:
            rx.status = new_status
            rx.save(update_fields=['status'])
            return Response({
                'id': rx.prescription_id,
                'status': rx.status,
                'message': f'Prescription {rx.prescription_id} status updated to {rx.status}'
            })
        return Response({'error': 'status field required'}, status=status.HTTP_400_BAD_REQUEST)


CLINIC_SETTINGS_FILE = os.path.join(settings.BASE_DIR, 'clinic_settings.json')

DEFAULT_CLINIC_SETTINGS = {
    'clinicName': 'HOMEOPATHY CLINIC',
    'doctorName': 'Dr. Kumar Tripathi Ampeh (Pat.)',
    'contactNumber': '+91 98765 43210',
    'alternateNumber': '+91 99887 66554',
    'email': 'clinic.tripathi@gmail.com',
    'address': '12, Green Park, MG Road, Bangalore, Karnataka - 560001'
}

def load_clinic_settings():
    if os.path.exists(CLINIC_SETTINGS_FILE):
        try:
            with open(CLINIC_SETTINGS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CLINIC_SETTINGS.copy()

def save_clinic_settings(data):
    with open(CLINIC_SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

class PatientMyProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        phone = request.query_params.get('phone') or request.query_params.get('mobile') or ''
        email = request.query_params.get('email') or ''
        patient_id = request.query_params.get('patient_id') or request.query_params.get('patientId') or ''
        name = (request.query_params.get('name') or '').strip()

        patient = None
        if request.user.is_authenticated:
            patient = Patient.objects.filter(user=request.user).first()
            if not patient and request.user.email:
                patient = Patient.objects.filter(email__iexact=request.user.email).first()
                if patient:
                    patient.user = request.user
                    patient.save(update_fields=['user'])

        if not patient and patient_id:
            patient = Patient.objects.filter(patient_id__iexact=patient_id).first()

        clean_p = ''.join(c for c in phone if c.isdigit())
        if not patient and clean_p:
            patient = Patient.objects.filter(phone__endswith=clean_p[-10:]).first()

        if not patient and email:
            patient = Patient.objects.filter(email__iexact=email).first()

        if not patient and name:
            patient = Patient.objects.filter(name__iexact=name).first()

        if not patient and (clean_p or email or name):
            apt_q = models.Q()
            if clean_p:
                apt_q |= models.Q(patient_phone__endswith=clean_p[-10:])
            if email:
                apt_q |= models.Q(patient_email__iexact=email)
            if name:
                apt_q |= models.Q(patient_name__iexact=name)
            apt = Appointment.objects.filter(apt_q).order_by('-created_at').first()
            if apt and apt.patient_record:
                patient = apt.patient_record
            elif apt:
                patient = Patient.objects.create(
                    name=apt.patient_name,
                    phone=apt.patient_phone,
                    email=apt.patient_email or f"{apt.patient_name.lower().replace(' ', '.')}@gmail.com",
                    primary_concern=apt.reason_for_visit or 'General Consultation',
                    status='Active'
                )
                apt.patient_record = patient
                apt.save(update_fields=['patient_record'])

        if not patient:
            if request.user.is_authenticated:
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
            else:
                patient = Patient.objects.first()

        if not patient:
            patient = Patient.objects.create(
                name='Rahul Sharma',
                email='rahul.sharma@gmail.com',
                phone='+91 98765 43210',
                status='Active',
                primary_concern='General Consultation',
                known_allergies='None'
            )

        p_q = models.Q(patient_record=patient)
        if patient.user:
            p_q |= models.Q(user=patient.user)
        if patient.phone:
            clean_digits = ''.join(c for c in patient.phone if c.isdigit())
            if clean_digits:
                p_q |= models.Q(patient_phone__endswith=clean_digits[-10:])
        if patient.email:
            p_q |= models.Q(patient_email__iexact=patient.email)

        p_apts = Appointment.objects.filter(p_q).order_by('-created_at')

        rx_q = models.Q(patient_record=patient) | models.Q(patient_id_ref=patient.patient_id)
        if patient.phone:
            clean_digits = ''.join(c for c in patient.phone if c.isdigit())
            if clean_digits:
                rx_q |= models.Q(patient_phone__endswith=clean_digits[-10:])
        if patient.name:
            rx_q |= models.Q(patient_name__iexact=patient.name)

        p_rxs = Prescription.objects.filter(rx_q).order_by('-created_at')

        parts = patient.name.strip().split()
        initials = "".join([part[0].upper() for part in parts[:2]]) if parts else "PT"

        return Response({
            'id': patient.patient_id,
            'database_id': patient.id,
            'name': patient.name,
            'initials': initials,
            'ageGender': patient.age_gender,
            'mobile': patient.phone or (getattr(request.user, 'phone_number', '') if request.user.is_authenticated else ''),
            'email': patient.email or (getattr(request.user, 'email', '') if request.user.is_authenticated else ''),
            'address': patient.address or (getattr(request.user, 'address', '') if request.user.is_authenticated else ''),
            'bloodGroup': patient.blood_group,
            'knownAllergies': patient.known_allergies,
            'primaryConcern': patient.primary_concern,
            'notes': patient.notes,
            'status': patient.status,
            'totalVisits': p_apts.count(),
            'lastVisit': p_apts[0].appointment_date if p_apts.exists() else 'N/A',
            'appointments': [{
                'id': a.appointment_id,
                'appointmentId': a.appointment_id,
                'date': a.appointment_date,
                'time': a.time_slot,
                'reason': a.reason_for_visit,
                'status': a.status,
                'consultationType': a.consultation_type,
            } for a in p_apts],
            'prescriptions': [{
                'id': r.prescription_id,
                'rxId': r.prescription_id,
                'prescription_id': r.prescription_id,
                'date': r.date,
                'time': r.time,
                'patientName': r.patient_name,
                'name': r.patient_name,
                'patientId': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else 'PAT-1001'),
                'patient_id_ref': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else 'PAT-1001'),
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
                    'id': r.patient_id_ref or (r.patient_record.patient_id if r.patient_record else 'PAT-1001'),
                    'ageGender': r.age_gender or (r.patient_record.age_gender if r.patient_record else ''),
                    'phone': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                    'contact': r.patient_phone or (r.patient_record.phone if r.patient_record else ''),
                }
            } for r in p_rxs],
        })

    def patch(self, request):
        patient = None
        if request.user.is_authenticated:
            patient = Patient.objects.filter(user=request.user).first()
        if not patient and request.data.get('patient_id'):
            patient = Patient.objects.filter(patient_id=request.data.get('patient_id')).first()
        if not patient and request.data.get('phone'):
            clean_p = ''.join(c for c in str(request.data.get('phone')) if c.isdigit())
            if clean_p:
                patient = Patient.objects.filter(phone__endswith=clean_p[-10:]).first()
        if not patient:
            patient = Patient.objects.first()

        if not patient:
            return Response({'error': 'Patient record not found.'}, status=status.HTTP_404_NOT_FOUND)

        for field in ['name', 'phone', 'email', 'address', 'age_gender', 'blood_group', 'known_allergies', 'primary_concern', 'notes']:
            if field in request.data:
                setattr(patient, field, request.data[field])

        patient.save()
        return Response({'status': 'success', 'patient_id': patient.patient_id})


class ClinicSettingsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(load_clinic_settings())

    def post(self, request):
        serializer = ClinicSettingsSerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            save_clinic_settings(validated_data)
            return Response(validated_data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.post(request)
