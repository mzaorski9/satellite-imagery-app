from django.conf import settings
from rest_framework.views import APIView, Response, status
from .tasks import start_task
from .serializers import AnalysisTaskSerializer
from .models import AnalysisTask


class SubmitTask(APIView):
    """Handle submission of analysis tasks and enqueue a Celery job."""
    def post(self, request):
        print(request.data)
        serializer = AnalysisTaskSerializer(data=request.data)  # obj
        if serializer.is_valid():
            result_obj = serializer.save(status="PENDING")      # .save() uses 'validated_data' by default

            celery_task = start_task.delay(result_obj.task_id)  # AsyncResult obj
            
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
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TaskDetail(APIView):
    """Retrieve details for a single analysis task by task_id."""
    def get(self, request, task_id):
        try:
            task = AnalysisTask.objects.get(task_id=task_id)
        except AnalysisTask.DoesNotExist:
            return Response({"error": f"Task ID: {task_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AnalysisTaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TasksView(APIView):
    """List all analysis tasks, newest first."""
    def get(self, request):
        tasks = AnalysisTask.objects.all().order_by("-created_at")
        serializer = AnalysisTaskSerializer(tasks, many=True) # many=True for list of items
        return Response(serializer.data, status=status.HTTP_200_OK)

class DeleteTask(APIView):
    """Delete an analysis task identified by task_id."""
    def delete(self, request, task_id):
        try:
            task = AnalysisTask.objects.get(task_id=task_id)
        except AnalysisTask.DoesNotExist:
            return Response({"error": f"Task ID: {task_id} not found."}, status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)    
