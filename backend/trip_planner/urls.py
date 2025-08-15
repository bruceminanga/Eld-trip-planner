# trip_planner/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TripViewSet

router = DefaultRouter()
router.register("trips", TripViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
