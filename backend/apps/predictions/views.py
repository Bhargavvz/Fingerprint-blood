"""
Prediction views for BloodScan API with Firestore integration.
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import Prediction, PredictionHistory, PredictionFeedback
from .serializers import (
    PredictionSerializer, PredictionDetailSerializer, PredictionHistorySerializer,
    PredictionFeedbackSerializer, PredictionCreateSerializer, PredictionStatsSerializer
)
from .services import FirestoreService
from apps.users.models import UserProfile
import logging
import hashlib

logger = logging.getLogger(__name__)

class PredictionListCreateView(generics.ListCreateAPIView):
    """
    List user's predictions or create a new prediction.
    """
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return PredictionCreateSerializer
        return PredictionSerializer
    
    def get_queryset(self):
        return Prediction.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        prediction = serializer.save()
        
        # Update user profile statistics
        profile, created = UserProfile.objects.get_or_create(user=self.request.user)
        profile.increment_scan_count()
        if prediction.confidence_score >= 0.7:
            profile.increment_successful_prediction()
        
        # Update Firestore
        FirestoreService.update_user_statistics(self.request.user.id)

class PredictionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a prediction.
    """
    serializer_class = PredictionDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Prediction.objects.filter(user=self.request.user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_prediction_history(request):
    """
    Get user's prediction history and statistics.
    """
    try:
        user = request.user
        
        # Get or create prediction history
        history, created = PredictionHistory.objects.get_or_create(user=user)
        if created or request.GET.get('refresh') == 'true':
            history.update_statistics()
        
        # Get recent predictions
        recent_predictions = Prediction.objects.filter(user=user)[:10]
        
        # Serialize data
        history_serializer = PredictionHistorySerializer(history)
        predictions_serializer = PredictionSerializer(recent_predictions, many=True)
        
        # Get from Firestore as well
        firestore_predictions = FirestoreService.get_user_predictions(user.id, limit=10)
        
        response_data = {
            'history': history_serializer.data,
            'recent_predictions': predictions_serializer.data,
            'firestore_predictions': firestore_predictions,
            'sync_status': {
                'total_predictions': recent_predictions.count(),
                'synced_predictions': recent_predictions.filter(firestore_synced=True).count(),
                'pending_sync': recent_predictions.filter(firestore_synced=False).count(),
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Prediction history error: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve prediction history', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_prediction_from_ml(request):
    """
    Create prediction from ML model results.
    Used internally by ML prediction endpoints.
    """
    try:
        # Validate required fields
        required_fields = [
            'predicted_blood_group', 'confidence_score', 'image_hash',
            'image_size', 'processing_time'
        ]
        
        for field in required_fields:
            if field not in request.data:
                return Response(
                    {'error': f'Missing required field: {field}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Create prediction
        prediction_data = {
            'predicted_blood_group': request.data['predicted_blood_group'],
            'confidence_score': request.data['confidence_score'],
            'prediction_method': request.data.get('method', 'ensemble_cnn'),
            'image_hash': request.data['image_hash'],
            'image_size': request.data['image_size'],
            'image_dimensions': request.data.get('image_dimensions', '224x224'),
            'model_version': request.data.get('model_version', '1.0.0'),
            'processing_time': request.data['processing_time'],
            'alternative_predictions': request.data.get('alternative_predictions', {}),
            'confidence_breakdown': request.data.get('confidence_breakdown', {}),
        }
        
        serializer = PredictionCreateSerializer(data=prediction_data, context={'request': request})
        
        if serializer.is_valid():
            prediction = serializer.save()
            
            # Update user profile
            profile, created = UserProfile.objects.get_or_create(user=request.user)
            profile.increment_scan_count()
            if prediction.confidence_score >= 0.7:
                profile.increment_successful_prediction()
            
            # Update Firestore
            FirestoreService.update_user_statistics(request.user.id)
            
            response_serializer = PredictionSerializer(prediction)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Prediction creation error: {str(e)}")
        return Response(
            {'error': 'Failed to create prediction', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_feedback(request, prediction_id):
    """
    Submit feedback for a prediction.
    """
    try:
        # Get prediction
        try:
            prediction = Prediction.objects.get(id=prediction_id, user=request.user)
        except Prediction.DoesNotExist:
            return Response(
                {'error': 'Prediction not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or update feedback
        feedback_data = request.data.copy()
        feedback_data['prediction'] = prediction.id
        
        try:
            feedback = PredictionFeedback.objects.get(prediction=prediction)
            serializer = PredictionFeedbackSerializer(feedback, data=feedback_data, partial=True)
        except PredictionFeedback.DoesNotExist:
            serializer = PredictionFeedbackSerializer(data=feedback_data)
        
        if serializer.is_valid():
            feedback = serializer.save()
            
            # Update prediction with user rating
            if 'overall_satisfaction' in request.data:
                prediction.user_rating = request.data['overall_satisfaction']
                prediction.save(update_fields=['user_rating'])
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        logger.error(f"Feedback submission error: {str(e)}")
        return Response(
            {'error': 'Failed to submit feedback', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_analytics(request):
    """
    Get personal prediction analytics for the user.
    """
    try:
        user = request.user
        
        # Time filters
        time_filter = request.GET.get('period', 'all')
        now = timezone.now()
        
        if time_filter == 'week':
            start_date = now - timedelta(days=7)
        elif time_filter == 'month':
            start_date = now - timedelta(days=30)
        elif time_filter == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = None
        
        # Base queryset
        predictions = Prediction.objects.filter(user=user)
        if start_date:
            predictions = predictions.filter(created_at__gte=start_date)
        
        # Calculate analytics
        total_predictions = predictions.count()
        
        if total_predictions > 0:
            avg_confidence = predictions.aggregate(avg=Avg('confidence_score'))['avg']
            
            # Blood group distribution
            bg_distribution = dict(predictions.values('predicted_blood_group').annotate(
                count=Count('predicted_blood_group')
            ).values_list('predicted_blood_group', 'count'))
            
            # Confidence distribution
            confidence_ranges = {
                'Very High (90-100%)': predictions.filter(confidence_score__gte=0.9).count(),
                'High (80-89%)': predictions.filter(
                    confidence_score__gte=0.8, confidence_score__lt=0.9
                ).count(),
                'Medium (70-79%)': predictions.filter(
                    confidence_score__gte=0.7, confidence_score__lt=0.8
                ).count(),
                'Low (60-69%)': predictions.filter(
                    confidence_score__gte=0.6, confidence_score__lt=0.7
                ).count(),
                'Very Low (<60%)': predictions.filter(confidence_score__lt=0.6).count(),
            }
            
            # Weekly trends (last 8 weeks)
            weekly_trends = []
            for i in range(8):
                week_start = now - timedelta(days=(i+1)*7)
                week_end = now - timedelta(days=i*7)
                week_count = predictions.filter(
                    created_at__gte=week_start, created_at__lt=week_end
                ).count()
                weekly_trends.append({
                    'week': f"Week {8-i}",
                    'count': week_count
                })
            
            # Most common prediction
            most_common = predictions.values('predicted_blood_group').annotate(
                count=Count('predicted_blood_group')
            ).order_by('-count').first()
            
        else:
            avg_confidence = 0
            bg_distribution = {}
            confidence_ranges = {}
            weekly_trends = []
            most_common = None
        
        analytics_data = {
            'summary': {
                'total_predictions': total_predictions,
                'average_confidence': round(avg_confidence, 2) if avg_confidence else 0,
                'most_common_prediction': most_common['predicted_blood_group'] if most_common else None,
                'period': time_filter,
            },
            'distributions': {
                'blood_groups': bg_distribution,
                'confidence_levels': confidence_ranges,
            },
            'trends': {
                'weekly': weekly_trends,
            }
        }
        
        return Response(analytics_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Analytics error: {str(e)}")
        return Response(
            {'error': 'Failed to generate analytics', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAdminUser])
def global_analytics(request):
    """
    Get global prediction analytics (admin only).
    """
    try:
        # Time filters
        time_filter = request.GET.get('period', 'month')
        now = timezone.now()
        
        if time_filter == 'week':
            start_date = now - timedelta(days=7)
        elif time_filter == 'month':
            start_date = now - timedelta(days=30)
        elif time_filter == 'year':
            start_date = now - timedelta(days=365)
        else:
            start_date = None
        
        # Base queryset
        predictions = Prediction.objects.all()
        if start_date:
            predictions = predictions.filter(created_at__gte=start_date)
        
        # Global statistics
        total_predictions = predictions.count()
        total_users = predictions.values('user').distinct().count()
        avg_confidence = predictions.aggregate(avg=Avg('confidence_score'))['avg'] or 0
        
        # Blood group distribution
        bg_distribution = dict(predictions.values('predicted_blood_group').annotate(
            count=Count('predicted_blood_group')
        ).values_list('predicted_blood_group', 'count'))
        
        # Model performance
        model_performance = dict(predictions.values('prediction_method').annotate(
            count=Count('prediction_method'),
            avg_confidence=Avg('confidence_score')
        ).values_list('prediction_method', 'avg_confidence'))
        
        # Top users
        top_users = list(predictions.values('user__username').annotate(
            prediction_count=Count('id')
        ).order_by('-prediction_count')[:10])
        
        # Daily trends (last 30 days)
        daily_trends = []
        for i in range(30):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_count = predictions.filter(
                created_at__gte=day_start, created_at__lt=day_end
            ).count()
            
            daily_trends.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'count': day_count
            })
        
        daily_trends.reverse()  # Chronological order
        
        analytics_data = {
            'summary': {
                'total_predictions': total_predictions,
                'total_users': total_users,
                'average_confidence': round(avg_confidence, 2),
                'period': time_filter,
            },
            'distributions': {
                'blood_groups': bg_distribution,
                'model_performance': model_performance,
            },
            'trends': {
                'daily': daily_trends,
            },
            'top_users': top_users,
        }
        
        # Update Firestore analytics
        FirestoreService.update_analytics_data(analytics_data)
        
        return Response(analytics_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Global analytics error: {str(e)}")
        return Response(
            {'error': 'Failed to generate global analytics', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAdminUser])
def sync_firestore(request):
    """
    Manually sync predictions to Firestore (admin only).
    """
    try:
        # Get unsynced predictions
        unsynced_predictions = Prediction.objects.filter(firestore_synced=False)
        
        synced_count = 0
        failed_count = 0
        
        for prediction in unsynced_predictions:
            try:
                FirestoreService.sync_prediction(prediction)
                synced_count += 1
            except Exception as e:
                logger.error(f"Failed to sync prediction {prediction.id}: {str(e)}")
                failed_count += 1
        
        return Response({
            'success': True,
            'synced_count': synced_count,
            'failed_count': failed_count,
            'total_processed': unsynced_predictions.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Firestore sync error: {str(e)}")
        return Response(
            {'error': 'Failed to sync Firestore', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
