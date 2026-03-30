import os
from sentinelhub import SHConfig
import datetime

def get_sh_config():
    """Retrieves Sentinel Hub configuration using environment variables."""
    client_id = os.getenv("SENTINEL_CLIENT_ID")
    client_secret = os.getenv("SENTINEL_CLIENT_SECRET")

    if not client_id or not client_secret:
        raise ValueError("Missing Sentinel Hub credentials: SENTINEL_CLIENT_ID and SENTINEL_CLIENT_SECRET must be set.")

    config = SHConfig()
    config.sh_client_id = client_id
    config.sh_client_secret = client_secret
    return config


# --- QUALITY CONTROL TRESHOLDS ---

# General Notes: Values in percentages (%)
# Image FAILS if pct_nans > 40% or nan_fract > 0.20
# Image WARNS if pct_nans > 15% or nan_fract > 0.05
FAIL_PCT_NANS = 40.0           
WARN_PCT_NANS = 15.0          
FAIL_NAN_FRACT = 0.20             
WARN_NAN_FRACT = 0.05

# Other related constants for Sentinel Hub
SENTINEL_MAX_CLOUD_COVER = 0.10
MAX_AOI_DEGREES = 20.0


# ---  TASK ORCHESTRATION & LIFECYCLE ---

# Tasks stuck in PENDING longer than this are marked as WORKER_TIMEOUT
PENDING_TIMEOUT = datetime.timedelta(minutes=10)

