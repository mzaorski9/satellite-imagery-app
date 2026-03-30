
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, MeView, UserSettingsView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'), 
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='refresh_token'),
    
    # user profile
    path('me/', MeView.as_view(), name='me_view'),

    # user preferences (dark mode, analysis type etc.)
    path('me/settings/', UserSettingsView.as_view(), name='settings_view') 
    ]

