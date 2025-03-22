# trip_planner/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Trip, RouteSegment, ELDLog
from .serializers import TripSerializer, TripCreateSerializer
from .route_planner import plan_route, generate_eld_logs


class TripViewSet(viewsets.ModelViewSet):
    queryset = Trip.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return TripCreateSerializer
        return TripSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        trip = serializer.save()

        # Process the trip to create route segments and ELD logs
        try:
            # Plan the route
            route_data = plan_route(
                trip.current_location,
                trip.pickup_location,
                trip.dropoff_location,
                trip.current_cycle_used,
            )

            # Create route segments
            for segment in route_data["segments"]:
                RouteSegment.objects.create(
                    trip=trip,
                    start_location=segment["start_location"],
                    end_location=segment["end_location"],
                    distance_miles=segment["distance_miles"],
                    estimated_duration_hours=segment["duration_hours"],
                    segment_type=segment["type"],
                    start_time=segment["start_time"],
                    end_time=segment["end_time"],
                )

            # Generate ELD logs
            eld_logs = generate_eld_logs(trip, route_data)
            for log_date, log_data in eld_logs.items():
                ELDLog.objects.create(trip=trip, date=log_date, log_data=log_data)

            return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Clean up if there's an error
            trip.delete()
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
