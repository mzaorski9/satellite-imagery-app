import os
from celery import Celery

# it tells django where to find the settings it will use in the project
# (DJANGO_SETTINGS_MODULE is built-in django attribute)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'satellite_app.settings') 
app = Celery('satellite_app')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()