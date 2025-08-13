"""
Prediction models for BloodScan with Firestore integration.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()

class Prediction(models.Model):
    """
    Model to store blood group predictions.
    Synced with Firestore for real-time updates.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='predictions')
    
    # Prediction results
    predicted_blood_group = models.CharField(
        max_length=3,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ]
    )
    confidence_score = models.FloatField()
    prediction_method = models.CharField(max_length=50, default='ensemble_cnn')
    
    # Image information
    image_hash = models.CharField(max_length=64)  # SHA-256 hash for duplicate detection
    image_size = models.PositiveIntegerField()  # File size in bytes
    image_dimensions = models.CharField(max_length=20)  # e.g., "224x224"
    
    # Model information
    model_version = models.CharField(max_length=20, default='1.0.0')
    processing_time = models.FloatField()  # Time in seconds
    
    # Additional prediction details
    alternative_predictions = models.JSONField(default=dict)  # Other model predictions
    confidence_breakdown = models.JSONField(default=dict)  # Confidence per model
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Firestore sync
    firestore_synced = models.BooleanField(default=False)
    firestore_sync_error = models.TextField(blank=True)
    
    # User feedback
    user_rating = models.PositiveIntegerField(null=True, blank=True)  # 1-5 stars
    user_feedback = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)  # Medical verification
    
    class Meta:
        db_table = 'predictions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['predicted_blood_group']),
            models.Index(fields=['confidence_score']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.predicted_blood_group} ({self.confidence_score:.2f})"
    
    @property
    def accuracy_level(self):
        """Get accuracy level based on confidence score."""
        if self.confidence_score >= 0.9:
            return 'Very High'
        elif self.confidence_score >= 0.8:
            return 'High'
        elif self.confidence_score >= 0.7:
            return 'Medium'
        elif self.confidence_score >= 0.6:
            return 'Low'
        else:
            return 'Very Low'
    
    def save(self, *args, **kwargs):
        """Override save to sync with Firestore."""
        super().save(*args, **kwargs)
        # Trigger Firestore sync
        from .services import FirestoreService
        FirestoreService.sync_prediction(self)

class PredictionHistory(models.Model):
    """
    Historical tracking of predictions for analytics.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Aggregated statistics
    total_predictions = models.PositiveIntegerField(default=0)
    average_confidence = models.FloatField(default=0.0)
    most_common_prediction = models.CharField(max_length=3, blank=True)
    
    # Time-based statistics
    last_prediction_date = models.DateTimeField(null=True, blank=True)
    predictions_this_week = models.PositiveIntegerField(default=0)
    predictions_this_month = models.PositiveIntegerField(default=0)
    
    # Blood group distribution
    prediction_distribution = models.JSONField(default=dict)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prediction_history'
        unique_together = ['user']
    
    def __str__(self):
        return f"History for {self.user.username}"
    
    def update_statistics(self):
        """Update statistics based on user's predictions."""
        predictions = Prediction.objects.filter(user=self.user)
        
        if predictions.exists():
            self.total_predictions = predictions.count()
            self.average_confidence = predictions.aggregate(
                avg_conf=models.Avg('confidence_score')
            )['avg_conf'] or 0.0
            
            # Most common prediction
            most_common = predictions.values('predicted_blood_group').annotate(
                count=models.Count('predicted_blood_group')
            ).order_by('-count').first()
            
            if most_common:
                self.most_common_prediction = most_common['predicted_blood_group']
            
            # Time-based counts
            now = timezone.now()
            week_start = now - timezone.timedelta(days=7)
            month_start = now - timezone.timedelta(days=30)
            
            self.predictions_this_week = predictions.filter(
                created_at__gte=week_start
            ).count()
            
            self.predictions_this_month = predictions.filter(
                created_at__gte=month_start
            ).count()
            
            # Distribution
            distribution = {}
            for pred in predictions.values('predicted_blood_group').annotate(
                count=models.Count('predicted_blood_group')
            ):
                distribution[pred['predicted_blood_group']] = pred['count']
            
            self.prediction_distribution = distribution
            self.last_prediction_date = predictions.first().created_at
        
        self.save()

class PredictionFeedback(models.Model):
    """
    User feedback on predictions for model improvement.
    """
    prediction = models.OneToOneField(
        Prediction, 
        on_delete=models.CASCADE, 
        related_name='feedback'
    )
    
    # Feedback details
    is_correct = models.BooleanField(null=True, blank=True)
    actual_blood_group = models.CharField(
        max_length=3,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ],
        blank=True
    )
    
    # Rating and comments
    accuracy_rating = models.PositiveIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True, blank=True
    )
    ease_of_use_rating = models.PositiveIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True, blank=True
    )
    overall_satisfaction = models.PositiveIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        null=True, blank=True
    )
    
    comments = models.TextField(blank=True)
    
    # Medical verification
    verified_by_medical_test = models.BooleanField(default=False)
    medical_test_date = models.DateField(null=True, blank=True)
    medical_facility = models.CharField(max_length=200, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prediction_feedback'
    
    def __str__(self):
        return f"Feedback for {self.prediction.id}"
