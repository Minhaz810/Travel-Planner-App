from django.contrib import admin

from .models import Expense, TripBudget

admin.site.register(TripBudget)
admin.site.register(Expense)
