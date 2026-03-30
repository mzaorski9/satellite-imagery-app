import os
import numpy as np
from scipy import ndimage
import matplotlib.pyplot as plt
from django.conf import settings
from sentinelhub.geo_utils import bbox_to_dimensions
from .config import (
    FAIL_NAN_FRACT,
    FAIL_PCT_NANS,
    WARN_NAN_FRACT,
    WARN_PCT_NANS
)

def save_image(
    data, 
    filename,
    title="Index", 
    cmap="RdYlGn", 
    vmin=None, 
    vmax=None, 
    colorbar_label=None,
    figsize=(10, 10), 
    dpi=300
) -> str:
    """
    Save a satellite index image as a high-quality PNG.

    Args:
        data: 2D numpy array of index values.
        filename: Output filename (e.g. 'ndvi_result.png').
        title: Plot title.
        cmap: Matplotlib colormap name.
        vmin, vmax: Color scale bounds. If None, computed from 2nd/98th percentiles.
        colorbar_label: Label for the colorbar axis.
        figsize: Figure size in inches.
        dpi: Output resolution.

    Returns:
        str: Relative file path (e.g. 'results/ndvi_result.png').
    """

    result_path = os.path.join(settings.MEDIA_ROOT, "results", filename) 
    os.makedirs(os.path.dirname(result_path), exist_ok=True) 
    plt.figure(figsize=figsize)
    
    # compute scaling (optionally)
    if vmin is None or vmax is None:
        # e.g. using 2nd and 98th percentiles (clipping outliers 2% in both sides)
        # to maintain better contrast
        vmin, vmax = np.percentile(data, [2, 98])
    
    # fill eventual NaNs with the mean value
    data = np.where(np.isnan(data), np.nanmean(data), data)

    img = plt.imshow(data, cmap=cmap, vmin=vmin, vmax=vmax)
    cbar = plt.colorbar(img, fraction=0.046, pad=0.04)
    cbar.set_label(colorbar_label, fontsize=12)
    cbar.ax.tick_params(labelsize=10)

    plt.title(title, fontsize=14)
    plt.axis('off')     
    
    # save with high DPI
    plt.savefig(result_path, dpi=dpi, bbox_inches='tight', pad_inches=0.1)
    plt.close()

    rel = f"results/{filename}"
    return rel

def compute_safe_size(bbox, max_pixel_res=2500, resolution=60) -> tuple[int, int, int]:
    """
    Compute safe image dimensions by adjusting resolution if necessary.
    
    If the initial resolution produces an image larger than max_pixel_res,
    progressively increases the resolution (coarser) until dimensions fit.
    
    Args:
        bbox: Bounding box for the region.
        max_pixel_res: Maximum allowed width/height in pixels (default: 2500).
        resolution: Initial resolution in meters (default: 60).
    
    Returns:
        tuple[int, int, int]: Width (px), height (px), and resolution (m/px).
    """
    w, h = bbox_to_dimensions(bbox, resolution)

    if w <= max_pixel_res and h <= max_pixel_res:
        return (w, h, resolution)
    
    scale_w = w / max_pixel_res
    scale_h = h / max_pixel_res
    factor = max(scale_w, scale_h)

    # new resolution (+1 added to round up)
    new_res = int(factor * resolution) + 1 
    new_w, new_h = bbox_to_dimensions(bbox, new_res)
    
    # safety loop: in case if the image is slightly too large
    while new_w > max_pixel_res or new_h > max_pixel_res:
        new_res = int(factor * new_res * 1.2)
        new_w, new_h = bbox_to_dimensions(bbox, new_res)

    return (new_w, new_h, new_res)

def percentage_of_nans(arr: np.ndarray) -> float:
    """ 
    Percent of NaN's in a 2D numpy array.
    Returns: float (0..100). 
    """
    return 100 * np.isnan(arr).sum() / arr.size

