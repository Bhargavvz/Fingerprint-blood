"""
Authentication URL patterns.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('verify-token/', views.verify_token, name='verify_token'),
    path('create-custom-token/', views.create_custom_token, name='create_custom_token'),
    path('profile/', views.user_profile, name='user_profile'),
]
