"""
Users URL patterns.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.UserProfileView.as_view(), name='user_profile'),
    path('statistics/', views.user_statistics, name='user_statistics'),
    path('preferences/', views.update_preferences, name='update_preferences'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('update-activity/', views.update_activity, name='update_activity'),
]
