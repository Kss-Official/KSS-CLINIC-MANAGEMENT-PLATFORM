from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, ProfileImageUploadView

router = DefaultRouter()
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('me/profile-image/', ProfileImageUploadView.as_view(), name='profile-image-upload'),
    path('', include(router.urls)),
]
