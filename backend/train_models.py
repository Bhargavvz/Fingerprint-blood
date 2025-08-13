#!/usr/bin/env python
"""
Advanced Model Training Script for BloodScan.
Trains state-of-the-art neural networks for fingerprint blood group prediction.
"""

import os
import sys
import django
import argparse
import logging
from pathlib import Path

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bloodscan.settings')
django.setup()

from apps.ml_models.models import ModelTrainer
from django.conf import settings

# Setup logging
import os
os.makedirs('logs', exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/training.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main training function."""
    parser = argparse.ArgumentParser(description='Train BloodScan ML models')
    
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for training')
    parser.add_argument('--learning-rate', type=float, default=0.001, help='Learning rate')
    parser.add_argument('--data-dir', type=str, help='Path to dataset directory')
    parser.add_argument('--output-dir', type=str, help='Path to save trained models')
    parser.add_argument('--gpu', action='store_true', help='Use GPU for training')
    parser.add_argument('--model-type', type=str, choices=['cnn', 'ensemble', 'all'], 
                       default='all', help='Type of model to train')
    
    args = parser.parse_args()
    
    # Set paths
    data_dir = args.data_dir or settings.ML_CONFIG.get('DATASET_PATH')
    output_dir = args.output_dir or settings.ML_CONFIG.get('MODEL_PATH')
    
    if not data_dir or not os.path.exists(data_dir):
        logger.error(f"Dataset directory not found: {data_dir}")
        return 1
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    logger.info("Starting BloodScan model training...")
    logger.info(f"Dataset: {data_dir}")
    logger.info(f"Output: {output_dir}")
    logger.info(f"Parameters: epochs={args.epochs}, batch_size={args.batch_size}, lr={args.learning_rate}")
    
    try:
        # Initialize trainer
        trainer = ModelTrainer(data_dir, output_dir)
        
        # Train CNN model
        if args.model_type in ['cnn', 'all']:
            logger.info("Training CNN model...")
            cnn_model = trainer.train_cnn_model(
                epochs=args.epochs,
                batch_size=args.batch_size,
                learning_rate=args.learning_rate
            )
            logger.info("CNN model training completed!")
        
        # Train ensemble model
        if args.model_type in ['ensemble', 'all']:
            logger.info("Creating ensemble model...")
            trainer.create_ensemble_model()
            logger.info("Ensemble model creation completed!")
        
        logger.info("All model training completed successfully!")
        return 0
        
    except Exception as e:
        logger.error(f"Training failed: {str(e)}")
        return 1

if __name__ == '__main__':
    exit(main())
