"""
Authentication views for BloodScan API.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .authentication import FirebaseAuthentication
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_token(request):
    """
    Verify Firebase ID token and return user information.
    """
    try:
        firebase_auth = FirebaseAuthentication()
        auth_result = firebase_auth.authenticate(request)
        
        if not auth_result:
            return Response(
                {'error': 'No authentication credentials provided'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        user, token = auth_result
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
            },
            'firebase_uid': token.get('uid'),
            'token_valid': True,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        return Response(
            {'error': 'Token verification failed', 'details': str(e)},
            status=status.HTTP_401_UNAUTHORIZED
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def create_custom_token(request):
    """
    Create a custom token for testing purposes.
    Note: This should only be used in development/testing.
    """
    try:
        from firebase_admin import auth
        uid = request.data.get('uid')
        additional_claims = request.data.get('claims', {})
        
        if not uid:
            return Response(
                {'error': 'UID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        custom_token = auth.create_custom_token(uid, additional_claims)
        
        return Response({
            'custom_token': custom_token.decode('utf-8'),
            'uid': uid,
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        logger.error(f"Custom token creation failed: {str(e)}")
        return Response(
            {'error': 'Failed to create custom token', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def user_profile(request):
    """
    Get current user profile information.
    """
    try:
        user = request.user
        
        if not user.is_authenticated:
            return Response(
                {'error': 'User not authenticated'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined,
                'last_login': user.last_login,
                'is_active': user.is_active,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"User profile retrieval failed: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user profile', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
