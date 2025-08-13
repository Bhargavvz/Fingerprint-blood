"""
Predictions URL patterns.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Prediction CRUD
    path('', views.PredictionListCreateView.as_view(), name='prediction_list_create'),
    path('<uuid:pk>/', views.PredictionDetailView.as_view(), name='prediction_detail'),
    
    # User-specific endpoints
    path('history/', views.user_prediction_history, name='user_prediction_history'),
    path('analytics/', views.prediction_analytics, name='prediction_analytics'),
    path('create-from-ml/', views.create_prediction_from_ml, name='create_prediction_from_ml'),
    
    # Feedback
    path('<uuid:prediction_id>/feedback/', views.submit_feedback, name='submit_feedback'),
    
    # Admin endpoints
    path('admin/global-analytics/', views.global_analytics, name='global_analytics'),
    path('admin/sync-firestore/', views.sync_firestore, name='sync_firestore'),
]
