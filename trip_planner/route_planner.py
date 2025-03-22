# trip_planner/route_planner.py
import datetime
import requests
import math
import pytz
from dateutil import parser
from decouple import config

# Constants for ELD regulations
MAX_DRIVING_HOURS_PER_DAY = 11
MAX_ON_DUTY_HOURS_PER_DAY = 14
REQUIRED_REST_HOURS = 10
MAX_CONSECUTIVE_DRIVING_HOURS = 8  # After 8 hours, need a 30-min break
HOURS_BEFORE_BREAK = 8
BREAK_DURATION_HOURS = 0.5
MAX_CYCLE_HOURS = 70  # 70 hours in 8 days
AVERAGE_SPEED_MPH = 55
FUEL_STOP_DURATION_HOURS = 0.75
PICKUP_DROPOFF_DURATION_HOURS = 1.0
MAX_MILES_BEFORE_FUEL = 1000

# Change this line
GEOAPIFY_API_KEY = config("GEOAPIFY_API_KEY")  # Extract just the key part


def geocode_location(location):
    """Convert a location name to lat/long coordinates using Geoapify Geocoding API"""
    import urllib.parse

    # URL encode the location
    encoded_location = urllib.parse.quote(location)
    url = f"https://api.geoapify.com/v1/geocode/search"

    params = {
        "text": location,
        "apiKey": GEOAPIFY_API_KEY,  # Your Geoapify API key
    }

    try:
        response = requests.get(url, params=params)

        # For debugging
        print(f"Geocoding URL: {url}")
        print(f"Params: {params}")
        print(f"Response status: {response.status_code}")

        data = response.json()

        if not data.get("features") or len(data.get("features", [])) == 0:
            raise ValueError(f"Could not geocode location: {location}")

        # Get the coordinates [longitude, latitude] from the first feature
        coordinates = data["features"][0]["geometry"]["coordinates"]

        # Get place name
        properties = data["features"][0]["properties"]
        place_name = properties.get("formatted", location)

        return {"coordinates": coordinates, "place_name": place_name}
    except Exception as e:
        print(f"Geocoding error: {str(e)}")
        raise ValueError(f"Could not geocode location: {location}")


def get_route_data(origin, destination):
    """Get route data between two points using Geoapify Routing API"""
    origin_coords = origin["coordinates"]
    dest_coords = destination["coordinates"]

    # Geoapify expects coordinates in this order: longitude,latitude
    url = f"https://api.geoapify.com/v1/routing"

    params = {
        "waypoints": f"{origin_coords[1]},{origin_coords[0]}|{dest_coords[1]},{dest_coords[0]}",
        "mode": "drive",
        "apiKey": GEOAPIFY_API_KEY,
    }

    try:
        response = requests.get(url, params=params)

        # For debugging
        print(f"Routing URL: {url}")
        print(f"Params: {params}")
        print(f"Response status: {response.status_code}")
        print(f"Response text preview: {response.text[:300]}...")

        data = response.json()

        if response.status_code != 200 or not data.get("features"):
            raise ValueError(
                f"Could not get route from {origin['place_name']} to {destination['place_name']}"
            )

        route = data["features"][0]

        # Extract distance and duration from properties
        distance_meters = route["properties"]["distance"]
        duration_seconds = route["properties"]["time"]

        # Convert to miles and hours
        distance_miles = distance_meters * 0.000621371  # meters to miles
        duration_hours = duration_seconds / 3600  # seconds to hours

        return {
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": route["geometry"],  # This will be a GeoJSON LineString
        }
    except Exception as e:
        print(f"Error getting route: {str(e)}")
        # Fallback: if API fails, estimate based on straight-line distance
        # This is just an approximation for when the API fails
        import math

        # Calculate Haversine distance (as the crow flies)
        lon1, lat1 = origin_coords
        lon2, lat2 = dest_coords

        # Convert to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

        # Haversine formula
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        r = 3956  # Radius of earth in miles

        # Calculate straight-line distance
        haversine_miles = c * r

        # Apply a factor to account for road distance being longer than straight line
        estimated_miles = haversine_miles * 1.3

        # Estimate duration based on average speed
        estimated_hours = estimated_miles / AVERAGE_SPEED_MPH

        # Create a simple LineString geometry
        simplified_geometry = {
            "type": "LineString",
            "coordinates": [origin_coords, dest_coords],
        }

        print(f"API failed. Using estimated distance: {estimated_miles} miles")

        return {
            "distance_miles": estimated_miles,
            "duration_hours": estimated_hours,
            "geometry": simplified_geometry,
        }


