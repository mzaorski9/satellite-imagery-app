from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

AUTH_USER = settings.AUTH_USER_MODEL
ANALYSIS_CHOICES = [
    ("ndvi", "NDVI"),
    ("ndmi", "NDMI"),
]

class User(AbstractUser):
    email = models.EmailField(unique=True)
    bio = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)

    def __str__(self):
        return self.username
    
class UserSettings(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="settings"     # allows access via user.settings
    )
    # defaults
    default_analysis = models.CharField(max_length=20, choices=ANALYSIS_CHOICES, default="ndvi")
    default_date_days = models.PositiveIntegerField(default=14)
    default_comparison = models.BooleanField(default=False)
    # UI
    dark_mode = models.BooleanField(default=False)  # reserved for future use
    # rest
    timezone = models.CharField(max_length=50, default="UTC")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    


