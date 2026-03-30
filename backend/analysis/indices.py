import numpy as np 
from django.conf import settings
from .config import get_sh_config, SENTINEL_MAX_CLOUD_COVER          
from .image_utils import compute_safe_size
from sentinelhub import (
    SentinelHubRequest, 
    MimeType,
    DataCollection,
    MosaickingOrder
)

EVALSCRIPTS = {
    "NDVI": ("B04", "B08"),   # band1=red,  band2=NIR  → (NIR-red)/(NIR+red)
    "NDMI": ("B11", "B08"),   # band1=SWIR, band2=NIR  → (NIR-SWIR)/(NIR+SWIR)
}

def calculate_index(index,
                    bbox, 
                    start_date, 
                    end_date
) -> np.array:
    """
    Calculates a vegetation index (e.g., NDVI, NDMI) for a given bounding box and date range using Sentinel-2 imagery.
    Args:
        index (str): The index to calculate, must be one of the keys in EVALSCRIPTS (e.g., "NDVI", "NDMI").
        bbox: The bounding box for the area of interest (should be compatible with SentinelHubRequest).
        start_date (str): The start date for the imagery (format: "YYYY-MM-DD").
        end_date (str): The end date for the imagery (format: "YYYY-MM-DD").
    Returns:
        np.ndarray: Index raster with clouds masked as NaN.
    """
    
    if not index or index not in EVALSCRIPTS:
        raise KeyError(f"Unknown analysis type: {index}")
     
    config = get_sh_config()

    # image width/height/resolution [pixels]
    w, h, _ = compute_safe_size(bbox, 2500, 60)

    band1, band2 = EVALSCRIPTS[index] 

    request = SentinelHubRequest(
        evalscript=f"""
            function setup() {{
                return {{
                    input: ["{band1}", "{band2}", "SCL"],
                    output: [
                        {{ id: "result", bands: 1, sampleType: "FLOAT32" }}
                    ],
                }};
            }}
            function evaluatePixel(sample) {{
                // SCL values 3=cloud shadow, 8=cloud medium, 9=cloud high, 10=thin cirrus
                const cloudy = [3, 8, 9, 10];
                if (cloudy.includes(sample.SCL)) {{
                    return [-9999]; // nodata value
                }};
                return [(sample.{band2} - sample.{band1}) / (sample.{band2} + sample.{band1})];
            }}
        """,
       
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL2_L2A,
                time_interval=(start_date, end_date),
                maxcc=SENTINEL_MAX_CLOUD_COVER,
                mosaicking_order=MosaickingOrder.LEAST_CC)
        ],
        responses=[SentinelHubRequest.output_response(identifier="result", response_format=MimeType.TIFF)],
        bbox=bbox,
        size=(w, h),
        config=config
    )

    # Index raster as 2D numpy array [float32], clouds masked as NaN
    data = request.get_data()[0].squeeze()
    data[data == -9999] = np.nan

    if np.all(np.isnan(data)):
        raise ValueError("Received empty response from Sentinel Hub — check API credentials or date range.")

    return data
    
