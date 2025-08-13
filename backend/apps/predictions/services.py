"""
Firestore service for BloodScan predictions.
"""
import logging
from google.cloud import firestore
from django.conf import settings
from .models import Prediction, PredictionHistory
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class FirestoreService:
    """
    Service class for Firestore operations.
    """
    
    _client = None
    
    @classmethod
    def get_client(cls):
        """Get Firestore client instance."""
        if cls._client is None:
            try:
                cls._client = firestore.Client(
                    project=settings.FIREBASE_CONFIG.get('PROJECT_ID')
                )
                logger.info("Firestore client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Firestore client: {str(e)}")
                raise
        return cls._client
    
    @classmethod
    def sync_prediction(cls, prediction):
        """
        Sync prediction to Firestore.
        """
        try:
            client = cls.get_client()
            
            # Prepare prediction data
            prediction_data = {
                'id': str(prediction.id),
                'user_id': str(prediction.user.id),
                'predicted_blood_group': prediction.predicted_blood_group,
                'confidence_score': prediction.confidence_score,
                'prediction_method': prediction.prediction_method,
                'image_hash': prediction.image_hash,
                'image_size': prediction.image_size,
                'image_dimensions': prediction.image_dimensions,
                'model_version': prediction.model_version,
                'processing_time': prediction.processing_time,
                'alternative_predictions': prediction.alternative_predictions,
                'confidence_breakdown': prediction.confidence_breakdown,
                'accuracy_level': prediction.accuracy_level,
                'created_at': prediction.created_at.isoformat(),
                'updated_at': prediction.updated_at.isoformat(),
                'user_rating': prediction.user_rating,
                'user_feedback': prediction.user_feedback,
                'is_verified': prediction.is_verified,
            }
            
            # Store in Firestore
            doc_ref = client.collection('predictions').document(str(prediction.id))
            doc_ref.set(prediction_data)
            
            # Update user collection
            user_ref = client.collection('users').document(str(prediction.user.id))
            user_ref.collection('predictions').document(str(prediction.id)).set(prediction_data)
            
            # Mark as synced
            prediction.firestore_synced = True
            prediction.firestore_sync_error = ''
            prediction.save(update_fields=['firestore_synced', 'firestore_sync_error'])
            
            logger.info(f"Prediction {prediction.id} synced to Firestore")
            
        except Exception as e:
            logger.error(f"Failed to sync prediction {prediction.id}: {str(e)}")
            prediction.firestore_sync_error = str(e)
            prediction.save(update_fields=['firestore_sync_error'])
    
    @classmethod
    def get_user_predictions(cls, user_id, limit=50):
        """
        Get user predictions from Firestore.
        """
        try:
            client = cls.get_client()
            
            predictions_ref = client.collection('users').document(str(user_id)).collection('predictions')
            query = predictions_ref.order_by('created_at', direction=firestore.Query.DESCENDING).limit(limit)
            
            predictions = []
            for doc in query.stream():
                prediction_data = doc.to_dict()
                predictions.append(prediction_data)
            
            return predictions
            
        except Exception as e:
            logger.error(f"Failed to get predictions for user {user_id}: {str(e)}")
            return []
    
    @classmethod
    def update_user_statistics(cls, user_id):
        """
        Update user statistics in Firestore.
        """
        try:
            client = cls.get_client()
            
            # Get user's prediction history
            history, created = PredictionHistory.objects.get_or_create(user_id=user_id)
            history.update_statistics()
            
            # Prepare statistics data
            stats_data = {
                'total_predictions': history.total_predictions,
                'average_confidence': history.average_confidence,
                'most_common_prediction': history.most_common_prediction,
                'predictions_this_week': history.predictions_this_week,
                'predictions_this_month': history.predictions_this_month,
                'prediction_distribution': history.prediction_distribution,
                'last_prediction_date': history.last_prediction_date.isoformat() if history.last_prediction_date else None,
                'updated_at': datetime.now().isoformat(),
            }
            
            # Update Firestore
            user_ref = client.collection('users').document(str(user_id))
            user_ref.update({'statistics': stats_data})
            
            logger.info(f"Statistics updated for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to update statistics for user {user_id}: {str(e)}")
    
    @classmethod
    def delete_user_data(cls, user_id):
        """
        Delete all user data from Firestore.
        """
        try:
            client = cls.get_client()
            
            # Delete user's predictions
            predictions_ref = client.collection('users').document(str(user_id)).collection('predictions')
            predictions = predictions_ref.stream()
            
            for prediction in predictions:
                prediction.reference.delete()
            
            # Delete user document
            user_ref = client.collection('users').document(str(user_id))
            user_ref.delete()
            
            # Delete from main predictions collection
            main_predictions_ref = client.collection('predictions')
            query = main_predictions_ref.where('user_id', '==', str(user_id))
            
            for doc in query.stream():
                doc.reference.delete()
            
            logger.info(f"All data deleted for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete data for user {user_id}: {str(e)}")
    
    @classmethod
    def get_analytics_data(cls):
        """
        Get analytics data from Firestore.
        """
        try:
            client = cls.get_client()
            
            # Get global statistics
            analytics_ref = client.collection('analytics').document('global')
            analytics_doc = analytics_ref.get()
            
            if analytics_doc.exists:
                return analytics_doc.to_dict()
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Failed to get analytics data: {str(e)}")
            return {}
    
    @classmethod
    def update_analytics_data(cls, data):
        """
        Update global analytics data in Firestore.
        """
        try:
            client = cls.get_client()
            
            analytics_ref = client.collection('analytics').document('global')
            analytics_ref.set(data, merge=True)
            
            logger.info("Analytics data updated")
            
        except Exception as e:
            logger.error(f"Failed to update analytics data: {str(e)}")
    
    @classmethod
    def create_user_document(cls, user):
        """
        Create user document in Firestore.
        """
        try:
            client = cls.get_client()
            
            user_data = {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'firebase_uid': user.firebase_uid,
                'created_at': user.date_joined.isoformat(),
                'last_active': user.last_active.isoformat() if hasattr(user, 'last_active') else None,
                'statistics': {
                    'total_predictions': 0,
                    'average_confidence': 0.0,
                    'predictions_this_week': 0,
                    'predictions_this_month': 0,
                }
            }
            
            user_ref = client.collection('users').document(str(user.id))
            user_ref.set(user_data)
            
            logger.info(f"User document created for {user.username}")
            
        except Exception as e:
            logger.error(f"Failed to create user document for {user.username}: {str(e)}")
    
    @classmethod
    def setup_security_rules(cls):
        """
        Setup Firestore security rules (for reference).
        This would typically be done through Firebase Console or CLI.
        """
        rules = """
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Users can read/write their own data
            match /users/{userId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
              
              match /predictions/{predictionId} {
                allow read, write: if request.auth != null && request.auth.uid == userId;
              }
            }
            
            // Public read access to analytics (admin write only)
            match /analytics/{document} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && 
                          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true;
            }
            
            // Global predictions collection (authenticated read, owner write)
            match /predictions/{predictionId} {
              allow read: if request.auth != null;
              allow write: if request.auth != null && 
                          resource.data.user_id == request.auth.uid;
            }
          }
        }
        """
        return rules
