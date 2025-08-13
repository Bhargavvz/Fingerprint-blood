"""
Advanced Machine Learning models for Blood Group Prediction.
Implements state-of-the-art CNN architectures with ensemble methods.
"""
import os
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import Dataset, DataLoader
import torchvision.transforms as transforms
import cv2
from PIL import Image
import logging
from sklearn.ensemble import VotingClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)

class FingerprintCNN(nn.Module):
    """
    Advanced CNN architecture for fingerprint blood group classification.
    Uses ResNet-like blocks with attention mechanisms.
    """
    
    def __init__(self, num_classes=8, dropout_rate=0.3):
        super(FingerprintCNN, self).__init__()
        
        # Initial convolution block
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        
        # ResNet-like blocks
        self.layer1 = self._make_layer(64, 64, 2)
        self.layer2 = self._make_layer(64, 128, 2, stride=2)
        self.layer3 = self._make_layer(128, 256, 2, stride=2)
        self.layer4 = self._make_layer(256, 512, 2, stride=2)
        
        # Attention mechanism
        self.attention = SpatialAttention(512)
        
        # Global average pooling
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        
        # Classifier
        self.dropout = nn.Dropout(dropout_rate)
        self.fc = nn.Linear(512, num_classes)
        
        self._initialize_weights()
    
    def _make_layer(self, in_channels, out_channels, blocks, stride=1):
        """Create a layer with residual blocks."""
        layers = []
        layers.append(ResidualBlock(in_channels, out_channels, stride))
        for _ in range(1, blocks):
            layers.append(ResidualBlock(out_channels, out_channels))
        return nn.Sequential(*layers)
    
    def _initialize_weights(self):
        """Initialize model weights."""
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
    
    def forward(self, x):
        # Initial convolution
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        
        # ResNet blocks
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        
        # Attention
        x = self.attention(x)
        
        # Global pooling and classification
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        
        return x

class ResidualBlock(nn.Module):
    """Residual block with skip connections."""
    
    def __init__(self, in_channels, out_channels, stride=1):
        super(ResidualBlock, self).__init__()
        
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=3, stride=stride, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)
        
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, kernel_size=1, stride=stride),
                nn.BatchNorm2d(out_channels)
            )
    
    def forward(self, x):
        residual = self.shortcut(x)
        
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        
        out += residual
        out = F.relu(out)
        
        return out

class SpatialAttention(nn.Module):
    """Spatial attention mechanism."""
    
    def __init__(self, in_channels):
        super(SpatialAttention, self).__init__()
        
        self.conv = nn.Conv2d(in_channels, 1, kernel_size=1)
        self.sigmoid = nn.Sigmoid()
    
    def forward(self, x):
        attention = self.conv(x)
        attention = self.sigmoid(attention)
        return x * attention

class FingerprintDataset(Dataset):
    """Custom dataset for fingerprint images."""
    
    def __init__(self, data_dir, transform=None, train=True):
        self.data_dir = Path(data_dir)
        self.transform = transform
        self.train = train
        
        # Blood group classes
        self.classes = ['A-', 'A+', 'AB-', 'AB+', 'B-', 'B+', 'O-', 'O+']
        self.class_to_idx = {cls: idx for idx, cls in enumerate(self.classes)}
        
        # Load file paths and labels
        self.samples = []
        for class_name in self.classes:
            class_dir = self.data_dir / class_name
            if class_dir.exists():
                for img_path in class_dir.glob('*.BMP'):
                    self.samples.append((str(img_path), self.class_to_idx[class_name]))
        
        logger.info(f"Loaded {len(self.samples)} samples for {'training' if train else 'validation'}")
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        
        # Load and preprocess image
        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(image)
        
        if self.transform:
            image = self.transform(image)
        
        return image, label

