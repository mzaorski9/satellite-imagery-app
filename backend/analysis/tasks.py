
from celery import shared_task
from celery.exceptions import SoftTimeLimitExceeded
from sentinelhub import BBox, CRS
from sentinelhub.exceptions import DownloadFailedException
from django.utils import timezone
from django.conf import settings
from .indices import calculate_index
from .image_utils import(
    save_image, 
    validate_and_subtract_images, 
    percentage_of_nans,
    largest_nan_area,
    apply_quality_control,
    nearest_neighbour_fill
)
from .ai_utils import(
    build_metrics_str,
    generate_ai_insight
    )                    

@shared_task(bind=True, 
             autoretry_for=(DownloadFailedException,),  # retry if download fails
             retry_backoff=True,
             retry_kwargs={'max_retries': 3},
             default_retry_delay=60) 
def start_task(self, task_id: str) -> None:
    """
    Execute an AnalysisTask identified by ``task_id``.

    This Celery task performs the requested satellite analysis, updates the
    corresponding ``AnalysisTask`` database record (status, result URL, error
    information), and persists all results to storage.

    The task is executed asynchronously and **does not return a value**.
    Consumers should inspect the ``AnalysisTask`` model to obtain the final
    status and result.

    Args:
        task_id (str): Identifier of the ``AnalysisTask`` to execute.

    Returns:
        None
    """
    from .models import AnalysisTask 

    try:
        task = AnalysisTask.objects.get(task_id=task_id)
    except AnalysisTask.DoesNotExist:
        raise ValueError(f"No task found with ID {task_id}")

    try:
        task.status = "RUNNING"
        task.save(update_fields=["status"])

        # all dates are returned as datetime.datetime object
        coords = [task.lon_min, task.lat_min, task.lon_max, task.lat_max] 
        analysis_type = task.analysis_type
        start_date = task.start_date
        end_date = task.end_date
        compare_start = task.compare_start_date
        compare_end = task.compare_end_date
        comparison = task.comparison


        # CRS - Coordinate Reference System (WSG84 - Wordld Geodetic System using
        # angular coordinates of latitude and longitude to define locations)
        bbox = BBox(bbox=coords, crs=CRS.WGS84)
        
        status = "SUCCESS"
        qc_notes = []
        messages = []
        index = analysis_type.upper()

        # no heatmap
        if not comparison:
            raw_arr = calculate_index(index, bbox, start_date, end_date)
  
            # NaN stats for AI metrics and to store in db
            pct_nans = percentage_of_nans(raw_arr)
            fract_nans = largest_nan_area(raw_arr)
        
            task.pct_nans = pct_nans
            task.largest_nan_frac = fract_nans

            status, note, msg = apply_quality_control(pct_nans, fract_nans)

            res_arr = nearest_neighbour_fill(raw_arr)

            # fill containers with notes and filter them (no None)
            temp_notes = [n for n in (task.qc_notes, note) if n]
            qc_notes += temp_notes

            if msg:
                messages.append(msg)

            if status == "FAILED":    
                task.status = "FAILED"
                task.error_code = "QC_FAILED" 
                task.error_msg = msg if msg else ""
                task.qc_notes = "; ".join(n for n in qc_notes)
                task.save(update_fields=['status', 'error_code', 'error_msg', 'updated_at', 'qc_notes',
                                         'pct_nans', 'largest_nan_frac']) 
                return
            
            filename = f"{index}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.png"
            relative_path = save_image(data=res_arr, 
                                    filename=filename, 
                                    title=f"{index} Index", 
                                    cmap="RdYlGn", 
                                    vmin=-1,
                                    vmax=1,
                                    colorbar_label=f"{index}",
                                    figsize=(10, 10),
                                    dpi=300)
            
        # heatmap
        else:
            arr1 = calculate_index(index, bbox, start_date, end_date)
            arr2 = calculate_index(index, bbox, compare_start, compare_end)
            
            raw_pct_n1, raw_pct_n2 = percentage_of_nans(arr1), percentage_of_nans(arr2)
            raw_fract_n1, raw_fract_n2 = largest_nan_area(arr1), largest_nan_area(arr2)

            # worst-case NaN stats stored in DB
            task.pct_nans = max(raw_pct_n1, raw_pct_n2)
            task.largest_nan_frac = max(raw_fract_n1, raw_fract_n2)

            # subtract images before filling NaN values 
            raw_arr = validate_and_subtract_images(arr1, arr2)

            # NaN stats used for AI metrics
            pct_nans = percentage_of_nans(raw_arr)
            fract_nans = largest_nan_area(raw_arr)

            status1, note1, msg1 = apply_quality_control(raw_pct_n1, raw_fract_n1, "Image 1")
            status2, note2, msg2 = apply_quality_control(raw_pct_n2, raw_fract_n2, "Image 2")

            # fill all NaNs
            res_arr = nearest_neighbour_fill(raw_arr)
            temp_notes = [task.qc_notes, note1, note2]

            # fill containers with notes and filter them (no Nones)
            for note in temp_notes:
                if note and note not in qc_notes:
                    qc_notes.append(note)

            temp_messages = [m for m in (msg1, msg2) if m]
            messages += temp_messages

            if status1 == "FAILED" or status2 == "FAILED":
                task.status = "FAILED"
                task.error_code = "QC_FAILED" 
                task.error_msg = "|".join(m for m in messages)
                task.qc_notes = "; ".join(n for n in qc_notes)
                task.save(update_fields=['status', 'error_code', 'error_msg', 'updated_at', 'qc_notes',
                                         'pct_nans', 'largest_nan_frac']) 
                return 
            

            filename = f"comparison_{index}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.png"
            relative_path = save_image(data=res_arr, 
                                    filename=filename, 
                                    title=f"Heatmap Index [{index}]", 
                                    cmap="RdBu",
                                    vmin=-0.8,
                                    vmax=0.8,  
                                    colorbar_label="Change index (negative → decrease, positive → increase)",
                                    figsize=(10, 10),
                                    dpi=300)
            
        # build URL
        media_url = settings.MEDIA_URL
        if not media_url.endswith("/"):
            media_url += "/"    
        absolute_url = media_url + relative_path    # /media/results/<imageName>
        
        # if success/success with warnings
        task.status = "SUCCESS"
        task.result_url = absolute_url
        task.qc_warning = "|".join(m for m in messages)
        task.qc_notes = "; ".join(n for n in qc_notes)
        task.save(update_fields=['status', 'result_url', 'qc_warning', 'qc_notes', 'updated_at',
                                 'pct_nans', 'largest_nan_frac'])

        # build AI prompt
        metrics_str = build_metrics_str(
            arr=raw_arr,
            index=index,
            pct_nans=pct_nans,
            largest_fract_nans=fract_nans,
            start_date=start_date,
            end_date=end_date,
            lat_min=coords[1], lat_max=coords[3],
            lon_min=coords[0], lon_max=coords[2],
            # for heatmap only:
            compare_start=compare_start,
            compare_end=compare_end,
        )        

        generate_ai_comment_task.delay(task_id, metrics_str)

    except DownloadFailedException as exc:
        task.status = "FAILED"
        task.error_code = "API_REMOTE_ERROR" 
        task.error_msg = str(exc)
        task.save(update_fields=['status', 'error_code', 'error_msg', 'updated_at',
                                 'pct_nans', 'largest_nan_frac']) 
        raise

    except Exception as exc:
        task.status = "FAILED"
        task.error_code = "INTERNAL_ERROR" 
        task.error_msg = str(exc)
        task.save(update_fields=['status', 'error_code', 'error_msg', 'updated_at',
                                 'pct_nans', 'largest_nan_frac']) 
        raise
        

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={'max_retries': 3},
    default_retry_delay=10,
    soft_time_limit=15,
    time_limit=20
)
def generate_ai_comment_task(self, task_id: str, metrics_str: str) -> None:
    """
    Asynchronous Celery task that generates an AI-powered insight comment for an analysis task.

    Args:
        task_id (str): The unique identifier of the AnalysisTask to update.
        metrics_str (str): A string representation of metrics data to be analyzed by the AI.
    
    Returns:
        None
    """
    from .models import AnalysisTask
    try:
        insight = generate_ai_insight(metrics_str)
        AnalysisTask.objects.filter(task_id=task_id).update(ai_insight=insight)
    except SoftTimeLimitExceeded:
        # AI comment provider does not response - skip 
        AnalysisTask.objects.filter(task_id=task_id).update(
            ai_insight="Analysis unavailable - request timeout..."
        )
    except Exception:
        raise   # triggers autoretry (up to 'max_retries')
