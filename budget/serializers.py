from decimal import Decimal

from rest_framework import serializers

from .models import CATEGORY_CHOICES, Expense, TripBudget


def money(value):
    return f'{value:.2f}'


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount_bdt', 'note', 'date', 'paid_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class TripBudgetSerializer(serializers.ModelSerializer):
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percent_used = serializers.SerializerMethodField()
    per_person = serializers.SerializerMethodField()
    is_over_budget = serializers.SerializerMethodField()
    per_category = serializers.SerializerMethodField()
    expenses = ExpenseSerializer(many=True, read_only=True)

    class Meta:
        model = TripBudget
        fields = [
            'total_budget_bdt', 'travelers', 'spent', 'remaining', 'percent_used', 'per_person',
            'is_over_budget', 'per_category', 'expenses',
        ]

    # Totals are computed from the (prefetched) expenses rather than stored.
    def _spent(self, obj):
        return sum((e.amount_bdt for e in obj.expenses.all()), Decimal('0'))

    def get_spent(self, obj):
        return money(self._spent(obj))

    def get_remaining(self, obj):
        return money(obj.total_budget_bdt - self._spent(obj))

    def get_percent_used(self, obj):
        # `null` when the budget is 0, because a percentage of nothing is undefined.
        if not obj.total_budget_bdt:
            return None
        return round(float(self._spent(obj) / obj.total_budget_bdt * 100), 1)

    def get_per_person(self, obj):
        return money(self._spent(obj) / obj.travelers)

    def get_is_over_budget(self, obj):
        return self._spent(obj) > obj.total_budget_bdt

    def get_per_category(self, obj):
        totals = {key: Decimal('0') for key, _ in CATEGORY_CHOICES}
        for expense in obj.expenses.all():
            totals[expense.category] += expense.amount_bdt
        return {key: money(value) for key, value in totals.items()}
