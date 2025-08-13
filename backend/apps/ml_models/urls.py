"""
ML Models URL patterns.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('predict/', views.predict_blood_group, name='predict_blood_group'),
    path('task-status/<str:task_id>/', views.get_task_status, name='get_task_status'),
    path('train/', views.train_model, name='train_model'),
    path('info/', views.model_info, name='model_info'),
    path('reload/', views.reload_model, name='reload_model'),
]
