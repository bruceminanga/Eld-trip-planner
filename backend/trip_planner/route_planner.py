# trip_planner/route_planner.py
import datetime
import requests
import math
import pytz
import urllib.parse
import traceback # For better error logging
from decouple import config # Use python-decouple for API Key

# --- IMPORTANT: Set your API Key ---
# Option 1: Use python-decouple (install with 'pip install python-decouple')
# Create a .env file in your project root with: GEOAPIFY_API_KEY=YOUR_ACTUAL_KEY
# Then uncomment the next line:
GEOAPIFY_API_KEY = config("GEOAPIFY_API_KEY", default=None)

# Option 2: Direct assignment (less secure, replace with your key)
# GEOAPIFY_API_KEY = "YOUR_GEOAPIFY_API_KEY"

if not GEOAPIFY_API_KEY:
    print("\n" + "*"*50)
    print("CRITICAL WARNING: GEOAPIFY_API_KEY not found.")
    print("Geocoding and Routing WILL fail. Check .env file or environment variables.")
    print("*"*50 + "\n")
    # You might want to raise an error here depending on desired behaviour
    # raise ValueError("Geoapify API Key is missing!")


# Constants for ELD regulations (adjust as needed)
MAX_DRIVING_HOURS_PER_DAY = 11
MAX_ON_DUTY_HOURS_PER_DAY = 14
REQUIRED_REST_HOURS = 10
MAX_CONSECUTIVE_DRIVING_HOURS = 8  # Driver must take 30-min break by 8th hour
HOURS_BEFORE_BREAK = 8 # Simplified: break needed if drive exceeds this
BREAK_DURATION_HOURS = 0.5
MAX_CYCLE_HOURS = 70  # e.g., 70 hours in 8 days
AVERAGE_SPEED_MPH = 55 # Adjust this based on typical conditions
FUEL_STOP_DURATION_HOURS = 0.75
PICKUP_DROPOFF_DURATION_HOURS = 1.0
MAX_MILES_BEFORE_FUEL = 1000 # Adjust fuel range


def geocode_location(location):
    """Convert a location name to lat/long coordinates using Geoapify Geocoding API"""
    print(f"DEBUG: Attempting to geocode: '{location}'") # LOGGING
    if not GEOAPIFY_API_KEY:
        print("DEBUG: Geocoding failed - API Key missing.") # LOGGING
        raise ValueError("Geoapify API Key is missing for geocoding.")
    if not location:
        print("DEBUG: Geocoding failed - Empty location string.") # LOGGING
        raise ValueError("Location string cannot be empty for geocoding.")

    encoded_location = urllib.parse.quote(location)
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {"text": encoded_location, "apiKey": GEOAPIFY_API_KEY, "limit": 1}

    try:
        response = requests.get(url, params=params, timeout=10) # Added timeout
        print(f"DEBUG: Geocode API URL called: {response.url}") # LOGGING URL
        print(f"DEBUG: Geocode API Status Code: {response.status_code}") # LOGGING Status
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        if not data.get("features"):
            print(f"DEBUG: Geocoding failed - No features found for '{location}'. Response: {data}") # LOGGING
            raise ValueError(f"Could not geocode location: '{location}'. API found no matches.")

        feature = data["features"][0]
        coordinates = feature.get("geometry", {}).get("coordinates")
        if not coordinates or not isinstance(coordinates, list) or len(coordinates) != 2:
            print(f"DEBUG: Geocoding failed - Invalid coordinates in response for '{location}'. Geometry: {feature.get('geometry')}") # LOGGING
            raise ValueError(f"Invalid coordinate format received for '{location}'.")

        properties = feature.get("properties", {})
        place_name = properties.get("formatted") or \
                     properties.get("address_line1") or \
                     f"{properties.get('name', '')}, {properties.get('city', '')}, {properties.get('state', '')}" or \
                     location # Fallback
        place_name = place_name.strip(", ").strip()

        print(f"DEBUG: Geocoding SUCCESS for '{location}'. Name: '{place_name}', Coords: {coordinates}") # LOGGING
        return {"coordinates": coordinates, "place_name": place_name}

    except requests.exceptions.Timeout:
        print(f"DEBUG: Geocoding TIMEOUT for '{location}'.") # LOGGING
        raise ValueError(f"Geocoding request timed out for: {location}")
    except requests.exceptions.HTTPError as e:
        print(f"DEBUG: Geocoding HTTP error for '{location}': {e}. Response: {response.text[:500]}") # LOGGING
        if response.status_code == 401:
             raise ValueError(f"Geocoding Authentication Failed (401). Check your API Key.")
        raise ValueError(f"Geocoding failed for '{location}' (HTTP {response.status_code}).")
    except requests.exceptions.RequestException as e:
        print(f"DEBUG: Geocoding network error for '{location}': {e}") # LOGGING
        raise ValueError(f"Network error during geocoding: {location}")
    except Exception as e:
        print(f"DEBUG: Geocoding unexpected error for '{location}': {e}") # LOGGING
        traceback.print_exc()
        raise ValueError(f"Could not geocode location: {location}")


