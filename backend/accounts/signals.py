
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import UserSettings

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_settings(sender, instance, created, **kwargs):
    """Create a UserSettings instance when a User is created."""
    if created:
        print(f"DEBUG: Creating settings for new user {instance.username}") # Add this for testing

        UserSettings.objects.create(user=instance)
