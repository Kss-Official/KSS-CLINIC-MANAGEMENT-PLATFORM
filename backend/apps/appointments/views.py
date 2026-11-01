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


class AppointmentListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        appointments = Appointment.objects.all().order_by('-created_at')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            appointment = serializer.save()

            # Find or create corresponding permanent Patient record in Neon
            p_name = appointment.patient_name.strip()
            p_phone = (appointment.patient_phone or '').strip()
            patient = Patient.objects.filter(
                models.Q(name__iexact=p_name) | (models.Q(phone=p_phone) if p_phone else models.Q(name__iexact=p_name))
            ).first()

            if not patient:
                clean_name = p_name.lower().replace(' ', '.')
                patient = Patient.objects.create(
                    name=p_name,
                    phone=p_phone,
                    email=appointment.patient_email or f"{clean_name}@gmail.com",
                    primary_concern=appointment.reason_for_visit or 'General Consultation',
                    known_allergies=appointment.reason_for_visit or 'None',
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
        patients = Patient.objects.all().prefetch_related('appointments', 'prescriptions').order_by('id')
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
                'date': r.date,
                'time': r.time,
                'diagnosis': r.diagnosis,
                'complaint': r.complaint,
                'status': r.status,
                'medicines': r.medicines or [],
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
            status=payload.get('status') or 'Delivered',
        )

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
            'message': f"Prescription {rx.prescription_id} saved successfully for {rx.patient_name}!"
        }, status=status.HTTP_201_CREATED)


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