def get_route_data(origin_location, destination_location):
    """Get route data between two location dicts using Geoapify Routing API"""
    origin_coords = origin_location.get("coordinates")
    dest_coords = destination_location.get("coordinates")
    print(f"DEBUG: Attempting routing. Origin='{origin_location.get('place_name')}'({origin_coords}), Dest='{destination_location.get('place_name')}'({dest_coords})") # LOGGING

    if not GEOAPIFY_API_KEY:
        print("DEBUG: Routing failed - API Key missing.") # LOGGING
        raise ValueError("Geoapify API Key is missing for routing.")
    if not origin_coords or not isinstance(origin_coords, list) or len(origin_coords) != 2:
        print("DEBUG: Routing failed - Invalid origin coordinates.") # LOGGING
        raise ValueError(f"Invalid origin coordinates for routing: {origin_coords}")
    if not dest_coords or not isinstance(dest_coords, list) or len(dest_coords) != 2:
        print("DEBUG: Routing failed - Invalid destination coordinates.") # LOGGING
        raise ValueError(f"Invalid destination coordinates for routing: {dest_coords}")

    # Format: latitude,longitude
    waypoints = f"{origin_coords[1]},{origin_coords[0]}|{dest_coords[1]},{dest_coords[0]}"
    url = "https://api.geoapify.com/v1/routing"
    params = {"waypoints": waypoints, "mode": "drive", "apiKey": GEOAPIFY_API_KEY}

    try:
        response = requests.get(url, params=params, timeout=15) # Added timeout
        print(f"DEBUG: Routing API URL called: {response.url.replace(GEOAPIFY_API_KEY, '***KEY***')}") # LOGGING URL (key redacted)
        print(f"DEBUG: Routing API Status Code: {response.status_code}") # LOGGING Status
        response.raise_for_status()
        data = response.json()

        if not data.get("features"):
            print(f"DEBUG: Routing failed - No features found between {origin_location['place_name']} and {destination_location['place_name']}. Response: {data}") # LOGGING
            # Don't fallback here, let the caller handle missing route
            raise ValueError(f"Could not get route from '{origin_location['place_name']}' to '{destination_location['place_name']}'. API found no path.")

        route = data["features"][0]
        properties = route.get("properties", {})
        distance_meters = properties.get("distance")
        duration_seconds = properties.get("time")
        geometry = route.get("geometry") # Can be null if API doesn't return it

        # Log geometry type if present
        print(f"DEBUG: Routing SUCCESS. Geometry type: {geometry.get('type') if geometry else 'None'}") # LOGGING

        if distance_meters is None or duration_seconds is None:
             print(f"DEBUG: Routing failed - API response missing distance or time. Properties: {properties}") # LOGGING
             raise ValueError("API routing response missing distance or time properties.")

        distance_miles = distance_meters * 0.000621371
        duration_hours = duration_seconds / 3600

        print(f"DEBUG: Routed from '{origin_location['place_name']}' to '{destination_location['place_name']}': {distance_miles:.1f} miles, {duration_hours:.2f} hours")
        return {
            "distance_miles": distance_miles,
            "duration_hours": duration_hours,
            "geometry": geometry, # Pass geometry along
        }

    except requests.exceptions.Timeout:
        print(f"DEBUG: Routing TIMEOUT between '{origin_location.get('place_name')}' and '{destination_location.get('place_name')}'.") # LOGGING
        raise ValueError("Routing request timed out.")
    except requests.exceptions.HTTPError as e:
        print(f"DEBUG: Routing HTTP error: {e}. Response: {response.text[:500]}") # LOGGING
        if response.status_code == 401:
             raise ValueError(f"Routing Authentication Failed (401). Check your API Key.")
        # Check for specific Geoapify errors if possible from response.text
        raise ValueError(f"Routing failed (HTTP {response.status_code}).")
    except requests.exceptions.RequestException as e:
        print(f"DEBUG: Routing network error: {e}") # LOGGING
        raise ValueError("Network error during routing.")
    except Exception as e:
        print(f"DEBUG: Routing unexpected error: {e}") # LOGGING
        traceback.print_exc()
        raise ValueError("Unexpected error during routing.")


