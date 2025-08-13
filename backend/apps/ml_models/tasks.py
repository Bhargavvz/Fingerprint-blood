"""
Celery tasks for ML operations.
"""
from celery import shared_task
from django.conf import settings
from .models import BloodGroupPredictor, ModelTrainer
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True)
def predict_blood_group_task(self, image_data, user_id):
    """
    Async task for blood group prediction.
    """
    try:
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'progress': 25, 'message': 'Initializing predictor...'}
        )
        
        # Initialize predictor
        predictor = BloodGroupPredictor(
            model_path=settings.ML_CONFIG.get('MODEL_PATH')
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 50, 'message': 'Processing image...'}
        )
        
        # Make prediction
        result = predictor.predict(image_data)
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 75, 'message': 'Finalizing results...'}
        )
        
        # Prepare response
        response = {
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
            'user_id': user_id
        }
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 100, 'message': 'Prediction completed!'}
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Async prediction error: {str(e)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise

@shared_task(bind=True)
def train_model_task(self, epochs, batch_size, learning_rate):
    """
    Async task for model training.
    """
    try:
        # Update task state
        self.update_state(
            state='PROGRESS',
            meta={'progress': 5, 'message': 'Initializing training...'}
        )
        
        # Initialize trainer
        data_dir = settings.ML_CONFIG.get('DATASET_PATH')
        model_dir = settings.ML_CONFIG.get('MODEL_PATH')
        
        trainer = ModelTrainer(data_dir, model_dir)
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 10, 'message': 'Starting CNN training...'}
        )
        
        # Train CNN model
        cnn_model = trainer.train_cnn_model(
            epochs=epochs,
            batch_size=batch_size,
            learning_rate=learning_rate
        )
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 80, 'message': 'Creating ensemble model...'}
        )
        
        # Create ensemble model
        trainer.create_ensemble_model()
        
        # Update progress
        self.update_state(
            state='PROGRESS',
            meta={'progress': 100, 'message': 'Training completed successfully!'}
        )
        
        return {
            'success': True,
            'message': 'Model training completed successfully',
            'parameters': {
                'epochs': epochs,
                'batch_size': batch_size,
                'learning_rate': learning_rate
            }
        }
        
    except Exception as e:
        logger.error(f"Training error: {str(e)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(e)}
        )
        raise
