from rest_framework import serializers
from .models import AnalysisTask
import uuid

class AnalysisTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisTask
        fields = "__all__"
        # read_only_fields > users can’t set these via API
        read_only_fields = ("task_id", "status", "result_url", "created_at", "updated_at",
                            "pct_nans", "largest_nan_frac", "qc_warning", "qc_notes", "celery_id") 

    def create(self, validated_data):
        validated_data["task_id"] = uuid.uuid4().hex
        return super().create(validated_data)
    
    