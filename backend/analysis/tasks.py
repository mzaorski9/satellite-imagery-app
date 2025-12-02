from celery import shared_task
from sentinelhub import BBox, CRS
import os
from .indices import compare_images, INDICES_ALLOWED
from django.utils.timezone import now
from django.conf import settings

@shared_task(bind=True) 
# The bind argument means that the function will be a “bound method” so that 
# you can access attributes and methods on the task type instance (Task class)
def start_task(self, task_id):
    """Run the AnalysisTask identified by task_id: generate (or compare) images, update the task, and return the result URL.
    Args:
        task_id (int | str): Identifier of the AnalysisTask to run.
    Returns:
        str: Absolute URL of the generated result image.
    Raises:
        ValueError: If no AnalysisTask is found.
        KeyError: If analysis_type is unknown.
    """
    from .models import AnalysisTask 
    
    task = AnalysisTask.objects.filter(task_id=task_id).first()
    if not task:
        raise ValueError(f"No task found with ID {task_id}")

    coords = [task.lon_min, task.lat_min, task.lon_max, task.lat_max] # !
    analysis_type = task.analysis_type
    start_date = task.start_date
    end_date = task.end_date
    compare_start = task.compare_start_date
    compare_end = task.compare_end_date
    comparison = task.comparison

    generate_image_func = INDICES_ALLOWED.get(analysis_type)
    if not generate_image_func:
        raise KeyError(f"Unknown analysis type: {analysis_type}") 
    # CRS - Coordinate Reference System (WSG84 - Wordld Geodetic System using
    # angular coordinates of latitude and longitude to define locations)
    bbox = BBox(bbox=coords, crs=CRS.WGS84)

    if not comparison:
        print("NOT SCOPE")
        _, relative_path = generate_image_func(bbox, start_date, end_date)
        print("REL PATH", relative_path)
    else:
        arr1, _ = generate_image_func(bbox, start_date, end_date, save=False)
        arr2, _ = generate_image_func(bbox, compare_start, compare_end, save=False)
        relative_path = compare_images(arr1, arr2)

    media_url = settings.MEDIA_URL
    if not media_url.endswith("/"):
        media_url += "/"
    absolute_url = media_url + relative_path # /media/results/<imageName>

    AnalysisTask.objects.filter(celery_id=self.request.id).update(
        status="SUCCESS",
        result_url=absolute_url,
        updated_at=now() # or just objects.get() query, update fields and then .save()
        )

    return absolute_url # optional

    
    
