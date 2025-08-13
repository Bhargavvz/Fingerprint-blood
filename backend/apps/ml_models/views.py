"""
ML Models views for BloodScan API.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import BloodGroupPredictor, ModelTrainer
from .tasks import train_model_task, predict_blood_group_task
import os
import logging

logger = logging.getLogger(__name__)

# Initialize predictor
predictor = BloodGroupPredictor(
    model_path=settings.ML_CONFIG.get('MODEL_PATH')
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def predict_blood_group(request):
    """
    Predict blood group from uploaded fingerprint image.
    """
    try:
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        
        # Validate file type
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
        file_extension = os.path.splitext(image_file.name)[1].lower()
        
        if file_extension not in allowed_extensions:
            return Response(
                {'error': 'Invalid file type. Allowed: jpg, jpeg, png, bmp'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 10MB)
        if image_file.size > 10 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size: 10MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Read image data
        image_data = image_file.read()
        
        # Check if we should use async processing
        use_async = request.data.get('async', 'false').lower() == 'true'
        
        if use_async:
            # Process asynchronously with Celery
            task = predict_blood_group_task.delay(image_data, request.user.id)
            
            return Response({
                'task_id': task.id,
                'status': 'processing',
                'message': 'Prediction is being processed asynchronously'
            }, status=status.HTTP_202_ACCEPTED)
        
        else:
            # Process synchronously
            result = predictor.predict(image_data)
            
            return Response({
                'success': True,
                'prediction': {
                    'blood_group': result['blood_group'],
                    'confidence': result['confidence'],
                    'method': result['method']
                },
                'details': {
                    'predictions': result['predictions'],
                    'confidences': result['confidences']
                },
                'user_id': request.user.id
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return Response(
            {'error': 'Prediction failed', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def get_task_status(request, task_id):
    """
    Get status of async prediction task.
    """
    try:
        from celery.result import AsyncResult
        
        task = AsyncResult(task_id)
        
        if task.state == 'PENDING':
            response = {
                'task_id': task_id,
                'status': 'pending',
                'progress': 0
            }
        elif task.state == 'PROGRESS':
            response = {
                'task_id': task_id,
                'status': 'processing',
                'progress': task.info.get('progress', 0),
                'message': task.info.get('message', '')
            }
        elif task.state == 'SUCCESS':
            response = {
                'task_id': task_id,
                'status': 'completed',
                'progress': 100,
                'result': task.result
            }
        else:
            response = {
                'task_id': task_id,
                'status': 'failed',
                'error': str(task.info)
            }
            
        return Response(response, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Task status error: {str(e)}")
        return Response(
            {'error': 'Failed to get task status', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def train_model(request):
    """
    Trigger model training (admin only).
    """
    try:
        # Check if user is admin
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get training parameters
        epochs = request.data.get('epochs', 100)
        batch_size = request.data.get('batch_size', 32)
        learning_rate = request.data.get('learning_rate', 0.001)
        
        # Start training task
        task = train_model_task.delay(epochs, batch_size, learning_rate)
        
        return Response({
            'task_id': task.id,
            'status': 'training_started',
            'message': 'Model training has been initiated',
            'parameters': {
                'epochs': epochs,
                'batch_size': batch_size,
                'learning_rate': learning_rate
            }
        }, status=status.HTTP_202_ACCEPTED)
        
    except Exception as e:
        logger.error(f"Training initiation error: {str(e)}")
        return Response(
            {'error': 'Failed to start training', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
def model_info(request):
    """
    Get information about the current model.
    """
    try:
        model_path = settings.ML_CONFIG.get('MODEL_PATH')
        
        info = {
            'model_status': 'loaded' if predictor.models else 'not_loaded',
            'available_models': list(predictor.models.keys()) if predictor.models else [],
            'classes': predictor.classes,
            'model_path': model_path,
            'image_size': settings.ML_CONFIG.get('IMAGE_SIZE'),
            'confidence_threshold': settings.ML_CONFIG.get('CONFIDENCE_THRESHOLD'),
        }
        
        return Response(info, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Model info error: {str(e)}")
        return Response(
            {'error': 'Failed to get model info', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reload_model(request):
    """
    Reload the ML model (admin only).
    """
    try:
        if not request.user.is_staff:
            return Response(
                {'error': 'Admin privileges required'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        global predictor
        model_path = settings.ML_CONFIG.get('MODEL_PATH')
        predictor = BloodGroupPredictor(model_path=model_path)
        
        return Response({
            'success': True,
            'message': 'Model reloaded successfully',
            'loaded_models': list(predictor.models.keys()) if predictor.models else []
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Model reload error: {str(e)}")
        return Response(
            {'error': 'Failed to reload model', 'details': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