def largest_nan_area(arr: np.ndarray) -> float:
    """ 
    Finds the largest connected region of NaN's. Uses a 8-neighbour connectivity by using 3x3 structuring elements of ones. 
    Returns: fraction of NaN's of the image area (0..1).
    """ 
    mask = np.isnan(arr)    
    if not mask.any():      
        return 0.0          # no NaNs present
    
    labeled, ncomp = ndimage.label(mask, structure=np.ones((3, 3)))
    counts = ndimage.sum(mask, labeled, index=np.arange(1, ncomp + 1))
 
    largest = counts.max()

    return float(largest / arr.size)

def nearest_neighbour_fill(arr: np.ndarray) -> np.ndarray:
    """
    Fill NaN pixels by copying the value from the nearest non-NaN pixel.
    Returns: copy of the array with NaNs filled.
    """
    mask = np.isnan(arr)    

    # if no NaN or all fields are NaN
    if not mask.any() or mask.all():     
        return arr.copy()         
    
    # calculate the distance transform (Euclidean) of the input (from NaNs to non-NaNs)
    _, indices = ndimage.distance_transform_edt(mask, return_distances=True, return_indices=True)
    filled = arr.copy()
    filled[mask] = arr[tuple(indices[:, mask])]

    return filled

def validate_and_subtract_images(image_a: np.ndarray, image_b: np.ndarray) -> np.ndarray:
    """
    Validates and subtracts two 2D NumPy arrays representing image data.
    Returns: element-wise difference (image_a - image_b)
    """
    if image_a.shape != image_b.shape:
        raise ValueError(f"Image shapes do not match: {image_a.shape} != {image_b.shape}")

    if not (np.issubdtype(image_a.dtype, np.floating) and np.issubdtype(image_b.dtype, np.floating)):
        raise TypeError("Input arrays must be of a floating-point data type.")

    diff = image_a - image_b

    # suppress noise — differences below 0.1 are within measurement uncertainty
    diff[np.abs(diff) < 0.1] = 0

    # clip to ±0.8 to remove outliers (artifacts from cloud masking/NaN filling)
    # and improve colormap contrast — extreme values at ±1.0 are rarely real change
    diff = np.clip(diff, -0.8, 0.8)

    return diff


def apply_quality_control(pct_n: float, 
                          fract_n: float, 
                          name: str = "Image"
) -> tuple[str, str|None, str|None]:
    """
    Check image quality against NaN thresholds defined in config.py.

    Args:
        pct_n: Percentage of NaN pixels (0-100).
        fract_n: Largest connected NaN region as fraction of total image (0-1).
        name: Image label used in QC notes (e.g. "Image 1", "Image 2").

    Returns:
        tuple: (status, qc_note, message) where:
            - status: "FAILED" if quality too low, "WARN" if borderline, "PASS" if clean.
            - qc_note: Technical note with exact values and thresholds, or None.
            - message: User-facing message explaining the issue, or None.
    """
    status = "PASS"
    qc_note = None
    msg = None

    if pct_n > FAIL_PCT_NANS:
        status = "FAILED"
        qc_note = f"{name} - Percent of NaNs: {pct_n:.0f}% -> (Threshold: {FAIL_PCT_NANS:.0f}%)."
        msg = "Very high percentage of missing data. Try different dates."  

    elif fract_n > FAIL_NAN_FRACT:
        status = "FAILED"
        qc_note = f"{name} - Largest hole fraction: {fract_n:.2f} -> (Threshold: {FAIL_NAN_FRACT:.2f})"
        msg = "Large continuous block of missing data. Try different dates."     

    elif pct_n > WARN_PCT_NANS or fract_n > WARN_NAN_FRACT:
        status = "WARN"
        qc_note = f"{name} - Image used but NaNs filled. Percent of NaNs: {pct_n:.0f}%, largest hole: {fract_n:.2f}"
        msg = "High percentage of missing data. Image quality might be low."

    return status, qc_note, msg 


