
import numpy as np
import os
from groq import Groq

INDEX_CONTEXT = {
    "ndvi": {
        "name": "Vegetation Index (NDVI)",
        "thresholds": [
            (None, 0.2,  "(0-0.2) sparse/bare"),
            (0.2,  0.5,  "(0.2-0.5) moderate vegetation"),
            (0.5,  None, "(0.5-1.0) dense healthy vegetation"),
        ]
    },
    "ndmi": {
        "name": "Moisture Index (NDMI)",
        "thresholds": [
            (None, -0.1, "(-1.0- -0.1) dry/stressed vegetation"),
            (-0.1, 0.2,  "(-0.1-0.2) moderate moisture"),
            (0.2,  None, "(0.2-1.0) high moisture content"),
        ]
    }
}

def build_metrics_str(
    arr: np.ndarray,
    index: str,
    pct_nans: float,
    largest_fract_nans: float,
    start_date,
    end_date,
    lat_min, lat_max,
    lon_min, lon_max,
    # heatmap-only (optional)
    compare_start=None,
    compare_end=None,
) -> str:
    """
    Generate a formatted metrics summary string for satellite data analysis.
    
    Args:
        arr: NumPy array containing metric values.
        index: Index name (e.g., 'NDVI', 'LST').
        start_date: Start date of analysis period.
        end_date: End date of analysis period.
        lat_min, lat_max: Latitude bounds of region.
        lon_min, lon_max: Longitude bounds of region.
        compare_start, compare_end: Optional comparison dates (heatmap mode).
    
    Returns:
        Formatted string with index metadata, region bounds, mean value, missing data %,
        and threshold distribution (standard) or change areas (heatmap mode).
    
    Note:
        Heatmap mode activates when compare_start and compare_end are provided.
    """
    ctx = INDEX_CONTEXT.get(index.lower())
    if not ctx:
        raise ValueError(f"No INDEX_CONTEXT entry for index: {index}")

    is_heatmap = compare_start is not None
    mean_val   = np.nanmean(arr)               # NaNs ignored 
    valid      = np.sum(~np.isnan(arr))        # valid pixels
    lat_str = f"{abs(lat_min)}°{'N' if lat_min >= 0 else 'S'}–{abs(lat_max)}°{'N' if lat_max >= 0 else 'S'}"
    lon_str = f"{abs(lon_min)}°{'E' if lon_min >= 0 else 'W'}–{abs(lon_max)}°{'E' if lon_max >= 0 else 'W'}"

    date_section = (
        f"- Period A: {start_date} to {end_date}\n"
        f"- Period B (to compare): {compare_start} to {compare_end}"
        if is_heatmap else
        f"- Date range: {start_date} to {end_date}"
    )
    bucket_lines = []
    
    if not is_heatmap:
        # compute per-threshold bucket percentages
        bucket_lines = ["Thresholds: "]
        for low, high, label in ctx["thresholds"]:
            if low is None:
                mask = (arr < high) & ~np.isnan(arr)
            elif high is None:
                mask = (arr >= low) & ~np.isnan(arr)
            else:
                mask = (arr >= low) & (arr < high) & ~np.isnan(arr)
            pct = 100 * np.sum(mask) / valid
            bucket_lines.append(f"- {label}: {pct:.1f}%")

    # heatmap extras
    heatmap_section = ""
    if is_heatmap:
        gain_pct = 100 * np.sum(arr > 0) / valid
        loss_pct = 100 * np.sum(arr < 0) / valid
        heatmap_section = (
            f"\n- Area of increase: {gain_pct:.1f}%"
            f"\n- Area of decrease: {loss_pct:.1f}%"
            )

    return (
        f"- Index: {ctx['name']}\n"
        f"- Region: {lat_str}, {lon_str}\n"
        f"{date_section}\n"
        f"- Mean value: {mean_val:.3f}\n"
        f"- Missing data (before filling in the gaps with 'nearest neighbor'):\n"
        f"  max % of NaNs: {pct_nans:.2f}%\n"
        f"  largest fraction NaN area: {largest_fract_nans:.5f}\n"
        + "\n".join(bucket_lines)
        + heatmap_section
    )


def generate_ai_insight(metrics_str: str) -> str | None:
    """
    Generate a short AI-powered insight for a given index and metrics.
    Returns a string with the insight, or None on failure.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or not metrics_str:
        return None
     
    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a remote sensing expert. Interpret satellite index data and provide concise, actionable insights about land cover or environmental conditions. Do not repeat coordinates or dates from the metrics — focus on what the data means, not where or when it was collected."
                },
                {
                    "role": "user",
                    "content": f"Based on these metrics, provide a 2-sentence professional interpretation of the current conditions and any notable patterns (take the region into account):\n{metrics_str}"
                }
            ],
            max_tokens=150
        )
        return completion.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Groq API error: {e}")  
    
