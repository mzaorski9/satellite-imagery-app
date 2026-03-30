from rest_framework import serializers
from .models import AnalysisTask
import uuid
from django.utils import timezone
from .config import MAX_AOI_DEGREES


class AnalysisTaskSerializer(serializers.ModelSerializer):
    """
    Serializer for AnalysisTask - handles validation of coordinates,
    date ranges, comparison mode before task creation.
    """
    class Meta:
        model = AnalysisTask
        fields = "__all__"
        # users can’t set these via API
        read_only_fields = ("user", "task_id", "status", "result_url", "created_at", "updated_at", 
                            "pct_nans", "largest_nan_frac", "qc_warning", "qc_notes", "celery_id")  

    def create(self, validated_data):
        validated_data["task_id"] = uuid.uuid4().hex
        return super().create(validated_data)
    
    def validate(self, data):
        p_start = data["start_date"]
        p_end = data["end_date"]

        self._validate_date_ranges(start=p_start, end=p_end, prefix="Primary")
        self._validate_coords(data)

        if data["comparison"]:
            c_start = data["compare_start_date"]
            c_end = data["compare_end_date"]

            if not c_start or not c_end:
                raise serializers.ValidationError("Compare dates must be filled.")
            if p_end > c_start: 
                raise serializers.ValidationError("Dates cannot overlap.")
            if (p_end - p_start).days < 5:
                raise serializers.ValidationError("Date range must be at least 5 days to ensure satellite coverage.")
            if (c_end - c_start).days < 5:
                raise serializers.ValidationError("Compare date range must be at least 5 days to ensure satellite coverage.")
            
            self._validate_date_ranges(start=c_start, end=c_end, prefix="Compare")
            
        # return if data validated successfully
        return data
            
    def _validate_date_ranges(self, start, end, prefix=""):
        """Helper to prevent wrong date ranges."""
        now = timezone.now().date()
        if start > end:
            raise serializers.ValidationError({f"{prefix} date: {prefix} end date must be after start date."})
        elif end > now: 
            raise serializers.ValidationError("The end date cannot be set to a date greater than today.")

    def _validate_coords(self, data):
        """Validate coordinate ranges and logical consistency."""
        try:
            lat_min = float(data["lat_min"])
            lat_max = float(data["lat_max"])
            lon_min = float(data["lon_min"])
            lon_max = float(data["lon_max"])
        except (TypeError, ValueError):
            raise serializers.ValidationError("Coordinates must be valid numbers.")
        if not (-90 <= lat_min <= 90) or not (-90 <= lat_max <= 90):
            raise serializers.ValidationError("Latitude must be between -90 and 90.")
        if not (-180 <= lon_min <= 180) or not (-180 <= lon_max <= 180):
            raise serializers.ValidationError("Longitude must be between -180 and 180.")
        if lat_min >= lat_max:
            raise serializers.ValidationError("lat_min must be less than lat_max.")
        if lon_min >= lon_max:
            raise serializers.ValidationError("lon_min must be less than lon_max.")
        if (lat_max - lat_min) < 0.01 or (lon_max - lon_min) < 0.01:
            raise serializers.ValidationError("Selected area is too small (minimum ~1km).")
        if (lat_max - lat_min) > MAX_AOI_DEGREES or (lon_max - lon_min) > MAX_AOI_DEGREES:
            raise serializers.ValidationError(
                f"Selected area is too large. Maximum span is {MAX_AOI_DEGREES} degrees (~2000km)."
            )
    
    # auto field check
    def validate_analysis_type(self, value):
        return value.lower()

