from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView, Response, status
from .tasks import start_task
from .serializers import AnalysisTaskSerializer
from .models import AnalysisTask
from .config import PENDING_TIMEOUT



class SubmitTask(APIView):
    """Handle submission of analysis tasks and enqueue a Celery job."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AnalysisTaskSerializer(data=request.data)  
        serializer.is_valid(raise_exception=True)
        
        result_obj = serializer.save(user=request.user, status="PENDING") 

        celery_task = start_task.delay(result_obj.task_id)  
        
        result_obj.celery_id = celery_task.id               # id received immediately
        result_obj.save(update_fields=['celery_id'])
        
        return Response(
            {
                "id": result_obj.task_id,
                "status": celery_task.status,
                "celery_id": result_obj.celery_id,
                "message": "Task submitted successfully."
            },
            status=status.HTTP_201_CREATED
        )

class TaskDetail(APIView):
    """Retrieve details for a single analysis task by task_id."""
    
    permission_classes = [IsAuthenticated]

    def get(self, request, task_id):
        try:
            task = AnalysisTask.objects.get(task_id=task_id, user=request.user)
        except AnalysisTask.DoesNotExist:
            return Response({"error": f"Task ID: {task_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        
        task.normalize_state()

        serializer = AnalysisTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TasksView(APIView):
    """List all analysis tasks, newest first."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        # bulk-normalize time-out PENDING tasks across all users before returning results
        # note: SQL UPDATE used instead of normalize_state() to avoid N+1 queries
        timeout_treshold = timezone.now() - PENDING_TIMEOUT
        AnalysisTask.objects.filter(
            status="PENDING",
            created_at__lt=timeout_treshold,
        ).update(
            status="FAILED",
            error_code="WORKER_TIMEOUT", 
            error_msg="The task could not be processed."
        )
        tasks = AnalysisTask.objects.filter(user=request.user).order_by("-created_at")
        
        serializer = AnalysisTaskSerializer(tasks, many=True)  

        return Response(serializer.data, status=status.HTTP_200_OK)

class DeleteTask(APIView):
    """Delete an analysis task identified by task_id."""

    permission_classes = [IsAuthenticated]

    def delete(self, request, task_id):
        try:
            task = AnalysisTask.objects.get(task_id=task_id, user=request.user)
        except AnalysisTask.DoesNotExist:
            return Response({"error": f"Task ID: {task_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)    

