from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from planner.models import SavedTrip


CATEGORY_CHOICES = [
    ('transport', 'Transport'),
    ('stay', 'Stay'),
    ('food', 'Food'),
    ('tickets', 'Tickets'),
    ('shopping', 'Shopping'),
    ('other', 'Other'),
]


class TripBudget(models.Model):
    saved_trip = models.OneToOneField(SavedTrip, on_delete=models.CASCADE, related_name='budget')
    total_budget_bdt = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    travelers = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Budget for {self.saved_trip}'


class Expense(models.Model):
    trip_budget = models.ForeignKey(TripBudget, on_delete=models.CASCADE, related_name='expenses')
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    amount_bdt = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    note = models.CharField(max_length=200, blank=True)
    date = models.DateField(default=timezone.localdate)
    paid_by = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f'{self.category} ৳{self.amount_bdt}'
