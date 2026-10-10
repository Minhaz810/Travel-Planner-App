from django.contrib.auth.models import User
from django.db import models


LANGUAGE_CHOICES = [
    ('en', 'English'),
    ('bn', 'বাংলা'),
]

TRAVEL_STYLE_CHOICES = [
    ('budget', 'Budget'),
    ('comfort', 'Comfort'),
    ('luxury', 'Luxury'),
]


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    preferred_language = models.CharField(max_length=2, choices=LANGUAGE_CHOICES, default='en')
    # TODO: add `home_district = FK('destinations.District', null=True)` once the destinations app exists.
    travel_style = models.CharField(max_length=10, choices=TRAVEL_STYLE_CHOICES, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Profile of {self.user.username}'
