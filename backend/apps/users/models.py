"""
User models for BloodScan.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    """
    Extended user model with additional fields.
    """
    firebase_uid = models.CharField(max_length=255, unique=True, null=True, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    profile_picture = models.URLField(blank=True)
    
    # Preferences
    notifications_enabled = models.BooleanField(default=True)
    data_sharing_consent = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'users'
        
    def __str__(self):
        return f"{self.username} ({self.email})"
    
    def update_last_active(self):
        """Update last active timestamp."""
        self.last_active = timezone.now()
        self.save(update_fields=['last_active'])

class UserProfile(models.Model):
    """
    Additional user profile information.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Medical information (optional)
    known_blood_group = models.CharField(
        max_length=3,
        choices=[
            ('A+', 'A+'), ('A-', 'A-'),
            ('B+', 'B+'), ('B-', 'B-'),
            ('AB+', 'AB+'), ('AB-', 'AB-'),
            ('O+', 'O+'), ('O-', 'O-'),
        ],
        blank=True
    )
    medical_conditions = models.TextField(blank=True)
    
    # App usage statistics
    total_scans = models.PositiveIntegerField(default=0)
    successful_predictions = models.PositiveIntegerField(default=0)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_profiles'
        
    def __str__(self):
        return f"Profile for {self.user.username}"
    
    def increment_scan_count(self):
        """Increment total scan count."""
        self.total_scans += 1
        self.save(update_fields=['total_scans'])
    
    def increment_successful_prediction(self):
        """Increment successful prediction count."""
        self.successful_predictions += 1
        self.save(update_fields=['successful_predictions'])
    
    @property
    def success_rate(self):
        """Calculate prediction success rate."""
        if self.total_scans == 0:
            return 0.0
        return (self.successful_predictions / self.total_scans) * 100
