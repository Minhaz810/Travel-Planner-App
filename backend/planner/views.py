from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView

from .gemini import GeminiError, generate_reply
from .models import ChatMessage, ChatSession, SavedTrip
from .serializers import (
    ChatMessageSerializer,
    ChatSessionDetailSerializer,
    ChatSessionSerializer,
    SavedTripDetailSerializer,
    SavedTripSerializer,
    SendMessageSerializer,
)

TITLE_LENGTH = 60


class ChatRateThrottle(UserRateThrottle):
    scope = 'chat'


class ChatSessionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = request.user.chat_sessions.all()
        return Response(ChatSessionSerializer(sessions, many=True).data)

    def post(self, request):
        serializer = ChatSessionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        language = serializer.validated_data.get('language') or request.user.profile.preferred_language
        session = serializer.save(user=request.user, language=language, title='')
        return Response(ChatSessionDetailSerializer(session).data, status=status.HTTP_201_CREATED)


class ChatSessionDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_session(self, request, pk):
        # Other users' sessions return 404, not 403.
        return get_object_or_404(ChatSession.objects.prefetch_related('messages'), pk=pk, user=request.user)

    def get(self, request, pk):
        return Response(ChatSessionDetailSerializer(self.get_session(request, pk)).data)

    def patch(self, request, pk):
        session = self.get_session(request, pk)
        serializer = ChatSessionSerializer(session, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ChatSessionDetailSerializer(session).data)

    def delete(self, request, pk):
        self.get_session(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChatMessageCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ChatRateThrottle]

    def post(self, request, pk):
        session = get_object_or_404(ChatSession, pk=pk, user=request.user)
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        text = serializer.validated_data['text']

        history = list(session.messages.values_list('role', 'text'))
        history.append(('user', text))
        try:
            reply_text = generate_reply(history, session.language)
        except GeminiError:
            # Nothing is saved, so the frontend can retry with the same text.
            return Response(
                {'detail': 'The AI service is unavailable. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            user_message = ChatMessage.objects.create(session=session, role='user', text=text)
            reply = ChatMessage.objects.create(session=session, role='model', text=reply_text)
            if not session.title:
                session.title = text if len(text) <= TITLE_LENGTH else text[:TITLE_LENGTH - 1].rstrip() + '…'
            session.save(update_fields=['title', 'updated_at'])

        return Response(
            {
                'user_message': ChatMessageSerializer(user_message).data,
                'reply': ChatMessageSerializer(reply).data,
            },
            status=status.HTTP_201_CREATED,
        )


class SavedTripListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        trips = request.user.saved_trips.select_related('budget')
        return Response(SavedTripSerializer(trips, many=True).data)

    def post(self, request):
        serializer = SavedTripDetailSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        trip = serializer.save(user=request.user)
        return Response(SavedTripDetailSerializer(trip).data, status=status.HTTP_201_CREATED)


class SavedTripDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_trip(self, request, pk):
        return get_object_or_404(SavedTrip, pk=pk, user=request.user)

    def get(self, request, pk):
        return Response(SavedTripDetailSerializer(self.get_trip(request, pk)).data)

    def patch(self, request, pk):
        trip = self.get_trip(request, pk)
        serializer = SavedTripDetailSerializer(trip, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        self.get_trip(request, pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
