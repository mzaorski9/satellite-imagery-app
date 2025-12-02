import uuid
import numpy as np
import matplotlib.pyplot as plt
from rasterio import open as rio_open
from django.conf import settings
import os
from .sentinel_config import get_sh_config
from .image_utils import save_image
from sentinelhub import (
    SentinelHubRequest, 
    MimeType, 
    CRS, 
    BBox, 
    DataCollection,
    bbox_to_dimensions
)

INDICES_ALLOWED = {
    "ndvi": calculate_ndvi,
    "ndwi": calculate_ndwi
    }


def calculate_ndvi(bbox, start_date, end_date):
    config = get_sh_config()

    size = bbox_to_dimensions(bbox, resolution=60)  # 60m per pixel 

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
                time_interval=(start_date, end_date)
            )
        ],
        responses=[SentinelHubRequest.output_response(identifier="ndvi", response_format=MimeType.TIFF)],
        bbox=bbox,
        size=size,
        config=config
    )

    ndvi_data = request.get_data()[0].squeeze()
    # normalize for visualization
    vmin, vmax = np.nanpercentile(ndvi_data, [2, 98])
    filename = f"ndvi_{uuid.uuid4()}.png"

    return save_image(ndvi_data, filename, title="NDVI Index", vmin=vmin, vmax=vmax, cmap="RdYlGn", colorbar_label="NDVI")


def calculate_ndwi(bbox, *args):
    ...


def compare_images(path1, path2):
    '''
    Compare two rasters pixel-by-pixel with the same resolution, extent and projection (CRS)
    '''
    with rio_open(path1) as src1, rio_open(path2) as src2:
        # Check CRS compatibility
        if src1.crs != src2.crs:
            raise ValueError(f"CRS mismatch: {src1.crs} vs {src2.crs}")

        arr1 = src1.read(1).astype("float32")
        arr2 = src2.read(1).astype("float32")

        # Check same shape
        if arr1.shape != arr2.shape:
            raise ValueError(f"Shape mismatch: {arr1.shape} vs {arr2.shape}")

        diff_data = arr2 - arr1

    # Auto scale visualization
    vmin, vmax = np.percentile(diff_data, [2, 98])  # robust min/max
    filename = f"comparison_{uuid.uuid4()}.png"

    return save_image(diff_data, filename, title="Heatmap Index", vmin=vmin, vmax=vmax, cmap="RdBu", colorbar_label="Heatmap")
