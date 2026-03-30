
from django.db import models
from django.conf import settings
from .config import PENDING_TIMEOUT
from django.utils import timezone


ANALYSIS_CHOICES = [
    ("ndvi", "NDVI"),
    ("ndmi", "NDMI"),
]

STATUS_CHOICES = [
    ("PENDING", "Pending"),
    ("SUCCESS", "Success"),
    ("FAILED", "Failed"),
    ("RUNNING", "Running")
]

class AnalysisTask(models.Model):
    """
    Represents a single satellite analysis request submitted by a user.

    Stores all input parameters (coordinates, dates, index type), tracks the
    Celery task lifecycle (status, celery_id), and holds the final result
    (result_url, ai_insight) along with quality control metrics (pct_nans,
    largest_nan_frac, qc_warning, qc_notes).

    Status lifecycle: PENDING → RUNNING → SUCCESS | FAILED
    """
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="tasks"
    )
    task_id = models.CharField(max_length=255, unique=True, editable=False)
    analysis_type = models.CharField(max_length=16, choices=ANALYSIS_CHOICES)
    lat_min = models.FloatField()
    lat_max = models.FloatField()
    lon_min = models.FloatField()
    lon_max = models.FloatField()
    start_date = models.DateField()
    end_date = models.DateField()
    compare_start_date = models.DateField(null=True, blank=True)
    compare_end_date = models.DateField(null=True, blank=True)
    comparison = models.BooleanField(default=False)
    celery_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="PENDING")
    result_url = models.TextField(max_length=500, null=True, blank=True)            
    created_at = models.DateTimeField(auto_now_add=True)                    # auto-add at creation
    updated_at = models.DateTimeField(auto_now=True)                        # auto-update after saving
    error_msg = models.CharField(blank=True, default='')
    error_code = models.CharField(max_length=50, blank=True, default='')
    # QC (quality control) fields:
    pct_nans = models.FloatField(blank=True, null=True)                     # percent of NaNs
    largest_nan_frac = models.FloatField(blank=True, null=True)             # fraction (0..1) largest connected NaN region
    qc_warning = models.CharField(max_length=256, blank=True, null=True)
    qc_notes = models.TextField(blank=True, null=True)
    ai_insight = models.TextField(null=True, blank=True)

    def normalize_state(self):
        """Check for timeouts and update status if necessary."""
        if self.status == "PENDING":
            if timezone.now() - self.created_at > PENDING_TIMEOUT:
                self.status = "FAILED"
                self.error_code = "WORKER_TIMEOUT" 
                self.error_msg = "The task could not be processed."
                self.save(update_fields=['status', 'error_code', 'error_msg', 'updated_at']) 

    def __str__(self):
        return f"{self.analysis_type} ({self.start_date}–{self.end_date}) - {self.status}"
