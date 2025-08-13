"""
Prediction signals for automatic Firestore sync.
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Prediction
from .services import FirestoreService
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Prediction)
def sync_prediction_to_firestore(sender, instance, created, **kwargs):
    """Sync prediction to Firestore when saved."""
    if created:
        try:
            FirestoreService.sync_prediction(instance)
        except Exception as e:
            logger.error(f"Failed to sync new prediction {instance.id}: {str(e)}")

@receiver(post_delete, sender=Prediction)
def remove_prediction_from_firestore(sender, instance, **kwargs):
    """Remove prediction from Firestore when deleted."""
    try:
        # Note: This would need implementation in FirestoreService
        # FirestoreService.delete_prediction(instance.id)
        pass
    except Exception as e:
        logger.error(f"Failed to remove prediction {instance.id} from Firestore: {str(e)}")
