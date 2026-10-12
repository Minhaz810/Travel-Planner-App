from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from planner.models import SavedTrip

from .models import Expense, TripBudget
from .serializers import ExpenseSerializer, TripBudgetSerializer


def get_trip(request, trip_id):
    # Other users' trips return 404, not 403.
    return get_object_or_404(SavedTrip, pk=trip_id, user=request.user)


def get_budget(request, trip_id):
    return get_object_or_404(
        TripBudget.objects.prefetch_related('expenses'), saved_trip=get_trip(request, trip_id),
    )


class TripBudgetView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id):
        return Response(TripBudgetSerializer(get_budget(request, trip_id)).data)

    def put(self, request, trip_id):
        trip = get_trip(request, trip_id)
        existing = TripBudget.objects.filter(saved_trip=trip).first()
        # PUT replaces the whole budget, so a missing `travelers` resets to the default.
        data = {'travelers': 1, **request.data.dict()} if hasattr(request.data, 'dict') else {'travelers': 1, **request.data}
        serializer = TripBudgetSerializer(existing, data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(saved_trip=trip)
        return Response(
            TripBudgetSerializer(get_budget(request, trip_id)).data,
            status=status.HTTP_200_OK if existing else status.HTTP_201_CREATED,
        )

    def patch(self, request, trip_id):
        budget = get_budget(request, trip_id)
        serializer = TripBudgetSerializer(budget, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TripBudgetSerializer(get_budget(request, trip_id)).data)


class ExpenseListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, trip_id):
        expenses = get_budget(request, trip_id).expenses.all()
        category = request.query_params.get('category')
        if category:
            expenses = expenses.filter(category=category)
        return Response(ExpenseSerializer(expenses, many=True).data)

    def post(self, request, trip_id):
        budget = TripBudget.objects.filter(saved_trip=get_trip(request, trip_id)).first()
        if budget is None:
            return Response({'detail': 'Set a budget for this trip first.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(trip_budget=budget)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_expense(self, request, trip_id, expense_id):
        return get_object_or_404(Expense, pk=expense_id, trip_budget__saved_trip=get_trip(request, trip_id))

    def patch(self, request, trip_id, expense_id):
        expense = self.get_expense(request, trip_id, expense_id)
        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, trip_id, expense_id):
        self.get_expense(request, trip_id, expense_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
