from rest_framework import serializers

from budget.models import TripBudget
from budget.serializers import TripBudgetSerializer

from .models import ChatMessage, ChatSession, SavedTrip


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'text', 'created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatSession
        fields = ['id', 'title', 'language', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChatSessionDetailSerializer(ChatSessionSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta(ChatSessionSerializer.Meta):
        fields = ['id', 'title', 'language', 'messages', 'created_at', 'updated_at']


class SendMessageSerializer(serializers.Serializer):
    text = serializers.CharField(max_length=2000, trim_whitespace=True)


class SavedTripSerializer(serializers.ModelSerializer):
    has_budget = serializers.SerializerMethodField()

    class Meta:
        model = SavedTrip
        fields = ['id', 'title', 'start_date', 'source_message', 'has_budget', 'created_at', 'updated_at']

    def get_has_budget(self, obj):
        return hasattr(obj, 'budget')


class SavedTripDetailSerializer(serializers.ModelSerializer):
    content = serializers.CharField(required=False)
    budget = serializers.SerializerMethodField()

    class Meta:
        model = SavedTrip
        fields = ['id', 'title', 'content', 'start_date', 'source_message', 'budget', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_budget(self, obj):
        try:
            return TripBudgetSerializer(obj.budget).data
        except TripBudget.DoesNotExist:
            return None

    def get_fields(self):
        fields = super().get_fields()
        # The source message is only set when the trip is created.
        if self.instance is not None:
            fields['source_message'].read_only = True
        return fields

    def validate_source_message(self, message):
        user = self.context['request'].user
        if message is not None and (message.role != 'model' or message.session.user_id != user.id):
            raise serializers.ValidationError('Must be an AI reply from one of your own chats.')
        return message

    def validate(self, attrs):
        if self.instance is None and not attrs.get('content'):
            message = attrs.get('source_message')
            if message is None:
                raise serializers.ValidationError({'content': ['This field is required without a source_message.']})
            attrs['content'] = message.text
        return attrs
