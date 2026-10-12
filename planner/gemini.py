import logging

from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

# Only the most recent messages are sent, to keep requests small.
HISTORY_LIMIT = 20

SYSTEM_PROMPT = """You are a friendly travel assistant for trips inside Bangladesh.
- Suggest destinations, day-by-day plans, where to stay, what to eat and how to get around.
- Give all costs in Bangladeshi Taka (BDT, ৳) and say they are estimates.
- Transport options are car, bus, train and launch (river boat). Never suggest flights.
- Mention the best season and any safety tips when relevant.
- Format replies in short markdown: headings for days, bullet points, and a cost summary when you plan a trip.
- If a question is not about travel in Bangladesh, politely steer back to trip planning.
- Reply in {language}."""

LANGUAGE_NAMES = {'en': 'English', 'bn': 'Bangla (বাংলা)'}


class GeminiError(Exception):
    """The AI service could not produce a reply."""


def generate_reply(history, language):
    """Return Gemini's reply text for `history`, a list of (role, text) pairs ending with the user's message."""
    if not settings.GEMINI_API_KEY:
        logger.error('GEMINI_API_KEY is not set.')
        raise GeminiError('GEMINI_API_KEY is not set.')

    contents = [
        types.Content(role=role, parts=[types.Part(text=text)])
        for role, text in history[-HISTORY_LIMIT:]
    ]
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT.format(language=LANGUAGE_NAMES.get(language, 'English')),
        temperature=0.7,
    )

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=contents, config=config)
        text = (response.text or '').strip()
    except Exception as exc:  # network, auth, quota and safety errors all mean "no reply"
        logger.exception('Gemini request failed')
        raise GeminiError(str(exc)) from exc

    if not text:
        raise GeminiError('Gemini returned an empty reply.')
    return text
