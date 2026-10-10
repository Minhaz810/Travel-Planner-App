from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase


class AuthApiTests(APITestCase):
    register_url = '/api/auth/register/'
    login_url = '/api/auth/login/'
    refresh_url = '/api/auth/refresh/'
    logout_url = '/api/auth/logout/'
    me_url = '/api/auth/me/'

    def setUp(self):
        self.user = User.objects.create_user(
            username='rahim', email='rahim@example.com', password='s3cret-pass-123', first_name='Rahim',
        )

    def login(self):
        res = self.client.post(self.login_url, {'username': 'rahim', 'password': 's3cret-pass-123'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        return res.data

    def test_register_returns_tokens_and_user(self):
        res = self.client.post(self.register_url, {
            'username': 'karim',
            'email': 'karim@example.com',
            'first_name': 'Karim',
            'last_name': 'Uddin',
            'password': 's3cret-pass-456',
            'preferred_language': 'bn',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertEqual(res.data['user']['username'], 'karim')
        self.assertEqual(res.data['user']['profile']['preferred_language'], 'bn')
        self.assertNotIn('password', res.data['user'])

    def test_register_rejects_duplicate_email(self):
        res = self.client.post(self.register_url, {
            'username': 'other', 'email': 'RAHIM@example.com', 'password': 's3cret-pass-456',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', res.data)

    def test_register_rejects_weak_password(self):
        res = self.client.post(self.register_url, {
            'username': 'karim', 'email': 'karim@example.com', 'password': '123',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', res.data)

    def test_login_with_wrong_password(self):
        res = self.client.post(self.login_url, {'username': 'rahim', 'password': 'wrong'})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_and_blacklists_old_token(self):
        tokens = self.login()
        res = self.client.post(self.refresh_url, {'refresh': tokens['refresh']})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        res = self.client.post(self.refresh_url, {'refresh': tokens['refresh']})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_blacklists_refresh_token(self):
        tokens = self.login()
        res = self.client.post(self.logout_url, {'refresh': tokens['refresh']})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        res = self.client.post(self.refresh_url, {'refresh': tokens['refresh']})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_auth(self):
        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_get_and_patch(self):
        tokens = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        res = self.client.get(self.me_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], 'rahim@example.com')
        self.assertEqual(res.data['profile']['preferred_language'], 'en')

        res = self.client.patch(self.me_url, {'last_name': 'Ahmed', 'email': 'new@example.com', 'is_staff': True})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['last_name'], 'Ahmed')
        self.assertEqual(res.data['email'], 'rahim@example.com')
        self.assertFalse(res.data['is_staff'])

    def test_me_put_not_allowed(self):
        tokens = self.login()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        res = self.client.put(self.me_url, {'first_name': 'X'})
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