def get_point_along_route(geometry, distance_ratio):
    """Estimates coordinates partway along a LineString geometry (basic)."""
    geom_type = geometry.get('type') if geometry else 'None'
    coords = geometry.get('coordinates') if geometry else None
    print(f"DEBUG: get_point_along_route - GeomType: {geom_type}, Ratio: {distance_ratio:.3f}, HasCoords: {coords is not None}") # LOGGING

    if geom_type != 'LineString' or not coords:
        print("DEBUG: get_point_along_route - Invalid geometry or no coordinates, returning None.") # LOGGING
        return None

    total_points = len(coords)
    if total_points < 2:
        result_coords = coords[0] if total_points == 1 else None
        print(f"DEBUG: get_point_along_route - Only {total_points} points, returning: {result_coords}") # LOGGING
        return result_coords

    distance_ratio = max(0.0, min(1.0, distance_ratio))
    target_index_float = (total_points - 1) * distance_ratio
    index1 = int(target_index_float)
    index2 = min(index1 + 1, total_points - 1)

    if index1 >= total_points - 1:
        result_coords = coords[-1]
        print(f"DEBUG: get_point_along_route - Ratio >= 1, returning last point: {result_coords}") # LOGGING
        return result_coords
    if index1 == index2:
        result_coords = coords[index1]
        print(f"DEBUG: get_point_along_route - Integer index, returning point {index1}: {result_coords}") # LOGGING
        return result_coords

    lon1, lat1 = coords[index1]
    lon2, lat2 = coords[index2]
    fraction = target_index_float - index1
    interp_lon = lon1 + (lon2 - lon1) * fraction
    interp_lat = lat1 + (lat2 - lat1) * fraction
    result_coords = [interp_lon, interp_lat]
    print(f"DEBUG: get_point_along_route - Interpolated Result: {result_coords}") # LOGGING
    return result_coords


