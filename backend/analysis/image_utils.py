import os
import numpy as np
from scipy import ndimage
import matplotlib.pyplot as plt
from django.conf import settings
from sentinelhub.geo_utils import bbox_to_dimensions

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
):
    """
    Save a high-quality image of an index (NDVI, NDWI, etc.). Return the relative path.
    """

    result_path = os.path.join(settings.MEDIA_ROOT, "results", filename) # <MEDIA_ROOT>/results/<img>.png
    os.makedirs(os.path.dirname(result_path), exist_ok=True) # ensure that path exist

    # Prepare figure
    plt.figure(figsize=figsize)
    
    # compute scaling (optionally)
    if vmin is None or vmax is None:
        # e.g. using 2nd and 98th percentiles (clipping outliers 2% in both sides)
        # to maintain better contrast
        vmin, vmax = np.percentile(data, [2, 98])
    
    img = plt.imshow(data, cmap=cmap, vmin=vmin, vmax=vmax)
    cbar = plt.colorbar(img, fraction=0.046, pad=0.04)
    cbar.set_label(colorbar_label, fontsize=12)
    cbar.ax.tick_params(labelsize=10)


    plt.title(title, fontsize=14)
    plt.axis('off')  # hide axes if you want a map-only look
    
    # save with high DPI
    plt.savefig(result_path, dpi=dpi, bbox_inches='tight', pad_inches=0.1)
    plt.close()

    rel = f"results/{filename}"
    return rel

def compute_safe_size(bbox, max_pixel_res=2500, resolution=60) -> tuple[int, int, int]:
    """
    If initial_resolution produces too-large image, increase resolution (coarser)
    until width/height <= MAX_PIXELS.
    """
    w, h = bbox_to_dimensions(bbox, resolution)

    if w <= max_pixel_res and h <= max_pixel_res:
        return (w, h, resolution)
    
    scale_w = w / max_pixel_res
    scale_h = h / max_pixel_res
    factor = max(scale_w, scale_h)

    # new resolution (round up))
    new_res = int(factor * resolution) + 1 
    new_w, new_h = bbox_to_dimensions(bbox, new_res)
    

    # safety loop: in case still marginally too large
    while new_w > max_pixel_res or new_h > max_pixel_res:
        new_res = int(factor * new_res * 1.2)
        new_w, new_h = bbox_to_dimensions(bbox, new_res)

    return (new_w, new_h, new_res)


def percentage_of_nans(arr) -> float:
    """ 
    Percent of NaN's in a 2D numpy array.
    Returns a float (0..100). 
    """
    return 100 * float(sum(np.isnan(arr)) / np.size(arr))

def largest_nan_area(arr) -> float:
    """ 
    Find the largest connected region of NaN's and returned its fraction of the image area (0..1).
    Uses a 8-neighbour connectivity by using 3x3 structuring elements of ones. 
    """ 
    mask = np.isnan(arr)    # boolean mask: True where NaN
    if not mask.any():      
        return 0.0          # return 0.0 in no NaNs
    
    labeled, ncomp = ndimage.label(mask, structure=np.ones((3, 3)))
    counts = ndimage.sum(mask, labeled, index=np.arange(1, ncomp))

    largest = counts.max()

    return float(largest / arr.size)

def nearest_neighbour_fill(arr) -> np.ndarray:
    """
    Fill NaN pixels by copying the value from the nearest non-NaN pixel.
    Returns a copy of the array with NaNs filled.
    """
    mask = np.isnan(arr)    # boolean mask: True where NaN
    if not mask.any():      
        return arr         
    
    # this function calculates the distance transform (Euclidean) of the input (from NaNs to non-NaNs)
    _, indices = ndimage.distance_transform_edt(mask, return_distances=True, return_indices=True)
    filled = arr.copy()
    filled[mask] = arr[tuple(indices[:, mask])]

    return filled
