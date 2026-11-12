from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from apps.core.views import ContactFormView

def api_health_check(request):
    return JsonResponse({
        'status': 'online',
        'message': 'Clinic Management System API is running successfully on Vercel.',
        'endpoints': {
            'admin': '/admin/',
            'auth': '/api/auth/',
            'users': '/api/users/',
            'appointments': '/api/appointments/',
            'prescriptions': '/api/prescriptions/',
            'contact': '/api/contact/',
        }
    })

urlpatterns = [
    path('', api_health_check, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/', include('apps.appointments.urls')),
    path('api/contact/', ContactFormView.as_view(), name='contact-form'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
