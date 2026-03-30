
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.contrib.auth import get_user_model
from .models import UserSettings

# get default django User, or that set in AUTH_USER_MODEL
User = get_user_model() 

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=User.objects.all())])
    # write_only: values kept in validated_data, not included in the serialized output
    password = serializers.CharField(write_only=True) 
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "password2")

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)
    
class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = "__all__"
        read_only_fields = ("created_at", "updated_at", "user")


class UserSerializer(serializers.ModelSerializer):
    # nested serializer to retrieve user settings easier on the frontend 
    # via "user.settings.[...]"
    settings = UserSettingsSerializer(read_only=True)
    class Meta:
        model = User
        fields = ("id", "username", "email", "bio", "profile_image", "settings")


