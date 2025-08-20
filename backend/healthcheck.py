# healthcheck.py
import os
import sys

# Add the project's root directory to the Python path to allow Django imports
# This is crucial for the script to find your 'config' module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

try:
    # We must import Django stuff AFTER setting the settings module
    import django
    from django.db import connection
    from django.db.utils import OperationalError

    django.setup()

    # Check database connection by executing a simple query
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1;")
        if cursor.fetchone() is None:
            # This case is unlikely but would indicate a problem
            sys.exit(1)

    # If we reached here, both Django and the DB are operational
    sys.exit(0)

except (OperationalError, ImportError) as e:
    # OperationalError: Can't connect to the database.
    # ImportError: A problem with the Django setup or dependencies.
    print(f"Healthcheck failed: {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    # Catch any other unexpected errors
    print(f"Healthcheck failed with an unexpected error: {e}", file=sys.stderr)
    sys.exit(1)
