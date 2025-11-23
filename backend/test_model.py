#!/usr/bin/env python
"""
Test the trained model with a sample image.
"""

import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bloodscan.settings')
django.setup()

from apps.ml_models.models import BloodGroupPredictor
from django.conf import settings
import glob

def test_model():
    """Test the trained model with sample images."""
    print("=" * 60)
    print("🧪 TESTING TRAINED MODEL")
    print("=" * 60)
    
    # Initialize predictor
    model_path = settings.ML_CONFIG.get('MODEL_PATH')
    print(f"\n📂 Loading model from: {model_path}")
    
    try:
        predictor = BloodGroupPredictor(model_path=model_path)
        print("✅ Model loaded successfully!")
        print(f"📊 Available models: {list(predictor.models.keys())}")
        print(f"🩸 Blood group classes: {predictor.classes}")
    except Exception as e:
        print(f"❌ Error loading model: {str(e)}")
        return
    
    # Test with a sample image from dataset
    dataset_path = settings.ML_CONFIG.get('DATASET_PATH')
    print(f"\n📂 Looking for test images in: {dataset_path}")
    
    # Get one image from each blood group
    for blood_group in predictor.classes:
        blood_group_path = os.path.join(dataset_path, blood_group)
        if os.path.exists(blood_group_path):
            images = glob.glob(os.path.join(blood_group_path, '*.BMP'))
            if images:
                test_image = images[0]
                print(f"\n{'=' * 60}")
                print(f"🔬 Testing with: {blood_group}/{os.path.basename(test_image)}")
                print(f"   Expected: {blood_group}")
                
                try:
                    # Read image
                    with open(test_image, 'rb') as f:
                        image_data = f.read()
                    
                    # Predict
                    result = predictor.predict(image_data)
                    
                    # Display results
                    predicted = result['blood_group']
                    confidence = result['confidence']
                    
                    match_icon = "✅" if predicted == blood_group else "❌"
                    print(f"   Predicted: {predicted} (Confidence: {confidence:.2%}) {match_icon}")
                    
                    # Show all model predictions
                    print(f"   Details:")
                    for model_name, pred in result['predictions'].items():
                        conf = result['confidences'][model_name]
                        print(f"     - {model_name}: {pred} ({conf:.2%})")
                    
                except Exception as e:
                    print(f"   ❌ Prediction failed: {str(e)}")
    
    print(f"\n{'=' * 60}")
    print("✅ Model testing completed!")
    print("=" * 60)

if __name__ == '__main__':
    test_model()
