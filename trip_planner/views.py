# trip_planner/views.py
from rest_framework import viewsets, status
from rest_framework.response import Response
import traceback  # For logging errors
import datetime  # Import datetime for parsing check

from .models import Trip, RouteSegment, ELDLog
from .serializers import TripSerializer, TripCreateSerializer
from .route_planner import plan_route, generate_eld_logs


class TripViewSet(viewsets.ModelViewSet):
    # Optimize default queryset
    queryset = Trip.objects.all().prefetch_related("segments", "eld_logs")

    def get_serializer_class(self):
        if self.action == "create":
            return TripCreateSerializer
        # Use prefetch_related for list and retrieve for efficiency
        if self.action in ["list", "retrieve"]:
            self.queryset = Trip.objects.all().prefetch_related("segments", "eld_logs")
        return TripSerializer

    def create(self, request, *args, **kwargs):
        print(f"\n{'*'*10} Received Trip Creation Request {'*'*10}")
        print(f"Request Data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"ERROR: Input data validation failed: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        trip = None  # Initialize trip as None

        try:
            print("DEBUG: Starting route planning...")
            route_data = plan_route(
                validated_data["current_location"],
                validated_data["pickup_location"],
                validated_data["dropoff_location"],
                validated_data["current_cycle_used"],
            )
            print("DEBUG: Route planning function finished.")

            # If planning succeeds, save the Trip object
            # Use validated_data to create the instance before saving if needed
            trip = Trip.objects.create(**validated_data)
            # trip = serializer.save() # Alternatively use serializer.save() if no extra fields needed
            print(f"DEBUG: Trip object saved with ID: {trip.id}")

            # Create RouteSegments in bulk
            segments_to_create = []
            if "segments" in route_data and route_data["segments"]:
                print("DEBUG: Preparing segments for database save...")
                for i, segment_data in enumerate(route_data["segments"]):
                    start_coords = segment_data.get("start_coordinates")
                    end_coords = segment_data.get("end_coordinates")
                    segment_type = segment_data.get("type", "UNKNOWN")

                    print(
                        f"DEBUG: Processing Segment {i} (Type: {segment_type}) Raw Coords - Start: {start_coords}, End: {end_coords}"
                    )

                    # Basic validation for coordinates before saving
                    if not (isinstance(start_coords, list) and len(start_coords) == 2):
                        print(
                            f"  WARNING: Segment {i} - Invalid start_coords format, saving as None."
                        )
                        start_coords = None
                    if not (isinstance(end_coords, list) and len(end_coords) == 2):
                        print(
                            f"  WARNING: Segment {i} - Invalid end_coords format, saving as None."
                        )
                        end_coords = None

                    # Check if datetime objects are present (should be from route_planner)
                    start_time = segment_data.get("start_time")
                    end_time = segment_data.get("end_time")
                    if not isinstance(start_time, datetime.datetime) or not isinstance(
                        end_time, datetime.datetime
                    ):
                        print(
                            f"  CRITICAL WARNING: Segment {i} has invalid datetime objects! Start: {type(start_time)}, End: {type(end_time)}"
                        )
                        # Handle this error - maybe skip segment or raise exception
                        continue  # Skip this segment

                    print(
                        f"  DEBUG: Segment {i} Values for DB - StartCoords: {start_coords}, EndCoords: {end_coords}"
                    )

                    segments_to_create.append(
                        RouteSegment(
                            trip=trip,
                            start_location=segment_data.get(
                                "start_location", "Unknown"
                            ),
                            end_location=segment_data.get("end_location", "Unknown"),
                            start_coordinates=start_coords,  # Use validated/None coords
                            end_coordinates=end_coords,  # Use validated/None coords
                            distance_miles=segment_data.get("distance_miles", 0.0),
                            estimated_duration_hours=segment_data.get(
                                "duration_hours", 0.0
                            ),
                            segment_type=segment_type,
                            start_time=start_time,  # Pass datetime object
                            end_time=end_time,  # Pass datetime object
                        )
                    )
                if segments_to_create:
                    RouteSegment.objects.bulk_create(segments_to_create)
                    print(
                        f"DEBUG: Bulk created {len(segments_to_create)} route segments."
                    )
            else:
                print("WARNING: No segments were generated by plan_route to save.")

            # Generate and create ELD logs in bulk
            print("DEBUG: Generating ELD logs...")
            eld_logs_data = generate_eld_logs(
                trip, route_data
            )  # Pass the saved trip instance
            logs_to_create = []
            for log_date_str, log_data_dict in eld_logs_data.items():
                try:
                    log_date = datetime.datetime.strptime(
                        log_date_str, "%Y-%m-%d"
                    ).date()
                    logs_to_create.append(
                        ELDLog(trip=trip, date=log_date, log_data=log_data_dict)
                    )
                except ValueError:
                    print(f"ERROR: Could not parse date for ELD log: {log_date_str}")

            if logs_to_create:
                ELDLog.objects.bulk_create(logs_to_create)
                print(f"DEBUG: Bulk created {len(logs_to_create)} ELD logs.")
            else:
                print("DEBUG: No ELD logs generated.")

            # Retrieve the full trip data with related objects for the response
            final_trip = Trip.objects.prefetch_related("segments", "eld_logs").get(
                pk=trip.pk
            )
            final_serializer = TripSerializer(final_trip)
            print(f"{'*'*10} Trip Creation Process Complete (ID: {trip.id}) {'*'*10}\n")
            return Response(final_serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("\n--- ERROR DURING TRIP CREATION / PLANNING ---")
            traceback.print_exc()  # Print full stack trace to console
            # Clean up trip only if it was partially created before the error
            if trip and trip.pk:  # Check if trip has been saved (has primary key)
                print(
                    f"Attempting to clean up partially created Trip {trip.id} due to error."
                )
                try:
                    trip.delete()
                    print("Cleanup successful.")
                except Exception as delete_e:
                    print(f"Error during trip cleanup: {delete_e}")

            # Return a more informative error response
            error_message = f"Trip planning failed: {str(e)}"
            return Response(
                {"error": error_message}, status=status.HTTP_400_BAD_REQUEST
            )

    # Add this method if you want to view details of a specific trip later
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    # Add this method if you want to list all trips
    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
