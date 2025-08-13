"""
Firebase Authentication Middleware for BloodScan.
"""
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .authentication import FirebaseAuthentication
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

class FirebaseAuthMiddleware(MiddlewareMixin):
    """
    Middleware to authenticate users using Firebase tokens.
    """
    
    def process_request(self, request):
        """Process incoming request to authenticate user."""
        # Skip authentication for public endpoints
        public_paths = [
            '/health/',
            '/api/docs/',
            '/api/redoc/',
            '/api/schema/',
            '/admin/',
        ]
        
        if any(request.path.startswith(path) for path in public_paths):
            return None
            
        # Try Firebase authentication
        firebase_auth = FirebaseAuthentication()
        auth_result = firebase_auth.authenticate(request)
        
        if auth_result:
            user, token = auth_result
            request.user = user
            request.firebase_token = token
            logger.debug(f"Authenticated user: {user.username}")
        
        return None
