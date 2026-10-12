from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from planner.models import SavedTrip

from .models import Expense


class BudgetApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='rahim', password='s3cret-pass-123')
        self.other = User.objects.create_user(username='karim', password='s3cret-pass-123')
        self.trip = SavedTrip.objects.create(user=self.user, title='Sylhet', content='...')
        self.url = f'/api/planner/trips/{self.trip.id}/budget/'
        self.expenses_url = self.url + 'expenses/'
        self.client.force_authenticate(self.user)

    def set_budget(self, total='10000.00', travelers=2):
        return self.client.put(self.url, {'total_budget_bdt': total, 'travelers': travelers}, format='json')

    def add(self, **data):
        res = self.client.post(self.expenses_url, {'category': 'food', 'amount_bdt': '100.00', **data}, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        return res.data

    def test_no_budget_yet(self):
        self.assertEqual(self.client.get(self.url).status_code, 404)
        res = self.client.post(self.expenses_url, {'category': 'food', 'amount_bdt': '10'})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['detail'], 'Set a budget for this trip first.')

    def test_put_creates_then_replaces(self):
        res = self.set_budget()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['total_budget_bdt'], '10000.00')
        self.assertEqual(res.data['spent'], '0.00')
        self.assertEqual(res.data['percent_used'], 0.0)

        res = self.client.put(self.url, {'total_budget_bdt': '8000'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['travelers'], 1)  # replaced, so back to the default

    def test_summary_totals(self):
        self.set_budget()
        self.add(category='transport', amount_bdt='2400.00')
        self.add(category='stay', amount_bdt='3000.00')
        self.add(category='food', amount_bdt='950.00')
        res = self.client.get(self.url)
        self.assertEqual(res.data['spent'], '6350.00')
        self.assertEqual(res.data['remaining'], '3650.00')
        self.assertEqual(res.data['percent_used'], 63.5)
        self.assertEqual(res.data['per_person'], '3175.00')
        self.assertFalse(res.data['is_over_budget'])
        self.assertEqual(res.data['per_category']['transport'], '2400.00')
        self.assertEqual(res.data['per_category']['tickets'], '0.00')
        self.assertEqual(len(res.data['expenses']), 3)

    def test_over_budget_and_zero_budget(self):
        self.set_budget(total='1000.00', travelers=1)
        self.add(amount_bdt='1500.00')
        res = self.client.get(self.url)
        self.assertTrue(res.data['is_over_budget'])
        self.assertEqual(res.data['remaining'], '-500.00')
        self.assertEqual(res.data['percent_used'], 150.0)

        res = self.client.patch(self.url, {'total_budget_bdt': '0'}, format='json')
        self.assertIsNone(res.data['percent_used'])

    def test_budget_validation(self):
        self.assertEqual(self.set_budget(total='-1').status_code, 400)
        self.assertEqual(self.set_budget(travelers=0).status_code, 400)

    def test_patch_budget(self):
        self.set_budget()
        res = self.client.patch(self.url, {'travelers': 3}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['travelers'], 3)
        self.assertEqual(res.data['total_budget_bdt'], '10000.00')

    def test_expense_defaults_order_and_filter(self):
        self.set_budget()
        first = self.add(category='food', date='2026-11-14')
        second = self.add(category='transport', date='2026-11-15', note='Bus', paid_by='Karim')
        today = self.add()
        self.assertEqual(today['date'], timezone.localdate().isoformat())

        res = self.client.get(self.expenses_url)
        dates = [e['date'] for e in res.data]
        self.assertEqual(dates, sorted(dates, reverse=True))

        res = self.client.get(self.expenses_url, {'category': 'transport'})
        self.assertEqual([e['id'] for e in res.data], [second['id']])
        self.assertNotIn(first['id'], [e['id'] for e in res.data])

    def test_expense_validation(self):
        self.set_budget()
        res = self.client.post(self.expenses_url, {'category': 'food', 'amount_bdt': '0'}, format='json')
        self.assertIn('amount_bdt', res.data)
        res = self.client.post(self.expenses_url, {'category': 'flight', 'amount_bdt': '10'}, format='json')
        self.assertIn('category', res.data)

    def test_update_and_delete_expense(self):
        self.set_budget()
        expense = self.add()
        url = f"{self.expenses_url}{expense['id']}/"
        res = self.client.patch(url, {'amount_bdt': '500.00'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['amount_bdt'], '500.00')
        self.assertEqual(self.client.get(self.url).data['spent'], '500.00')

        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(Expense.objects.exists())

    def test_trip_endpoints_include_budget(self):
        self.set_budget()
        self.add(amount_bdt='250.00')
        trips = self.client.get('/api/planner/trips/').data
        self.assertTrue(trips[0]['has_budget'])
        detail = self.client.get(f'/api/planner/trips/{self.trip.id}/').data
        self.assertEqual(detail['budget']['spent'], '250.00')

    def test_deleting_trip_deletes_budget(self):
        self.set_budget()
        self.add()
        self.client.delete(f'/api/planner/trips/{self.trip.id}/')
        self.assertFalse(Expense.objects.exists())

    def test_cannot_touch_other_users_budget(self):
        self.set_budget()
        expense = self.add()
        self.client.force_authenticate(self.other)
        self.assertEqual(self.client.get(self.url).status_code, 404)
        self.assertEqual(self.set_budget().status_code, 404)
        self.assertEqual(self.client.get(self.expenses_url).status_code, 404)
        self.assertEqual(self.client.delete(f"{self.expenses_url}{expense['id']}/").status_code, 404)

    def test_requires_auth(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(self.url).status_code, 401)
