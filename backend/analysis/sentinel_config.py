import os
from sentinelhub import SHConfig

def get_sh_config():
    config = SHConfig()
    config.sh_client_id = os.getenv("SENTINEL_CLIENT_ID")
    config.sh_client_secret = os.getenv("SENTINEL_CLIENT_SECRET")
    
    return config