def plan_route(current_location_str, pickup_location_str, dropoff_location_str, current_cycle_used_hours):
    """Plans a route including stops, returning segments with coordinates."""
    print(f"\n{'='*10} Starting Route Planning {'='*10}")
    print(f"Locations: '{current_location_str}' -> '{pickup_location_str}' -> '{dropoff_location_str}'")
    print(f"Initial Cycle Used: {current_cycle_used_hours:.2f} hours")

    current_time = datetime.datetime.now(pytz.utc)
    remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY
    remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY
    remaining_cycle = MAX_CYCLE_HOURS - current_cycle_used_hours
    driving_hours_since_last_break = 0

    try:
        print("DEBUG: plan_route - Geocoding initial locations...")
        current_loc = geocode_location(current_location_str)
        pickup_loc = geocode_location(pickup_location_str)
        dropoff_loc = geocode_location(dropoff_location_str)
        print(f"DEBUG: plan_route - Geocode results: Current={current_loc.get('coordinates')}, Pickup={pickup_loc.get('coordinates')}, Dropoff={dropoff_loc.get('coordinates')}")

        print("DEBUG: plan_route - Getting route data...")
        to_pickup_route = get_route_data(current_loc, pickup_loc)
        pickup_to_dropoff_route = get_route_data(pickup_loc, dropoff_loc)
        print(f"DEBUG: plan_route - Route geometries obtained. ToPickup: {to_pickup_route.get('geometry') is not None}, PickupToDropoff: {pickup_to_dropoff_route.get('geometry') is not None}")

    except ValueError as e:
        print(f"CRITICAL ERROR: plan_route - Failed during initial setup: {e}")
        raise # Re-raise to be caught by the view

    segments = []
    current_pos_coords = current_loc.get("coordinates")
    current_pos_name = current_loc.get("place_name", "Unknown Start")
    print(f"DEBUG: plan_route - Initial Position: '{current_pos_name}' Coords: {current_pos_coords}")
    if not current_pos_coords:
        raise ValueError("Failed to get valid starting coordinates.") # Cannot proceed without start coords

    # --- Process Leg 1: Current Location to Pickup ---
    print("\n--- Processing Leg 1: Current to Pickup ---")
    target_pos_coords = pickup_loc.get("coordinates")
    target_pos_name = pickup_loc.get("place_name", "Unknown Pickup")
    route_geom = to_pickup_route.get("geometry") # May be None if routing failed but didn't raise error (should not happen now)
    total_route_distance = to_pickup_route.get("distance_miles", 0)
    distance_covered_on_leg = 0
    fuel_distance_since_last_stop = 0

    leg = 1
    loop_counter = 0 # Safety break
    max_loops = 100 # Safety break

    while distance_covered_on_leg < total_route_distance and loop_counter < max_loops :
        loop_counter += 1
        print(f"\nLeg {leg} - Loop {loop_counter}/{max_loops}:")
        print(f"  Current Pos: '{current_pos_name}' ({current_pos_coords})")
        print(f"  Target Pos: '{target_pos_name}' ({target_pos_coords})")
        print(f"  Distance Covered: {distance_covered_on_leg:.1f} / Total: {total_route_distance:.1f}")
        print(f"  HOS Remaining: Drive={remaining_daily_driving:.2f}, Duty={remaining_daily_duty:.2f}, Cycle={remaining_cycle:.2f}")
        print(f"  Driving Since Break: {driving_hours_since_last_break:.2f}")
        print(f"  Distance Since Fuel: {fuel_distance_since_last_stop:.1f}")

        segment_start_time = current_time
        segment_start_coords = list(current_pos_coords) if current_pos_coords else None # Copy coords
        segment_start_name = current_pos_name

        # 1. Check for mandatory 10-hour rest
        if remaining_daily_driving <= 0.01 or remaining_daily_duty <= 0.01 or remaining_cycle <= 0.01:
            print("  Action: Taking 10-hour mandatory rest.")
            rest_hours = REQUIRED_REST_HOURS
            rest_end_time = current_time + datetime.timedelta(hours=rest_hours)
            segments.append({
                "type": "REST", "start_location": segment_start_name, "end_location": segment_start_name,
                "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords,
                "distance_miles": 0, "duration_hours": rest_hours, "start_time": segment_start_time, "end_time": rest_end_time,
            })
            current_time = rest_end_time
            remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY; remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY; driving_hours_since_last_break = 0
            print(f"  Reset daily limits. New time: {current_time}")
            continue

        # 2. Determine max driving distance before *next* potential stop
        max_drive_hrs_before_30m_break = max(0, HOURS_BEFORE_BREAK - driving_hours_since_last_break) # Ensure non-negative
        drivable_hours = min(remaining_daily_driving, remaining_daily_duty, remaining_cycle, max_drive_hrs_before_30m_break)

        if drivable_hours <= 0.01:
             print("  Action: No driving time available before next limit/break.")
             if max_drive_hrs_before_30m_break <= 0.01:
                 print("  Action: Taking mandatory 30-min break.")
                 break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
                 segments.append({"type": "REST", "start_location": segment_start_name, "end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": segment_start_time, "end_time": break_end_time,})
                 current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours; driving_hours_since_last_break = 0
                 print(f"  Finished 30m break. New time: {current_time}")
                 continue
             else: # Should be caught by check 1, but as safety
                 print("  Action: Taking 10-hour rest (fallback - should not be reached)."); rest_hours = REQUIRED_REST_HOURS; rest_end_time = current_time + datetime.timedelta(hours=rest_hours)
                 segments.append({"type": "REST", "start_location": segment_start_name,"end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0,"duration_hours": rest_hours,"start_time": segment_start_time,"end_time": rest_end_time})
                 current_time = rest_end_time; remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY; remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY; driving_hours_since_last_break = 0
                 continue

        # Calculate max distance possible in this driving block
        max_drivable_distance = drivable_hours * AVERAGE_SPEED_MPH
        distance_remaining_on_leg = max(0, total_route_distance - distance_covered_on_leg) # Ensure non-negative

        # 3. Check if fueling is needed within this drivable distance
        distance_before_fuel_needed = max(0, MAX_MILES_BEFORE_FUEL - fuel_distance_since_last_stop)
        potential_drive_dist = min(max_drivable_distance, distance_remaining_on_leg)
        needs_fuel_before_limit = distance_before_fuel_needed < potential_drive_dist

        distance_this_drive_segment = 0
        if needs_fuel_before_limit:
            # Drive up to the point fuel is needed, or the remaining leg distance, whichever is smaller
            distance_this_drive_segment = min(distance_before_fuel_needed, distance_remaining_on_leg)
            print(f"  Action: Driving towards potential fuel stop ({distance_this_drive_segment:.1f} miles).")
        else:
            # Drive as far as possible towards target or until HOS limit
            distance_this_drive_segment = potential_drive_dist
            print(f"  Action: Driving towards target/HOS limit ({distance_this_drive_segment:.1f} miles).")

        if distance_this_drive_segment <= 0.01:
             print("  Warning: Calculated drive segment distance is negligible. Forcing 30m break to prevent potential loop.")
             break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
             segments.append({"type": "REST", "start_location": segment_start_name,"end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": segment_start_time, "end_time": break_end_time}); current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours; driving_hours_since_last_break = 0
             continue

        # Calculate drive segment details
        actual_drive_hours = distance_this_drive_segment / AVERAGE_SPEED_MPH if AVERAGE_SPEED_MPH > 0 else 0
        drive_end_time = current_time + datetime.timedelta(hours=actual_drive_hours)
        new_total_distance_covered = distance_covered_on_leg + distance_this_drive_segment

        # Estimate end coordinates for this drive segment
        ratio_on_leg = new_total_distance_covered / total_route_distance if total_route_distance > 0 else 1.0
        is_final_segment_of_leg = ratio_on_leg >= 1.0 - 1e-6 # Floating point comparison

        drive_end_coords = None
        if is_final_segment_of_leg:
            drive_end_coords = list(target_pos_coords) if target_pos_coords else None # Ensure it's the target
        else:
            # Try to interpolate
            drive_end_coords_candidate = get_point_along_route(route_geom, ratio_on_leg)
            if drive_end_coords_candidate:
                drive_end_coords = drive_end_coords_candidate
            else:
                print(f"  Warning: Could not interpolate end coords for drive segment, using start coords as fallback.")
                drive_end_coords = list(segment_start_coords) if segment_start_coords else None # Fallback

        drive_end_name = target_pos_name if is_final_segment_of_leg else f"Point approx. {distance_this_drive_segment:.1f} miles driven towards {target_pos_name}"

        # Append the DRIVE segment
        segment_to_add = {
            "type": "DRIVE", "start_location": segment_start_name, "end_location": drive_end_name,
            "start_coordinates": segment_start_coords, # From start of loop iteration
            "end_coordinates": drive_end_coords,     # Calculated/Target coords
            "distance_miles": distance_this_drive_segment, "duration_hours": actual_drive_hours,
            "start_time": segment_start_time, "end_time": drive_end_time,
        }
        print(f"  DEBUG: Appending DRIVE Segment - Start: {segment_to_add['start_coordinates']}, End: {segment_to_add['end_coordinates']}") # LOGGING
        segments.append(segment_to_add)

        # Update state AFTER the drive segment
        current_time = drive_end_time
        current_pos_coords = drive_end_coords # CRITICAL UPDATE
        current_pos_name = drive_end_name
        distance_covered_on_leg = new_total_distance_covered # Use new total
        remaining_daily_driving -= actual_drive_hours
        remaining_daily_duty -= actual_drive_hours
        remaining_cycle -= actual_drive_hours
        driving_hours_since_last_break += actual_drive_hours
        fuel_distance_since_last_stop += distance_this_drive_segment

        print(f"  Drive segment finished. New Pos Coords: {current_pos_coords}")

        # 4. If fuel was the reason we stopped this drive segment, add fuel stop
        # Check if fuel distance limit was reached *by the end* of this segment
        if fuel_distance_since_last_stop >= MAX_MILES_BEFORE_FUEL - 0.1 and not is_final_segment_of_leg:
            print("  Action: Taking fuel stop after drive segment.")
            fuel_hours = FUEL_STOP_DURATION_HOURS; fuel_end_time = current_time + datetime.timedelta(hours=fuel_hours)
            # Fuel stop happens *at the current location*
            segments.append({"type": "FUEL", "start_location": current_pos_name, "end_location": current_pos_name, "start_coordinates": current_pos_coords, "end_coordinates": current_pos_coords, "distance_miles": 0, "duration_hours": fuel_hours, "start_time": current_time, "end_time": fuel_end_time,})
            current_time = fuel_end_time; remaining_daily_duty -= fuel_hours; remaining_cycle -= fuel_hours
            fuel_distance_since_last_stop = 0 # Reset fuel counter
            print(f"  Finished fuel stop. New time: {current_time}")
            # No continue needed here, loop will re-evaluate HOS for next drive

        # 5. Check if 30-min break is needed *now* (after driving, before potential next drive/stop)
        elif driving_hours_since_last_break >= HOURS_BEFORE_BREAK - 0.01 and not is_final_segment_of_leg:
            print("  Action: Taking 30-min break after drive segment.")
            break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
            segments.append({"type": "REST", "start_location": current_pos_name, "end_location": current_pos_name, "start_coordinates": current_pos_coords, "end_coordinates": current_pos_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": current_time, "end_time": break_end_time,})
            current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours
            driving_hours_since_last_break = 0 # Reset break timer
            print(f"  Finished 30m break. New time: {current_time}")
            # No continue needed here

    if loop_counter >= max_loops:
        print(f"WARNING: Exceeded max loops ({max_loops}) in Leg {leg}. Route planning may be incomplete.")

    # --- End of Leg 1 Loop ---
    print(f"--- Finished Leg 1 (Current Location to Pickup) ---")

    # --- Add Pickup Stop ---
    if distance_covered_on_leg >= total_route_distance - 0.1: # Ensure we actually reached pickup
        print("Action: Adding PICKUP stop.")
        pickup_duration = PICKUP_DROPOFF_DURATION_HOURS
        pickup_end_time = current_time + datetime.timedelta(hours=pickup_duration)
        # Ensure position is exactly at pickup location after the leg
        pickup_coords = pickup_loc.get("coordinates")
        pickup_name = pickup_loc.get("place_name", "Pickup Location")
        if not pickup_coords: raise ValueError("Pickup location coordinates are missing!")

        segments.append({"type": "PICKUP", "start_location": pickup_name, "end_location": pickup_name, "start_coordinates": pickup_coords, "end_coordinates": pickup_coords, "distance_miles": 0, "duration_hours": pickup_duration, "start_time": current_time, "end_time": pickup_end_time,})
        current_time = pickup_end_time
        current_pos_coords = pickup_coords # Update current position
        current_pos_name = pickup_name
        remaining_daily_duty -= pickup_duration
        remaining_cycle -= pickup_duration
        print(f"Finished PICKUP. New time: {current_time}. Pos: {current_pos_coords}")
    else:
        print("Warning: Did not fully reach pickup location in Leg 1 simulation.")


    # --- Process Leg 2: Pickup to Dropoff ---
    print("\n--- Processing Leg 2: Pickup to Dropoff ---")
    target_pos_coords = dropoff_loc.get("coordinates")
    target_pos_name = dropoff_loc.get("place_name", "Unknown Dropoff")
    route_geom = pickup_to_dropoff_route.get("geometry")
    total_route_distance = pickup_to_dropoff_route.get("distance_miles", 0)
    distance_covered_on_leg = 0
    # fuel_distance_since_last_stop carries over

    leg = 2
    loop_counter = 0 # Reset safety break counter
    while distance_covered_on_leg < total_route_distance and loop_counter < max_loops:
        loop_counter += 1
        # --- PASTE THE FULL LOOP CONTENT (Steps 1-5) FROM LEG 1 HERE ---
        # --- Ensure all variables (target_pos_*, route_geom, total_route_distance) use Leg 2's data ---
        print(f"\nLeg {leg} - Loop {loop_counter}/{max_loops}:")
        print(f"  Current Pos: '{current_pos_name}' ({current_pos_coords})")
        print(f"  Target Pos: '{target_pos_name}' ({target_pos_coords})")
        print(f"  Distance Covered: {distance_covered_on_leg:.1f} / Total: {total_route_distance:.1f}")
        print(f"  HOS Remaining: Drive={remaining_daily_driving:.2f}, Duty={remaining_daily_duty:.2f}, Cycle={remaining_cycle:.2f}")
        print(f"  Driving Since Break: {driving_hours_since_last_break:.2f}")
        print(f"  Distance Since Fuel: {fuel_distance_since_last_stop:.1f}")

        segment_start_time = current_time
        segment_start_coords = list(current_pos_coords) if current_pos_coords else None # Copy coords
        segment_start_name = current_pos_name

        if remaining_daily_driving <= 0.01 or remaining_daily_duty <= 0.01 or remaining_cycle <= 0.01:
            print("  Action: Taking 10-hour mandatory rest.")
            rest_hours = REQUIRED_REST_HOURS; rest_end_time = current_time + datetime.timedelta(hours=rest_hours)
            segments.append({"type": "REST", "start_location": segment_start_name, "end_location": segment_start_name,"start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords,"distance_miles": 0, "duration_hours": rest_hours, "start_time": segment_start_time, "end_time": rest_end_time,})
            current_time = rest_end_time; remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY; remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY; driving_hours_since_last_break = 0
            print(f"  Reset daily limits. New time: {current_time}"); continue

        max_drive_hrs_before_30m_break = max(0, HOURS_BEFORE_BREAK - driving_hours_since_last_break)
        drivable_hours = min(remaining_daily_driving, remaining_daily_duty, remaining_cycle, max_drive_hrs_before_30m_break)

        if drivable_hours <= 0.01:
             print("  Action: No driving time available before next limit/break.")
             if max_drive_hrs_before_30m_break <= 0.01:
                 print("  Action: Taking mandatory 30-min break."); break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
                 segments.append({"type": "REST", "start_location": segment_start_name, "end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": segment_start_time, "end_time": break_end_time,})
                 current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours; driving_hours_since_last_break = 0
                 print(f"  Finished 30m break. New time: {current_time}"); continue
             else:
                 print("  Action: Taking 10-hour rest (fallback - should not be reached)."); rest_hours = REQUIRED_REST_HOURS; rest_end_time = current_time + datetime.timedelta(hours=rest_hours)
                 segments.append({"type": "REST", "start_location": segment_start_name,"end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0,"duration_hours": rest_hours,"start_time": segment_start_time,"end_time": rest_end_time})
                 current_time = rest_end_time; remaining_daily_driving = MAX_DRIVING_HOURS_PER_DAY; remaining_daily_duty = MAX_ON_DUTY_HOURS_PER_DAY; driving_hours_since_last_break = 0
                 continue

        max_drivable_distance = drivable_hours * AVERAGE_SPEED_MPH
        distance_remaining_on_leg = max(0, total_route_distance - distance_covered_on_leg)
        distance_before_fuel_needed = max(0, MAX_MILES_BEFORE_FUEL - fuel_distance_since_last_stop)
        potential_drive_dist = min(max_drivable_distance, distance_remaining_on_leg)
        needs_fuel_before_limit = distance_before_fuel_needed < potential_drive_dist
        distance_this_drive_segment = 0

        if needs_fuel_before_limit:
            distance_this_drive_segment = min(distance_before_fuel_needed, distance_remaining_on_leg)
            print(f"  Action: Driving towards potential fuel stop ({distance_this_drive_segment:.1f} miles).")
        else:
            distance_this_drive_segment = potential_drive_dist
            print(f"  Action: Driving towards target/HOS limit ({distance_this_drive_segment:.1f} miles).")

        if distance_this_drive_segment <= 0.01:
             print("  Warning: Calculated drive segment distance is negligible. Forcing 30m break to prevent potential loop.")
             break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
             segments.append({"type": "REST", "start_location": segment_start_name,"end_location": segment_start_name, "start_coordinates": segment_start_coords, "end_coordinates": segment_start_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": segment_start_time, "end_time": break_end_time}); current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours; driving_hours_since_last_break = 0
             continue

        actual_drive_hours = distance_this_drive_segment / AVERAGE_SPEED_MPH if AVERAGE_SPEED_MPH > 0 else 0
        drive_end_time = current_time + datetime.timedelta(hours=actual_drive_hours)
        new_total_distance_covered = distance_covered_on_leg + distance_this_drive_segment
        ratio_on_leg = new_total_distance_covered / total_route_distance if total_route_distance > 0 else 1.0
        is_final_segment_of_leg = ratio_on_leg >= 1.0 - 1e-6

        drive_end_coords = None
        if is_final_segment_of_leg:
            drive_end_coords = list(target_pos_coords) if target_pos_coords else None
        else:
            drive_end_coords_candidate = get_point_along_route(route_geom, ratio_on_leg)
            if drive_end_coords_candidate: drive_end_coords = drive_end_coords_candidate
            else: print(f"  Warning: Could not interpolate end coords for drive segment, using start coords as fallback."); drive_end_coords = list(segment_start_coords) if segment_start_coords else None

        drive_end_name = target_pos_name if is_final_segment_of_leg else f"Point approx. {distance_this_drive_segment:.1f} miles driven towards {target_pos_name}"

        segment_to_add = {"type": "DRIVE", "start_location": segment_start_name, "end_location": drive_end_name, "start_coordinates": segment_start_coords, "end_coordinates": drive_end_coords, "distance_miles": distance_this_drive_segment, "duration_hours": actual_drive_hours, "start_time": segment_start_time, "end_time": drive_end_time,}
        print(f"  DEBUG: Appending DRIVE Segment - Start: {segment_to_add['start_coordinates']}, End: {segment_to_add['end_coordinates']}")
        segments.append(segment_to_add)

        current_time = drive_end_time; current_pos_coords = drive_end_coords; current_pos_name = drive_end_name; distance_covered_on_leg = new_total_distance_covered
        remaining_daily_driving -= actual_drive_hours; remaining_daily_duty -= actual_drive_hours; remaining_cycle -= actual_drive_hours
        driving_hours_since_last_break += actual_drive_hours; fuel_distance_since_last_stop += distance_this_drive_segment
        print(f"  Drive segment finished. New Pos Coords: {current_pos_coords}")

        if fuel_distance_since_last_stop >= MAX_MILES_BEFORE_FUEL - 0.1 and not is_final_segment_of_leg:
            print("  Action: Taking fuel stop after drive segment."); fuel_hours = FUEL_STOP_DURATION_HOURS; fuel_end_time = current_time + datetime.timedelta(hours=fuel_hours)
            segments.append({"type": "FUEL", "start_location": current_pos_name, "end_location": current_pos_name, "start_coordinates": current_pos_coords, "end_coordinates": current_pos_coords, "distance_miles": 0, "duration_hours": fuel_hours, "start_time": current_time, "end_time": fuel_end_time,})
            current_time = fuel_end_time; remaining_daily_duty -= fuel_hours; remaining_cycle -= fuel_hours; fuel_distance_since_last_stop = 0
            print(f"  Finished fuel stop. New time: {current_time}")

        elif driving_hours_since_last_break >= HOURS_BEFORE_BREAK - 0.01 and not is_final_segment_of_leg:
            print("  Action: Taking 30-min break after drive segment."); break_hours = BREAK_DURATION_HOURS; break_end_time = current_time + datetime.timedelta(hours=break_hours)
            segments.append({"type": "REST", "start_location": current_pos_name, "end_location": current_pos_name, "start_coordinates": current_pos_coords, "end_coordinates": current_pos_coords, "distance_miles": 0, "duration_hours": break_hours, "start_time": current_time, "end_time": break_end_time,})
            current_time = break_end_time; remaining_daily_duty -= break_hours; remaining_cycle -= break_hours; driving_hours_since_last_break = 0
            print(f"  Finished 30m break. New time: {current_time}")

    if loop_counter >= max_loops:
        print(f"WARNING: Exceeded max loops ({max_loops}) in Leg {leg}. Route planning may be incomplete.")

    # --- End of Leg 2 Loop ---
    print(f"--- Finished Leg 2 (Pickup to Dropoff) ---")

    # --- Add Dropoff Stop ---
    if distance_covered_on_leg >= total_route_distance - 0.1: # Ensure we actually reached dropoff
        print("Action: Adding DROPOFF stop.")
        dropoff_duration = PICKUP_DROPOFF_DURATION_HOURS
        dropoff_end_time = current_time + datetime.timedelta(hours=dropoff_duration)
        # Ensure position is exactly at dropoff location
        dropoff_coords = dropoff_loc.get("coordinates")
        dropoff_name = dropoff_loc.get("place_name", "Dropoff Location")
        if not dropoff_coords: raise ValueError("Dropoff location coordinates are missing!")

        segments.append({"type": "DROPOFF", "start_location": dropoff_name, "end_location": dropoff_name, "start_coordinates": dropoff_coords, "end_coordinates": dropoff_coords, "distance_miles": 0, "duration_hours": dropoff_duration, "start_time": current_time, "end_time": dropoff_end_time,})
        print(f"Finished DROPOFF. Final time: {dropoff_end_time}")
    else:
         print("Warning: Did not fully reach dropoff location in Leg 2 simulation.")


    # Calculate final totals based on generated segments
    total_dist = sum(s["distance_miles"] for s in segments if s["type"] == "DRIVE")
    total_dur = (segments[-1]["end_time"] - segments[0]["start_time"]).total_seconds() / 3600 if segments else 0
    print(f"\n{'='*10} Route Planning Complete {'='*10}")
    print(f"Total Segments Generated: {len(segments)}")
    print(f"Calculated Total Drive Distance: {total_dist:.1f} miles")
    print(f"Calculated Total Trip Duration (Wall Clock): {total_dur:.2f} hours")

    # Final check on segment coordinates before returning
    for i, s in enumerate(segments):
        if not s.get("start_coordinates") or not s.get("end_coordinates"):
            print(f"WARNING: Final check found missing coordinates in segment {i} ({s.get('type')})!")

    return {
        "segments": segments, # Includes coordinates
        "total_distance": total_dist,
        "total_duration": total_dur,
    }

# --- generate_eld_logs (Should be okay, keeping previous version with minor logging) ---
def generate_eld_logs(trip, route_data):
    """Generate ELD logs based on the route segments."""
    print("\n--- Generating ELD Logs ---")
    eld_logs = {}
    if not route_data or not route_data.get("segments"):
         print("DEBUG: No route segments found to generate ELD logs.")
         return eld_logs

    for segment in route_data["segments"]:
        start_dt_utc = segment["start_time"].astimezone(pytz.utc)
        end_dt_utc = segment["end_time"].astimezone(pytz.utc)
        local_tz = pytz.timezone('UTC') # Defaulting to UTC for simplicity
        start_dt_local = start_dt_utc.astimezone(local_tz)
        end_dt_local = end_dt_utc.astimezone(local_tz)
        current_date_local = start_dt_local.date()
        end_date_local = end_dt_local.date()

        iter_date = current_date_local
        while iter_date <= end_date_local:
            date_str = iter_date.isoformat()
            if date_str not in eld_logs:
                eld_logs[date_str] = {"date": date_str, "status_timeline": []}
            day_start_dt = datetime.datetime.combine(iter_date, datetime.time.min, tzinfo=local_tz)
            day_end_dt = datetime.datetime.combine(iter_date, datetime.time.max, tzinfo=local_tz)
            actual_start_dt = max(start_dt_local, day_start_dt)
            actual_end_dt = min(end_dt_local, day_end_dt)
            status_map = {"DRIVE": "D", "REST": "SB", "FUEL": "ON", "PICKUP": "ON", "DROPOFF": "ON", "START": "OFF"}
            eld_status = status_map.get(segment["type"], "OFF")

            eld_logs[date_str]["status_timeline"].append({
                "status": eld_status,
                "start_time": actual_start_dt.strftime("%H:%M"),
                "end_time": "23:59" if actual_end_dt.time() == datetime.time.max else actual_end_dt.strftime("%H:%M"),
                "location": segment["start_location"],
                "notes": f"Segment Type: {segment['type']}"
            })
            iter_date += datetime.timedelta(days=1)

    for date_str, log in eld_logs.items():
        log["status_timeline"].sort(key=lambda x: x["start_time"])
        filled_timeline = []; last_end_time_str = "00:00"; last_location = "Start of Day"
        for entry in log["status_timeline"]:
            entry_start_time = datetime.datetime.strptime(entry["start_time"], "%H:%M").time()
            last_end_time = datetime.datetime.strptime(last_end_time_str, "%H:%M").time()
            if entry_start_time > last_end_time:
                filled_timeline.append({"status": "OFF", "start_time": last_end_time_str, "end_time": entry["start_time"], "location": last_location, "notes": "Gap Fill"})
            filled_timeline.append(entry)
            last_end_time_str = entry["end_time"]; last_location = entry["location"]
        if last_end_time_str != "23:59":
             filled_timeline.append({"status": "OFF", "start_time": last_end_time_str, "end_time": "23:59", "location": last_location, "notes": "Gap Fill End of Day"})
        log["status_timeline"] = filled_timeline

        hours_summary = {"D": 0.0, "ON": 0.0, "OFF": 0.0, "SB": 0.0}
        for entry in filled_timeline:
            t1 = datetime.datetime.strptime(entry["start_time"], "%H:%M")
            t2_str = entry["end_time"]; t2 = datetime.datetime.strptime("23:59:59", "%H:%M:%S") if t2_str == "23:59" else datetime.datetime.strptime(t2_str, "%H:%M")
            duration_seconds = (t2 - t1).total_seconds() + (1 if t2_str == "23:59" else 0)
            duration_hours = max(0, duration_seconds) / 3600
            status = entry["status"]; hours_summary[status] = hours_summary.get(status, 0.0) + duration_hours
        log["hours_summary"] = {k: round(v, 2) for k, v in hours_summary.items()}
        print(f"DEBUG: Generated ELD Log for {date_str}: {log['hours_summary']}")

    print("--- Finished Generating ELD Logs ---")
    return eld_logs