
from django.db import models

class AnalysisTask(models.Model):
    
    # the first element in the tuple is the value to be set on the model,
    # the second - human readable name
    ANALYSIS_CHOICES = [
        ("ndvi", "NDVI"),
        ("evi", "EVI"),
        ("ndwi", "NDWI"),
    ]

    task_id = models.CharField(max_length=255, unique=True, editable=False)
    analysis_type = models.CharField(max_length=10, choices=ANALYSIS_CHOICES)
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
    status = models.CharField(max_length=50, default="PENDING")
    result_url = models.TextField(null=True, blank=True)            
    created_at = models.DateTimeField(auto_now_add=True)            # auto-add at creation
    updated_at = models.DateTimeField(auto_now=True)                # auto if save() is used
    error_msg = models.CharField(blank=True, default='')
    error_code = models.CharField(max_length=50, blank=True, default='')
    # qc (quality control) fields:
    pct_nans = models.FloatField(blank=True, null=True)             # percent of NaNs
    largest_nan_frac = models.FloatField(blank=True, null=True)     # fraction (0..1) largest connected NaN region
    qc_warning = models.CharField(max_length=256, blank=True, null=True)
    qc_notes = models.TextField(blank=True, null=True)


    def __str__(self):
        return f"{self.analysis_type} ({self.start_date}–{self.end_date}) - {self.status}"
