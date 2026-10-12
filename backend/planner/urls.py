from django.urls import path

from .views import (
    ChatMessageCreateView,
    ChatSessionDetailView,
    ChatSessionListView,
    SavedTripDetailView,
    SavedTripListView,
)

urlpatterns = [
    path('chats/', ChatSessionListView.as_view(), name='chat-list'),
    path('chats/<int:pk>/', ChatSessionDetailView.as_view(), name='chat-detail'),
    path('chats/<int:pk>/messages/', ChatMessageCreateView.as_view(), name='chat-messages'),
    path('trips/', SavedTripListView.as_view(), name='trip-list'),
    path('trips/<int:pk>/', SavedTripDetailView.as_view(), name='trip-detail'),
]