def plan_route(current_location, pickup_location, dropoff_location, current_cycle_used):
    """
    Plan a route based on location inputs and ELD regulations.
    Returns route segments and stops.
    """
    # Start with current timestamp
    current_time = datetime.datetime.now(pytz.utc)
    remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY
    remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY
    remaining_cycle = MAX_CYCLE_HOURS - current_cycle_used

    # Geocode all locations
    current_loc = geocode_location(current_location)
    pickup_loc = geocode_location(pickup_location)
    dropoff_loc = geocode_location(dropoff_location)

    # Get route data for both segments
    to_pickup_route = get_route_data(current_loc, pickup_loc)
    pickup_to_dropoff_route = get_route_data(pickup_loc, dropoff_loc)

    # Initialize results
    segments = []
    route_geometries = {"type": "FeatureCollection", "features": []}

    # Add route geometries
    route_geometries["features"].append(
        {
            "type": "Feature",
            "geometry": to_pickup_route["geometry"],
            "properties": {"segment": "to_pickup"},
        }
    )

    route_geometries["features"].append(
        {
            "type": "Feature",
            "geometry": pickup_to_dropoff_route["geometry"],
            "properties": {"segment": "pickup_to_dropoff"},
        }
    )

    # Calculate segments for drive to pickup
    current_pos = current_loc
    remaining_distance = to_pickup_route["distance_miles"]
    fuel_distance = 0  # Track distance since last fuel stop

    while remaining_distance > 0:
        # Check if we need to take a rest based on daily limits
        if (
            remaining_daily_driving <= 0
            or remaining_daily_duty <= 0
            or remaining_cycle <= 0
        ):
            # Need to take a rest
            rest_hours = REQUIRED_REST_HOURS
            rest_end_time = current_time + datetime.timedelta(hours=rest_hours)

            segments.append(
                {
                    "type": "REST",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": rest_hours,
                    "start_time": current_time,
                    "end_time": rest_end_time,
                }
            )

            current_time = rest_end_time
            remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY
            remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY
            continue

        # Check if we need a break after 8 hours of driving
        hours_to_drive = min(
            remaining_daily_driving, HOURS_BEFORE_BREAK, remaining_cycle
        )
        distance_can_cover = hours_to_drive * AVERAGE_SPEED_MPH

        # Check if we need to fuel
        if (
            fuel_distance + min(distance_can_cover, remaining_distance)
            > MAX_MILES_BEFORE_FUEL
        ):
            # Add a fuel stop
            fuel_end_time = current_time + datetime.timedelta(
                hours=FUEL_STOP_DURATION_HOURS
            )

            segments.append(
                {
                    "type": "FUEL",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": FUEL_STOP_DURATION_HOURS,
                    "start_time": current_time,
                    "end_time": fuel_end_time,
                }
            )

            current_time = fuel_end_time
            fuel_distance = 0
            remaining_daily_duty -= FUEL_STOP_DURATION_HOURS
            remaining_cycle -= FUEL_STOP_DURATION_HOURS
            continue

        # Calculate how much of the route we can cover
        actual_distance = min(distance_can_cover, remaining_distance)
        actual_hours = actual_distance / AVERAGE_SPEED_MPH

        # Calculate intermediate point (this is simplified)
        if actual_distance < remaining_distance:
            # We need to find an approximate point along the route
            # For simplicity, we'll just modify the place name
            intermediate_pos = {
                "place_name": f"Interstate point {actual_distance:.1f} miles from {current_pos['place_name']}",
                "coordinates": current_pos["coordinates"],  # Simplified
            }
        else:
            intermediate_pos = pickup_loc

        drive_end_time = current_time + datetime.timedelta(hours=actual_hours)

        segments.append(
            {
                "type": "DRIVE",
                "start_location": current_pos["place_name"],
                "end_location": intermediate_pos["place_name"],
                "distance_miles": actual_distance,
                "duration_hours": actual_hours,
                "start_time": current_time,
                "end_time": drive_end_time,
            }
        )

        current_time = drive_end_time
        current_pos = intermediate_pos
        remaining_distance -= actual_distance
        remaining_daily_driving -= actual_hours
        remaining_daily_duty -= actual_hours
        remaining_cycle -= actual_hours
        fuel_distance += actual_distance

        # Check if we need a break
        if remaining_daily_driving <= 0 or (
            MAX_DRIVING_HOURS_PER_DAY - remaining_daily_driving >= HOURS_BEFORE_BREAK
        ):
            # Take a 30-min break
            break_end_time = current_time + datetime.timedelta(
                hours=BREAK_DURATION_HOURS
            )

            segments.append(
                {
                    "type": "REST",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": BREAK_DURATION_HOURS,
                    "start_time": current_time,
                    "end_time": break_end_time,
                }
            )

            current_time = break_end_time
            remaining_daily_duty -= BREAK_DURATION_HOURS
            remaining_cycle -= BREAK_DURATION_HOURS

    # Add pickup stop
    pickup_end_time = current_time + datetime.timedelta(
        hours=PICKUP_DROPOFF_DURATION_HOURS
    )

    segments.append(
        {
            "type": "PICKUP",
            "start_location": pickup_loc["place_name"],
            "end_location": pickup_loc["place_name"],
            "distance_miles": 0,
            "duration_hours": PICKUP_DROPOFF_DURATION_HOURS,
            "start_time": current_time,
            "end_time": pickup_end_time,
        }
    )

    current_time = pickup_end_time
    current_pos = pickup_loc
    remaining_daily_duty -= PICKUP_DROPOFF_DURATION_HOURS
    remaining_cycle -= PICKUP_DROPOFF_DURATION_HOURS

    # Calculate segments for drive to dropoff (similar logic)
    remaining_distance = pickup_to_dropoff_route["distance_miles"]

    while remaining_distance > 0:
        # Logic similar to the drive to pickup
        if (
            remaining_daily_driving <= 0
            or remaining_daily_duty <= 0
            or remaining_cycle <= 0
        ):
            rest_hours = REQUIRED_REST_HOURS
            rest_end_time = current_time + datetime.timedelta(hours=rest_hours)

            segments.append(
                {
                    "type": "REST",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": rest_hours,
                    "start_time": current_time,
                    "end_time": rest_end_time,
                }
            )

            current_time = rest_end_time
            remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY
            remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY
            continue

        hours_to_drive = min(
            remaining_daily_driving, HOURS_BEFORE_BREAK, remaining_cycle
        )
        distance_can_cover = hours_to_drive * AVERAGE_SPEED_MPH

        if (
            fuel_distance + min(distance_can_cover, remaining_distance)
            > MAX_MILES_BEFORE_FUEL
        ):
            fuel_end_time = current_time + datetime.timedelta(
                hours=FUEL_STOP_DURATION_HOURS
            )

            segments.append(
                {
                    "type": "FUEL",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": FUEL_STOP_DURATION_HOURS,
                    "start_time": current_time,
                    "end_time": fuel_end_time,
                }
            )

            current_time = fuel_end_time
            fuel_distance = 0
            remaining_daily_duty -= FUEL_STOP_DURATION_HOURS
            remaining_cycle -= FUEL_STOP_DURATION_HOURS
            continue

        actual_distance = min(distance_can_cover, remaining_distance)
        actual_hours = actual_distance / AVERAGE_SPEED_MPH

        if actual_distance < remaining_distance:
            intermediate_pos = {
                "place_name": f"Interstate point {actual_distance:.1f} miles from {current_pos['place_name']}",
                "coordinates": current_pos["coordinates"],  # Simplified
            }
        else:
            intermediate_pos = dropoff_loc

        drive_end_time = current_time + datetime.timedelta(hours=actual_hours)

        segments.append(
            {
                "type": "DRIVE",
                "start_location": current_pos["place_name"],
                "end_location": intermediate_pos["place_name"],
                "distance_miles": actual_distance,
                "duration_hours": actual_hours,
                "start_time": current_time,
                "end_time": drive_end_time,
            }
        )

        current_time = drive_end_time
        current_pos = intermediate_pos
        remaining_distance -= actual_distance
        remaining_daily_driving -= actual_hours
        remaining_daily_duty -= actual_hours
        remaining_cycle -= actual_hours
        fuel_distance += actual_distance

        if remaining_daily_driving <= 0 or (
            MAX_DRIVING_HOURS_PER_DAY - remaining_daily_driving >= HOURS_BEFORE_BREAK
        ):
            break_end_time = current_time + datetime.timedelta(
                hours=BREAK_DURATION_HOURS
            )

            segments.append(
                {
                    "type": "REST",
                    "start_location": current_pos["place_name"],
                    "end_location": current_pos["place_name"],
                    "distance_miles": 0,
                    "duration_hours": BREAK_DURATION_HOURS,
                    "start_time": current_time,
                    "end_time": break_end_time,
                }
            )

            current_time = break_end_time
            remaining_daily_duty -= BREAK_DURATION_HOURS
            remaining_cycle -= BREAK_DURATION_HOURS

    # Add dropoff stop
    dropoff_end_time = current_time + datetime.timedelta(
        hours=PICKUP_DROPOFF_DURATION_HOURS
    )

    segments.append(
        {
            "type": "DROPOFF",
            "start_location": dropoff_loc["place_name"],
            "end_location": dropoff_loc["place_name"],
            "distance_miles": 0,
            "duration_hours": PICKUP_DROPOFF_DURATION_HOURS,
            "start_time": current_time,
            "end_time": dropoff_end_time,
        }
    )

    return {
        "segments": segments,
        "route_geometries": route_geometries,
        "total_distance": to_pickup_route["distance_miles"]
        + pickup_to_dropoff_route["distance_miles"],
        "total_duration": sum(segment["duration_hours"] for segment in segments),
    }


