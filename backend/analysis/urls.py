from django.urls import path
from .views import init_task, check_task_status, home, TasksView, SubmitTask, TaskDetail, DeleteTask

urlpatterns = [
    path('', home, name='home'),
    path('tasks/init_task/', SubmitTask.as_view(), name='init_task'),
    path('tasks/check_task/<str:task_id>/', TaskDetail.as_view(), name='check_task_status'),
    path('tasks/show_tasks/', TasksView.as_view(), name='tasks_view'),
    path('tasks/delete_task/<str:task_id>/', DeleteTask.as_view(), name='delete_task')
    ]