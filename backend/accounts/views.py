
# Create your views here.
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model


User = get_user_model()

class RegisterView(CreateAPIView): # POST
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class MeView(RetrieveAPIView):  # GET
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer  

    def get_object(self):
        return self.request.user
    