def generate_eld_logs(trip, route_data):
    """
    Generate ELD logs based on the route segments.
    Returns a dictionary mapping dates to ELD log data.
    """
    eld_logs = {}

    # Group segments by date
    for segment in route_data["segments"]:
        start_date = segment["start_time"].date()
        end_date = segment["end_time"].date()

        # Handle segments that span multiple days
        current_date = start_date
        while current_date <= end_date:
            if current_date not in eld_logs:
                eld_logs[current_date] = {
                    "date": current_date.isoformat(),
                    "status_timeline": [],
                }

            # Get segment hours for this date
            if current_date == start_date and current_date == end_date:
                # Segment starts and ends on the same day
                segment_start = segment["start_time"].time()
                segment_end = segment["end_time"].time()
            elif current_date == start_date:
                # Segment starts on this day but ends on another
                segment_start = segment["start_time"].time()
                segment_end = datetime.time(23, 59, 59)
            elif current_date == end_date:
                # Segment ends on this day but started on another
                segment_start = datetime.time(0, 0, 0)
                segment_end = segment["end_time"].time()
            else:
                # Segment spans the entire day
                segment_start = datetime.time(0, 0, 0)
                segment_end = datetime.time(23, 59, 59)

            # Map segment type to ELD status
            status_mapping = {
                "DRIVE": "D",  # Driving
                "REST": "SB",  # Sleeper Berth
                "FUEL": "ON",  # On Duty Not Driving
                "PICKUP": "ON",  # On Duty Not Driving
                "DROPOFF": "ON",  # On Duty Not Driving
            }

            eld_logs[current_date]["status_timeline"].append(
                {
                    "status": status_mapping[segment["type"]],
                    "start_time": segment_start.strftime("%H:%M"),
                    "end_time": segment_end.strftime("%H:%M"),
                    "location": segment["start_location"],
                }
            )

            current_date += datetime.timedelta(days=1)

    # For each day, fill in off-duty time for any gaps
    for date, log in eld_logs.items():
        timeline = log["status_timeline"]
        timeline.sort(key=lambda x: x["start_time"])

        # Fill in gaps with off-duty status
        filled_timeline = []
        current_time = datetime.time(0, 0)

        for entry in timeline:
            entry_start = datetime.datetime.strptime(
                entry["start_time"], "%H:%M"
            ).time()

            # If there's a gap, fill it with off-duty
            if entry_start > current_time:
                filled_timeline.append(
                    {
                        "status": "OFF",  # Off Duty
                        "start_time": current_time.strftime("%H:%M"),
                        "end_time": entry["start_time"],
                        "location": entry["location"],  # Use the same location
                    }
                )

            filled_timeline.append(entry)
            current_time = datetime.datetime.strptime(entry["end_time"], "%H:%M").time()

        # Fill the end of the day if needed
        day_end = datetime.time(23, 59)
        if current_time < day_end:
            filled_timeline.append(
                {
                    "status": "OFF",  # Off Duty
                    "start_time": current_time.strftime("%H:%M"),
                    "end_time": "23:59",
                    "location": timeline[-1]["location"] if timeline else "Unknown",
                }
            )

        log["status_timeline"] = filled_timeline

        # Calculate hours by duty status for the summary
        hours_summary = {"D": 0, "ON": 0, "OFF": 0, "SB": 0}

        for entry in filled_timeline:
            start_minutes = int(entry["start_time"].split(":")[0]) * 60 + int(
                entry["start_time"].split(":")[1]
            )
            end_minutes = int(entry["end_time"].split(":")[0]) * 60 + int(
                entry["end_time"].split(":")[1]
            )
            duration_hours = (end_minutes - start_minutes) / 60
            hours_summary[entry["status"]] += duration_hours

        log["hours_summary"] = hours_summary

    return eld_logs
