"""
Prediction serializers for BloodScan API.
"""
from rest_framework import serializers
from .models import Prediction, PredictionHistory, PredictionFeedback

class PredictionSerializer(serializers.ModelSerializer):
    """Serializer for Prediction model."""
    
    accuracy_level = serializers.ReadOnlyField()
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'predicted_blood_group', 'confidence_score', 'prediction_method',
            'image_hash', 'image_size', 'image_dimensions', 'model_version',
            'processing_time', 'alternative_predictions', 'confidence_breakdown',
            'accuracy_level', 'created_at', 'updated_at', 'user_rating',
            'user_feedback', 'is_verified', 'firestore_synced'
        ]
        read_only_fields = [
            'id', 'image_hash', 'image_size', 'image_dimensions', 'model_version',
            'processing_time', 'alternative_predictions', 'confidence_breakdown',
            'accuracy_level', 'created_at', 'updated_at', 'firestore_synced'
        ]

class PredictionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Prediction with user information."""
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    accuracy_level = serializers.ReadOnlyField()
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'user_username', 'user_email', 'predicted_blood_group',
            'confidence_score', 'prediction_method', 'image_hash', 'image_size',
            'image_dimensions', 'model_version', 'processing_time',
            'alternative_predictions', 'confidence_breakdown', 'accuracy_level',
            'created_at', 'updated_at', 'user_rating', 'user_feedback',
            'is_verified', 'firestore_synced'
        ]
        read_only_fields = [
            'id', 'user_username', 'user_email', 'image_hash', 'image_size',
            'image_dimensions', 'model_version', 'processing_time',
            'alternative_predictions', 'confidence_breakdown', 'accuracy_level',
            'created_at', 'updated_at', 'firestore_synced'
        ]

class PredictionHistorySerializer(serializers.ModelSerializer):
    """Serializer for PredictionHistory model."""
    
    class Meta:
        model = PredictionHistory
        fields = [
            'total_predictions', 'average_confidence', 'most_common_prediction',
            'last_prediction_date', 'predictions_this_week', 'predictions_this_month',
            'prediction_distribution', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'total_predictions', 'average_confidence', 'most_common_prediction',
            'last_prediction_date', 'predictions_this_week', 'predictions_this_month',
            'prediction_distribution', 'created_at', 'updated_at'
        ]

class PredictionFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for PredictionFeedback model."""
    
    class Meta:
        model = PredictionFeedback
        fields = [
            'prediction', 'is_correct', 'actual_blood_group', 'accuracy_rating',
            'ease_of_use_rating', 'overall_satisfaction', 'comments',
            'verified_by_medical_test', 'medical_test_date', 'medical_facility',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class PredictionCreateSerializer(serializers.Serializer):
    """Serializer for creating new predictions."""
    
    predicted_blood_group = serializers.ChoiceField(choices=[
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ])
    confidence_score = serializers.FloatField(min_value=0.0, max_value=1.0)
    prediction_method = serializers.CharField(max_length=50, default='ensemble_cnn')
    image_hash = serializers.CharField(max_length=64)
    image_size = serializers.IntegerField(min_value=1)
    image_dimensions = serializers.CharField(max_length=20)
    model_version = serializers.CharField(max_length=20, default='1.0.0')
    processing_time = serializers.FloatField(min_value=0.0)
    alternative_predictions = serializers.JSONField(default=dict)
    confidence_breakdown = serializers.JSONField(default=dict)
    
    def create(self, validated_data):
        """Create a new prediction."""
        user = self.context['request'].user
        return Prediction.objects.create(user=user, **validated_data)

class PredictionStatsSerializer(serializers.Serializer):
    """Serializer for prediction statistics."""
    
    total_predictions = serializers.IntegerField()
    average_confidence = serializers.FloatField()
    blood_group_distribution = serializers.DictField()
    confidence_distribution = serializers.DictField()
    weekly_trends = serializers.ListField()
    monthly_trends = serializers.ListField()
    top_users = serializers.ListField()
    model_performance = serializers.DictField()
