import os
from sentinelhub import SHConfig

def get_sh_config():
    """Retrieves Sentinel Hub configuration using environment variables."""
    config = SHConfig()
    config.sh_client_id = os.getenv("SENTINEL_CLIENT_ID")
    config.sh_client_secret = os.getenv("SENTINEL_CLIENT_SECRET")

    return config

# --- Quality Control Thresholds ---

# General Notes: Values in percentages (%)
# FAIL thresholds are exclusive (value must be <= FAIL to pass)
# WARN thresholds are inclusive (value >= WARN triggers a warning/fill)

FAIL_PCT_NANS = 50.0           
WARN_PCT_NANS = 15.0          
FAIL_NAN_FRACT = 20.0          
WARN_NAN_FRACT = 5.0

# Other related constants for Sentinel Hub
SENTINEL_MAX_CLOUD_COVER = 0.15     # 15% max

