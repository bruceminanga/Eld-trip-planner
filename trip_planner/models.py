# trip_planner/models.py
from django.db import models


class Trip(models.Model):
    current_location = models.CharField(max_length=255)
    pickup_location = models.CharField(max_length=255)
    dropoff_location = models.CharField(max_length=255)
    current_cycle_used = models.FloatField(help_text="Current cycle used in hours")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Trip from {self.current_location} to {self.dropoff_location}"


class RouteSegment(models.Model):
    trip = models.ForeignKey(Trip, related_name="segments", on_delete=models.CASCADE)
    start_location = models.CharField(max_length=255)
    end_location = models.CharField(max_length=255)
    distance_miles = models.FloatField()
    estimated_duration_hours = models.FloatField()
    segment_type = models.CharField(
        max_length=50,
        choices=[
            ("DRIVE", "Driving"),
            ("REST", "Rest Period"),
            ("FUEL", "Fueling Stop"),
            ("PICKUP", "Pickup"),
            ("DROPOFF", "Dropoff"),
        ],
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def __str__(self):
        return f"{self.segment_type}: {self.start_location} to {self.end_location}"


class ELDLog(models.Model):
    trip = models.ForeignKey(Trip, related_name="eld_logs", on_delete=models.CASCADE)
    date = models.DateField()
    log_data = models.JSONField(
        help_text="JSON representation of the ELD log for this day"
    )

    def __str__(self):
        return f"ELD Log for {self.date}"
