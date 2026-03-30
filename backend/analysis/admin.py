
from django.contrib import admin
from .models import AnalysisTask

@admin.register(AnalysisTask)
class AnalysisTaskAdmin(admin.ModelAdmin):
    list_display = ('task_id', 'user', 'status', 'analysis_type', 'created_at')
    list_filter = ('status', 'analysis_type', 'created_at')
    search_fields = ('task_id', 'user__username')
