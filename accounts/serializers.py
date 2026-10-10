from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import LANGUAGE_CHOICES, Profile


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['preferred_language', 'travel_style', 'updated_at']
        read_only_fields = ['updated_at']
        extra_kwargs = {'travel_style': {'allow_null': True}}

    def validate_travel_style(self, value):
        # The column is blank, not nullable, so `null` (clear it) is stored as ''.
        return value or ''

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['travel_style'] = data['travel_style'] or None
        return data


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'profile']
        read_only_fields = ['id', 'username', 'email', 'is_staff']


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    preferred_language = serializers.ChoiceField(choices=LANGUAGE_CHOICES, default='en', write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'preferred_language']

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def validate(self, attrs):
        user = User(**{k: v for k, v in attrs.items() if k not in ('password', 'preferred_language')})
        try:
            validate_password(attrs['password'], user)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        preferred_language = validated_data.pop('preferred_language')
        user = User.objects.create_user(**validated_data)
        # The profile is created by the post_save signal.
        user.profile.preferred_language = preferred_language
        user.profile.save()
        return user
