from django.urls import path

from .views import ExpenseDetailView, ExpenseListView, TripBudgetView

# Mounted at /api/planner/trips/<trip_id>/budget/
urlpatterns = [
    path('', TripBudgetView.as_view(), name='trip-budget'),
    path('expenses/', ExpenseListView.as_view(), name='budget-expenses'),
    path('expenses/<int:expense_id>/', ExpenseDetailView.as_view(), name='budget-expense-detail'),
]
