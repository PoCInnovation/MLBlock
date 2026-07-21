import os

# Unset DATABASE_URL before any imports that might trigger database module
os.environ.pop("DATABASE_URL", None)