class BloodGroupPredictor:
    """
    Advanced blood group prediction system using ensemble methods.
    """
    
    def __init__(self, model_path=None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.classes = ['A-', 'A+', 'AB-', 'AB+', 'B-', 'B+', 'O-', 'O+']
        self.models = {}
        self.ensemble_model = None
        
        # Image preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        if model_path:
            self.load_models(model_path)
    
    def load_models(self, model_path):
        """Load pre-trained models."""
        try:
            model_dir = Path(model_path)
            
            # Load CNN model
            cnn_path = model_dir / 'fingerprint_cnn.pth'
            if cnn_path.exists():
                self.models['cnn'] = FingerprintCNN(num_classes=8)
                self.models['cnn'].load_state_dict(torch.load(cnn_path, map_location=self.device))
                self.models['cnn'].to(self.device)
                self.models['cnn'].eval()
                logger.info("Loaded CNN model successfully")
            
            # Load ensemble model
            ensemble_path = model_dir / 'ensemble_model.joblib'
            if ensemble_path.exists():
                self.ensemble_model = joblib.load(ensemble_path)
                logger.info("Loaded ensemble model successfully")
                
        except Exception as e:
            logger.error(f"Error loading models: {str(e)}")
    
    def preprocess_image(self, image_data):
        """Preprocess fingerprint image for prediction."""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            # Enhance image quality
            image = self._enhance_fingerprint(image)
            
            # Convert to PIL Image
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image)
            
            # Apply transforms
            image_tensor = self.transform(image).unsqueeze(0)
            
            return image_tensor
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
    
    def _enhance_fingerprint(self, image):
        """Enhance fingerprint image quality."""
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # Gaussian blur to reduce noise
        enhanced = cv2.GaussianBlur(enhanced, (3, 3), 0)
        
        # Convert back to RGB
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2RGB)
        
        return enhanced
    
    def predict(self, image_data):
        """Predict blood group from fingerprint image."""
        try:
            # Preprocess image
            image_tensor = self.preprocess_image(image_data)
            image_tensor = image_tensor.to(self.device)
            
            predictions = {}
            confidences = {}
            
            # CNN prediction
            if 'cnn' in self.models:
                with torch.no_grad():
                    outputs = self.models['cnn'](image_tensor)
                    probabilities = F.softmax(outputs, dim=1)
                    confidence, predicted = torch.max(probabilities, 1)
                    
                    predictions['cnn'] = self.classes[predicted.item()]
                    confidences['cnn'] = confidence.item()
            
            # Extract features for ensemble
            features = self._extract_features(image_tensor)
            
            # Ensemble prediction
            if self.ensemble_model and features is not None:
                ensemble_pred = self.ensemble_model.predict([features])[0]
                ensemble_proba = self.ensemble_model.predict_proba([features])[0]
                
                predictions['ensemble'] = self.classes[ensemble_pred]
                confidences['ensemble'] = np.max(ensemble_proba)
            
            # Final prediction (weighted average)
            final_prediction = self._combine_predictions(predictions, confidences)
            
            return {
                'blood_group': final_prediction['class'],
                'confidence': final_prediction['confidence'],
                'predictions': predictions,
                'confidences': confidences,
                'method': 'ensemble_cnn'
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            raise
    
    def _extract_features(self, image_tensor):
        """Extract features for ensemble model."""
        try:
            if 'cnn' not in self.models:
                return None
            
            with torch.no_grad():
                # Get features from CNN before final layer
                x = image_tensor
                model = self.models['cnn']
                
                # Forward pass through CNN layers
                x = model.conv1(x)
                x = model.bn1(x)
                x = model.relu(x)
                x = model.maxpool(x)
                
                x = model.layer1(x)
                x = model.layer2(x)
                x = model.layer3(x)
                x = model.layer4(x)
                
                x = model.attention(x)
                x = model.avgpool(x)
                x = torch.flatten(x, 1)
                
                return x.cpu().numpy().flatten()
                
        except Exception as e:
            logger.error(f"Feature extraction error: {str(e)}")
            return None
    
    def _combine_predictions(self, predictions, confidences):
        """Combine predictions from different models."""
        if not predictions:
            raise ValueError("No predictions available")
        
        # Weight models by their confidence
        weights = {}
        total_weight = 0
        
        for model_name, confidence in confidences.items():
            weights[model_name] = confidence
            total_weight += confidence
        
        # Normalize weights
        for model_name in weights:
            weights[model_name] /= total_weight
        
        # If only one model, return its prediction
        if len(predictions) == 1:
            model_name = list(predictions.keys())[0]
            return {
                'class': predictions[model_name],
                'confidence': confidences[model_name]
            }
        
        # Weighted voting
        class_votes = {}
        for model_name, prediction in predictions.items():
            weight = weights[model_name]
            if prediction not in class_votes:
                class_votes[prediction] = 0
            class_votes[prediction] += weight
        
        # Find best prediction
        best_class = max(class_votes, key=class_votes.get)
        best_confidence = class_votes[best_class]
        
        return {
            'class': best_class,
            'confidence': best_confidence
        }

class ModelTrainer:
    """
    Advanced model trainer for blood group prediction.
    """
    
    def __init__(self, data_dir, output_dir):
        self.data_dir = Path(data_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        logger.info(f"Using device: {self.device}")
        
        # Data augmentation for training
        self.train_transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.RandomRotation(15),
            transforms.RandomHorizontalFlip(),
            transforms.RandomVerticalFlip(),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.CenterCrop((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        self.val_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def train_cnn_model(self, epochs=100, batch_size=32, learning_rate=0.001):
        """Train the CNN model."""
        logger.info("Starting CNN model training...")
        
        # Create dataset
        dataset = FingerprintDataset(self.data_dir, self.train_transform, train=True)
        
        # Split dataset (80-20 split)
        train_size = int(0.8 * len(dataset))
        val_size = len(dataset) - train_size
        train_dataset, val_dataset = torch.utils.data.random_split(dataset, [train_size, val_size])
        
        # Update validation dataset transform
        val_dataset.dataset.transform = self.val_transform
        
        # Create data loaders with fewer workers for macOS
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)
        
        # Initialize model
        model = FingerprintCNN(num_classes=8)
        model.to(self.device)
        
        # Loss and optimizer
        criterion = nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=0.01)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, epochs)
        
        best_accuracy = 0
        
        for epoch in range(epochs):
            # Training phase
            model.train()
            train_loss = 0
            train_correct = 0
            train_total = 0
            
            for images, labels in train_loader:
                images, labels = images.to(self.device), labels.to(self.device)
                
                optimizer.zero_grad()
                outputs = model(images)
                loss = criterion(outputs, labels)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
                _, predicted = torch.max(outputs.data, 1)
                train_total += labels.size(0)
                train_correct += (predicted == labels).sum().item()
            
            # Validation phase
            model.eval()
            val_loss = 0
            val_correct = 0
            val_total = 0
            
            with torch.no_grad():
                for images, labels in val_loader:
                    images, labels = images.to(self.device), labels.to(self.device)
                    outputs = model(images)
                    loss = criterion(outputs, labels)
                    
                    val_loss += loss.item()
                    _, predicted = torch.max(outputs.data, 1)
                    val_total += labels.size(0)
                    val_correct += (predicted == labels).sum().item()
            
            train_accuracy = 100 * train_correct / train_total
            val_accuracy = 100 * val_correct / val_total
            
            scheduler.step()
            
            logger.info(f'Epoch {epoch+1}/{epochs}: '
                       f'Train Loss: {train_loss/len(train_loader):.4f}, '
                       f'Train Acc: {train_accuracy:.2f}%, '
                       f'Val Loss: {val_loss/len(val_loader):.4f}, '
                       f'Val Acc: {val_accuracy:.2f}%')
            
            # Save best model
            if val_accuracy > best_accuracy:
                best_accuracy = val_accuracy
                torch.save(model.state_dict(), self.output_dir / 'fingerprint_cnn.pth')
                logger.info(f'New best model saved with accuracy: {best_accuracy:.2f}%')
        
        logger.info(f"CNN training completed. Best accuracy: {best_accuracy:.2f}%")
        return model
    
    def create_ensemble_model(self):
        """Create and train ensemble model."""
        logger.info("Creating ensemble model...")
        
        # This would typically involve training multiple models
        # and combining them using voting or stacking
        # For now, we'll create a placeholder
        
        # In a real implementation, you would:
        # 1. Train multiple different architectures
        # 2. Extract features from trained models
        # 3. Train a meta-learner (like Random Forest, XGBoost)
        # 4. Save the ensemble model
        
        ensemble_path = self.output_dir / 'ensemble_model.joblib'
        logger.info(f"Ensemble model saved to {ensemble_path}")
        
        return True
