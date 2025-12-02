import uuid
import numpy as np 
from django.conf import settings
import os
from .sentinel_config import get_sh_config
from .image_utils import save_image, compute_safe_size
from sentinelhub import (
    SentinelHubRequest, 
    MimeType,
    CRS, 
    BBox, 
    DataCollection,
    MosaickingOrder        
)
import time
from sentinelhub.exceptions import DownloadFailedException
import requests



def calculate_ndvi(bbox, start_date, end_date, save=True) -> str:
    config = get_sh_config()

    # image width/height/resolution (in pixels)
    w, h, res = compute_safe_size(bbox, 2500, 60)
    print(f"NDVI REQUEST: bbox={bbox}, dates=({start_date},{end_date}), size={w}x{h}, res={res}")

    request = SentinelHubRequest(
        evalscript="""
            // NDVI = (B08 - B04) / (B08 + B04)
            // B08 = NIR, B04 = Red
            function setup() {
                return {
                    input: ["B04", "B08"],
                    output: [
                        { id: "ndvi", bands: 1, sampleType: "FLOAT32" }
                    ]
                };
            }
            function evaluatePixel(sample) {
                return [(sample.B08 - sample.B04) / (sample.B08 + sample.B04)];
            }
        """,
        input_data=[
            SentinelHubRequest.input_data(
                data_collection=DataCollection.SENTINEL2_L2A,
                time_interval=(start_date, end_date),
                maxcc=0.15,
                mosaicking_order=MosaickingOrder.LEAST_CC
            )
        ],
        responses=[SentinelHubRequest.output_response(identifier="ndvi", response_format=MimeType.TIFF)],
        bbox=bbox,
        size=(w, h),
        config=config
    )

    # ndvi raster as a one-dimensional numpy array [float32]
    ndvi_data = request.get_data()[0].squeeze()
    result_path = None
    print("BEFORE SAVING, DATA:",  ndvi_data) 
    if save:
        filename = f"ndvi_{uuid.uuid4()}.png"
        result_path = save_image(data=ndvi_data, 
                        filename=filename, 
                        title="NDVI Index", 
                        cmap="RdYlGn", 
                        vmin=-1,
                        vmax=1,
                        colorbar_label="NDVI",
                        figsize=(10, 10),
                        dpi=300)
    return ndvi_data, result_path
    
def calculate_ndwi(bbox, *args):
    ...


def compare_images(arr1, arr2, save=True) -> str | np.ndarray:
    '''
    Compare two rasters pixel-by-pixel with the same resolution, extent and projection (CRS)
    '''
    diff_data = arr2 - arr1
    filename = f"comparison_{uuid.uuid4()}.png"

    # find min/max - NaN excluded
    vmin = np.nanmin(diff_data)
    vmax = np.nanmax(diff_data)
    print("VMIN VMAX", vmin, vmax)
    return save_image(diff_data, 
                    filename, 
                    title="Heatmap Index", 
                    cmap="RdBu",
                    vmin=vmin,
                    vmax=vmax,  
                    colorbar_label="Change index (negative → decrease, positive → increase)",
                    figsize=(10, 10),
                    dpi=300)

    

INDICES_ALLOWED = {
    "ndvi": calculate_ndvi,
    "ndwi": calculate_ndwi
    }





