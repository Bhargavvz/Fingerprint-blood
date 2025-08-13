"""
User serializers for BloodScan API.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'date_of_birth', 'profile_picture',
            'notifications_enabled', 'data_sharing_consent',
            'date_joined', 'last_login', 'last_active', 'is_active'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    success_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = UserProfile
        fields = [
            'known_blood_group', 'medical_conditions',
            'total_scans', 'successful_predictions', 'success_rate',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['total_scans', 'successful_predictions', 'created_at', 'updated_at']

class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with profile information."""
    
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone_number', 'date_of_birth', 'profile_picture',
            'notifications_enabled', 'data_sharing_consent',
            'date_joined', 'last_login', 'last_active', 'is_active',
            'profile'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']

class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user information."""
    
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone_number', 'date_of_birth',
            'profile_picture', 'notifications_enabled', 'data_sharing_consent',
            'profile'
        ]
    
    def update(self, instance, validated_data):
        """Update user and profile information."""
        profile_data = validated_data.pop('profile', None)
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update profile fields
        if profile_data:
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
        
        return instance
