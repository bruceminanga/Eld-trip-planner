# trip_planner/serializers.py
from rest_framework import serializers
from .models import Trip, RouteSegment, ELDLog


class RouteSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteSegment
        fields = [
            "id",
            "start_location",
            "end_location",
            "distance_miles",
            "estimated_duration_hours",
            "segment_type",
            "start_time",
            "end_time",
        ]


class ELDLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ELDLog
        fields = ["id", "date", "log_data"]


class TripSerializer(serializers.ModelSerializer):
    segments = RouteSegmentSerializer(many=True, read_only=True)
    eld_logs = ELDLogSerializer(many=True, read_only=True)

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "created_at",
            "segments",
            "eld_logs",
        ]


class TripCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
        ]
