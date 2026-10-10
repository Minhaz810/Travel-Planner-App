from io import StringIO

from django.core.management import call_command
from django.db import connection
from django.test.utils import CaptureQueriesContext
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Attraction, Destination, District, TransportRoute


class DestinationsApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('seed_bd', stdout=StringIO())
        dhaka = District.objects.get(slug='dhaka')
        coxs = District.objects.get(slug='coxs-bazar')
        TransportRoute.objects.create(
            from_district=dhaka, to_district=coxs, mode='train', duration_hrs='9.0',
            cost_min_bdt='700.00', cost_max_bdt='2500.00', operators='Bangladesh Railway',
        )
        TransportRoute.objects.create(
            from_district=dhaka, to_district=coxs, mode='other', duration_hrs='11.0',
            cost_min_bdt='1000.00', cost_max_bdt='2200.00',
        )
        Attraction.objects.create(
            destination=Destination.objects.get(slug='sajek-valley'),
            name_en='Konglak Hill', name_bn='কংলাক পাহাড়', duration_hrs='2.0',
        )

    def test_divisions(self):
        res = self.client.get('/api/destinations/divisions/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 8)
        self.assertEqual(set(res.data[0]), {'id', 'slug', 'name_en', 'name_bn'})

    def test_districts_filtered_by_division(self):
        res = self.client.get('/api/destinations/districts/', {'division': 'sylhet'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual({d['slug'] for d in res.data}, {'sylhet', 'moulvibazar'})

    def test_destination_list_is_paginated_with_cover(self):
        with CaptureQueriesContext(connection) as ctx:
            res = self.client.get('/api/destinations/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 12)
        self.assertLessEqual(len(ctx.captured_queries), 3)  # count + page + images prefetch
        item = next(d for d in res.data['results'] if d['slug'] == 'coxs-bazar-beach')
        self.assertEqual(item['cover_image'], '/media/destinations/coxs-bazar-beach-1.jpg')
        self.assertEqual(item['district']['slug'], 'coxs-bazar')
        self.assertFalse(item['is_favorite'])

    def test_destination_filters(self):
        get = lambda **p: self.client.get('/api/destinations/', p).data
        self.assertTrue(all(d['category'] == 'beach' for d in get(category='beach')['results']))
        self.assertEqual({d['slug'] for d in get(district='sylhet')['results']}, {'ratargul-swamp-forest', 'jaflong'})
        self.assertGreater(get(search='Sajek')['count'], 0)
        self.assertTrue(all(7 in d['best_months'] for d in get(month=7)['results']))
        self.assertTrue(all(float(d['avg_daily_cost_bdt']) <= 2000 for d in get(max_daily_cost=2000)['results']))
        self.assertTrue(all(d['is_featured'] for d in get(featured='true')['results']))
        costs = [float(d['avg_daily_cost_bdt']) for d in get(ordering='-avg_daily_cost_bdt')['results']]
        self.assertEqual(costs, sorted(costs, reverse=True))

    def test_destination_list_rejects_bad_params(self):
        self.assertEqual(self.client.get('/api/destinations/', {'month': '13'}).status_code, 400)
        self.assertEqual(self.client.get('/api/destinations/', {'max_daily_cost': 'abc'}).status_code, 400)

    def test_destination_detail(self):
        res = self.client.get('/api/destinations/sajek-valley/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data['images']), 3)
        self.assertIn('credit', res.data['images'][0])
        self.assertLessEqual(len(res.data['stays']), 5)
        self.assertEqual(res.data['attractions'][0]['name_en'], 'Konglak Hill')
        self.assertEqual(self.client.get('/api/destinations/nowhere/').status_code, 404)

    def test_stays_filtered_by_type(self):
        res = self.client.get('/api/destinations/coxs-bazar-beach/stays/', {'stay_type': 'budget'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data)
        self.assertTrue(all(s['stay_type'] == 'budget' for s in res.data))

    def test_attractions(self):
        res = self.client.get('/api/destinations/sajek-valley/attractions/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)

    def test_routes(self):
        res = self.client.get('/api/destinations/routes/', {'from': 'dhaka', 'to': 'coxs-bazar'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual([r['mode'] for r in res.data], ['train', 'other'])
        self.assertEqual(res.data[0]['to_district']['slug'], 'coxs-bazar')

        res = self.client.get('/api/destinations/routes/', {'from': 'dhaka', 'to': 'coxs-bazar', 'mode': 'train'})
        self.assertEqual(len(res.data), 1)

        res = self.client.get('/api/destinations/routes/', {'from': 'dhaka'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('to', res.data)

    def test_read_only(self):
        res = self.client.post('/api/destinations/', {})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
