"""
Firebase Authentication implementation for BloodScan.
"""
import firebase_admin
from firebase_admin import credentials, auth
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class FirebaseAuthentication(BaseAuthentication):
    """
    Firebase Authentication for DRF.
    Validates Firebase ID tokens and creates/retrieves Django users.
    """
    
    def authenticate(self, request):
        """
        Authenticate user using Firebase ID token.
        """
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        id_token = auth_header.split(' ')[1]
        
        try:
            # Initialize Firebase Admin SDK if not already done
            if not firebase_admin._apps:
                self._initialize_firebase()
                
            # Verify the ID token
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            name = decoded_token.get('name', '')
            
            # Get or create Django user
            user, created = User.objects.get_or_create(
                username=uid,
                defaults={
                    'email': email,
                    'first_name': name.split(' ')[0] if name else '',
                    'last_name': ' '.join(name.split(' ')[1:]) if name and ' ' in name else '',
                    'is_active': True,
                }
            )
            
            # Update user info if needed
            if not created:
                if user.email != email and email:
                    user.email = email
                if user.first_name != name.split(' ')[0] if name else '':
                    user.first_name = name.split(' ')[0] if name else ''
                    user.last_name = ' '.join(name.split(' ')[1:]) if name and ' ' in name else ''
                user.save()
            
            logger.info(f"User authenticated: {user.username}")
            return (user, decoded_token)
            
        except Exception as e:
            logger.error(f"Firebase authentication failed: {str(e)}")
            raise AuthenticationFailed('Invalid authentication credentials.')
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            if settings.FIREBASE_CONFIG.get('CREDENTIALS_PATH'):
                cred = credentials.Certificate(settings.FIREBASE_CONFIG['CREDENTIALS_PATH'])
            else:
                # Use default credentials (for cloud deployment)
                cred = credentials.ApplicationDefault()
                
            firebase_admin.initialize_app(cred, {
                'databaseURL': settings.FIREBASE_CONFIG.get('DATABASE_URL', ''),
                'storageBucket': settings.FIREBASE_CONFIG.get('STORAGE_BUCKET', ''),
            })
            logger.info("Firebase Admin SDK initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {str(e)}")
            raise
