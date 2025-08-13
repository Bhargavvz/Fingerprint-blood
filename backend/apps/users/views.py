"""
User views for BloodScan API.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import UserProfile
from .serializers import UserDetailSerializer, UserUpdateSerializer
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve and update user profile.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def get_serializer_class(self):
        if self.request.method == 'PUT' or self.request.method == 'PATCH':
            return UserUpdateSerializer
        return UserDetailSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics(request):
    """
    Get user statistics and analytics.
    """
    try:
        user = request.user
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        stats = {
            'user_info': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'member_since': user.date_joined,
                'last_active': user.last_active,
            },
            'prediction_stats': {
                'total_scans': profile.total_scans,
                'successful_predictions': profile.successful_predictions,
                'success_rate': profile.success_rate,
            },
            'account_status': {
                'is_active': user.is_active,
                'notifications_enabled': user.notifications_enabled,
                'data_sharing_consent': user.data_sharing_consent,
            }
        }
        
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"User statistics error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user statistics', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_preferences(request):
    """
    Update user preferences.
    """
    try:
        user = request.user
        
        # Update user preferences
        if 'notifications_enabled' in request.data:
            user.notifications_enabled = request.data['notifications_enabled']
        
        if 'data_sharing_consent' in request.data:
            user.data_sharing_consent = request.data['data_sharing_consent']
        
        user.save()
        
        # Update profile preferences
        profile, created = UserProfile.objects.get_or_create(user=user)
        
        if 'known_blood_group' in request.data:
            profile.known_blood_group = request.data['known_blood_group']
        
        if 'medical_conditions' in request.data:
            profile.medical_conditions = request.data['medical_conditions']
        
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Preferences updated successfully',
            'preferences': {
                'notifications_enabled': user.notifications_enabled,
                'data_sharing_consent': user.data_sharing_consent,
                'known_blood_group': profile.known_blood_group,
                'medical_conditions': profile.medical_conditions,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Preference update error: {str(e)}")
        return Response(
            {'error': 'Failed to update preferences', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Soft delete user account.
    """
    try:
        user = request.user
        
        # Soft delete by deactivating account
        user.is_active = False
        user.save()
        
        logger.info(f"User account deactivated: {user.username}")
        
        return Response({
            'success': True,
            'message': 'Account has been deactivated successfully'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Account deletion error: {str(e)}")
        return Response(
            {'error': 'Failed to delete account', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_activity(request):
    """
    Update user last activity timestamp.
    """
    try:
        user = request.user
        user.update_last_active()
        
        return Response({
            'success': True,
            'last_active': user.last_active
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Activity update error: {str(e)}")
        return Response(
            {'error': 'Failed to update activity', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
