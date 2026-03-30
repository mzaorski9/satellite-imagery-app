
# Create your views here.
from rest_framework.generics import CreateAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView, Response, status
from .serializers import RegisterSerializer, UserSerializer, UserSettingsSerializer
from django.contrib.auth import get_user_model



User = get_user_model()

class RegisterView(CreateAPIView):          # POST
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

class MeView(RetrieveAPIView):              # GET
    serializer_class = UserSerializer  
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
    
class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = request.user.settings 
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data)
    
    def patch(self, request):
        settings = request.user.settings
        serializer = UserSettingsSerializer(
            settings,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
                
        return Response(serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
        )



    
