from unittest import mock

from django.contrib.auth.models import User
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

from .gemini import GeminiError
from .models import ChatMessage, ChatSession, SavedTrip
from .views import ChatRateThrottle

REPLY = '## Day 1\n- Ratargul Swamp Forest'


class PlannerApiTests(APITestCase):
    def setUp(self):
        cache.clear()  # throttle history
        self.user = User.objects.create_user(username='rahim', password='s3cret-pass-123')
        self.other = User.objects.create_user(username='karim', password='s3cret-pass-123')
        self.client.force_authenticate(self.user)

    def create_chat(self, **data):
        res = self.client.post('/api/planner/chats/', data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        return res.data

    def send(self, chat_id, text, reply=REPLY):
        with mock.patch('planner.views.generate_reply', return_value=reply) as gen:
            res = self.client.post(f'/api/planner/chats/{chat_id}/messages/', {'text': text})
        return res, gen

    # ---- chats ----

    def test_requires_auth(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get('/api/planner/chats/').status_code, 401)
        self.assertEqual(self.client.get('/api/planner/trips/').status_code, 401)

    def test_create_chat_defaults_to_profile_language(self):
        self.user.profile.preferred_language = 'bn'
        self.user.profile.save()
        chat = self.create_chat()
        self.assertEqual(chat['language'], 'bn')
        self.assertEqual(chat['title'], '')
        self.assertEqual(chat['messages'], [])
        self.assertEqual(self.create_chat(language='en')['language'], 'en')

    def test_send_message_stores_both_and_sets_title(self):
        chat = self.create_chat()
        res, gen = self.send(chat['id'], 'Plan 3 days in Sylhet for 2 people under 10,000 taka')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['user_message']['role'], 'user')
        self.assertEqual(res.data['reply']['role'], 'model')
        self.assertEqual(res.data['reply']['text'], REPLY)
        gen.assert_called_once_with([('user', 'Plan 3 days in Sylhet for 2 people under 10,000 taka')], 'en')

        detail = self.client.get(f"/api/planner/chats/{chat['id']}/").data
        self.assertEqual([m['role'] for m in detail['messages']], ['user', 'model'])
        self.assertEqual(detail['title'], 'Plan 3 days in Sylhet for 2 people under 10,000 taka')

        # The second message sends the full history and keeps the title.
        res, gen = self.send(chat['id'], 'Make it 2 days')
        history = gen.call_args.args[0]
        self.assertEqual([role for role, _ in history], ['user', 'model', 'user'])
        self.assertEqual(ChatSession.objects.get(pk=chat['id']).title, detail['title'])

    def test_long_first_message_title_is_truncated(self):
        chat = self.create_chat()
        self.send(chat['id'], 'x' * 200)
        self.assertEqual(len(ChatSession.objects.get(pk=chat['id']).title), 60)

    def test_gemini_failure_returns_502_and_saves_nothing(self):
        chat = self.create_chat()
        with mock.patch('planner.views.generate_reply', side_effect=GeminiError('down')):
            res = self.client.post(f"/api/planner/chats/{chat['id']}/messages/", {'text': 'Hello'})
        self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertEqual(res.data['detail'], 'The AI service is unavailable. Please try again.')
        self.assertFalse(ChatMessage.objects.exists())

    def test_message_validation(self):
        chat = self.create_chat()
        self.assertEqual(self.send(chat['id'], '   ')[0].status_code, 400)
        self.assertEqual(self.send(chat['id'], 'x' * 2001)[0].status_code, 400)

    def test_message_rate_limit(self):
        chat = self.create_chat()
        with mock.patch.object(ChatRateThrottle, 'THROTTLE_RATES', {'chat': '2/min'}):
            codes = [self.send(chat['id'], f'Hi {i}')[0].status_code for i in range(3)]
        self.assertEqual(codes, [201, 201, 429])

    def test_list_rename_and_delete_chat(self):
        old = self.create_chat()
        new = self.create_chat()
        self.send(old['id'], 'Bump me')  # updated_at moves old to the top
        ids = [c['id'] for c in self.client.get('/api/planner/chats/').data]
        self.assertEqual(ids, [old['id'], new['id']])
        self.assertNotIn('messages', self.client.get('/api/planner/chats/').data[0])

        res = self.client.patch(f"/api/planner/chats/{old['id']}/", {'title': 'Sylhet ideas', 'language': 'bn'})
        self.assertEqual(res.status_code, 200)
        self.assertEqual((res.data['title'], res.data['language']), ('Sylhet ideas', 'bn'))
        self.assertEqual(len(res.data['messages']), 2)

        self.assertEqual(self.client.delete(f"/api/planner/chats/{old['id']}/").status_code, 204)
        self.assertFalse(ChatMessage.objects.exists())

    def test_cannot_touch_other_users_chats(self):
        theirs = ChatSession.objects.create(user=self.other)
        self.assertEqual(self.client.get(f'/api/planner/chats/{theirs.id}/').status_code, 404)
        self.assertEqual(self.client.delete(f'/api/planner/chats/{theirs.id}/').status_code, 404)
        self.assertEqual(self.send(theirs.id, 'hi')[0].status_code, 404)

    # ---- trips ----

    def chat_with_reply(self):
        chat = self.create_chat()
        res, _ = self.send(chat['id'], 'Plan Sylhet')
        return res.data['reply']['id'], res.data['user_message']['id']

    def test_save_reply_as_trip_copies_content(self):
        reply_id, _ = self.chat_with_reply()
        res = self.client.post('/api/planner/trips/', {
            'source_message': reply_id, 'title': 'Sylhet 3-day plan', 'start_date': '2026-11-14',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['content'], REPLY)
        self.assertEqual(res.data['source_message'], reply_id)
        self.assertIsNone(res.data['budget'])

        trips = self.client.get('/api/planner/trips/').data
        self.assertEqual(trips[0]['title'], 'Sylhet 3-day plan')
        self.assertFalse(trips[0]['has_budget'])
        self.assertNotIn('content', trips[0])

    def test_trip_source_must_be_own_model_message(self):
        reply_id, user_msg_id = self.chat_with_reply()
        res = self.client.post('/api/planner/trips/', {'source_message': user_msg_id, 'title': 'X'})
        self.assertEqual(res.status_code, 400)
        self.assertIn('source_message', res.data)

        self.client.force_authenticate(self.other)
        res = self.client.post('/api/planner/trips/', {'source_message': reply_id, 'title': 'X'})
        self.assertEqual(res.status_code, 400)

    def test_trip_needs_content_or_source(self):
        res = self.client.post('/api/planner/trips/', {'title': 'Empty'})
        self.assertEqual(res.status_code, 400)
        self.assertIn('content', res.data)
        res = self.client.post('/api/planner/trips/', {'title': 'Manual', 'content': 'My own notes'})
        self.assertEqual(res.status_code, 201)
        self.assertIsNone(res.data['source_message'])

    def test_update_and_delete_trip(self):
        reply_id, _ = self.chat_with_reply()
        trip = self.client.post('/api/planner/trips/', {'source_message': reply_id, 'title': 'Sylhet'}).data
        url = f"/api/planner/trips/{trip['id']}/"

        res = self.client.patch(
            url, {'title': 'Sylhet with family', 'start_date': '2026-12-01', 'source_message': None},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['title'], 'Sylhet with family')
        self.assertEqual(res.data['start_date'], '2026-12-01')
        self.assertEqual(res.data['source_message'], reply_id)  # read-only after creation
        self.assertEqual(self.client.put(url, {'title': 'x'}).status_code, 405)

        self.assertEqual(self.client.delete(url).status_code, 204)
        self.assertFalse(SavedTrip.objects.exists())

    def test_trip_survives_chat_deletion(self):
        reply_id, _ = self.chat_with_reply()
        trip = self.client.post('/api/planner/trips/', {'source_message': reply_id, 'title': 'Keep me'}).data
        ChatSession.objects.all().delete()
        res = self.client.get(f"/api/planner/trips/{trip['id']}/")
        self.assertEqual(res.status_code, 200)
        self.assertIsNone(res.data['source_message'])
        self.assertEqual(res.data['content'], REPLY)

    def test_cannot_touch_other_users_trips(self):
        theirs = SavedTrip.objects.create(user=self.other, title='Theirs', content='...')
        self.assertEqual(self.client.get(f'/api/planner/trips/{theirs.id}/').status_code, 404)
        self.assertEqual(self.client.patch(f'/api/planner/trips/{theirs.id}/', {'title': 'x'}).status_code, 404)


class GeminiClientTests(APITestCase):
    def test_missing_key_raises(self):
        from .gemini import generate_reply
        with self.settings(GEMINI_API_KEY=''):
            with self.assertRaises(GeminiError):
                generate_reply([('user', 'hi')], 'en')

    def test_builds_request_and_returns_text(self):
        from .gemini import generate_reply
        with self.settings(GEMINI_API_KEY='test-key', GEMINI_MODEL='test-model'), \
                mock.patch('planner.gemini.genai.Client') as client_cls:
            client_cls.return_value.models.generate_content.return_value.text = '  Hello!  '
            text = generate_reply([('user', 'hi'), ('model', 'hello'), ('user', 'plan')], 'bn')
        self.assertEqual(text, 'Hello!')
        kwargs = client_cls.return_value.models.generate_content.call_args.kwargs
        self.assertEqual(kwargs['model'], 'test-model')
        self.assertEqual([c.role for c in kwargs['contents']], ['user', 'model', 'user'])
        self.assertIn('Bangla', kwargs['config'].system_instruction)

    def test_api_error_becomes_gemini_error(self):
        from .gemini import generate_reply
        with self.settings(GEMINI_API_KEY='test-key'), mock.patch('planner.gemini.genai.Client') as client_cls:
            client_cls.return_value.models.generate_content.side_effect = RuntimeError('quota')
            with self.assertRaises(GeminiError):
                generate_reply([('user', 'hi')], 'en')
