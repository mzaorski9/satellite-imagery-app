import os
import matplotlib.pyplot as plt
from django.conf import settings


def save_image(data, filename, title="Index", vmin=-1, vmax=1, cmap="RdYlGn", colorbar_label=None):
    """
    Save a 2D array as a colorized image to MEDIA/results.
    Return the result path.
    """
    result_path = os.path.join(settings.MEDIA_ROOT, "results", filename) # <MEDIA_ROOT>/results/<img>.png
    os.makedirs(os.path.dirname(result_path), exist_ok=True) # ensure that path exist

    plt.imshow(data, cmap, vmin, vmax)
    plt.colorbar(colorbar_label, orientation="right")
    plt.title(title)
    plt.savefig(result_path, dpi=150)
    plt.close()

    return result_path