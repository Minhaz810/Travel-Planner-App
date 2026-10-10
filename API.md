# Backend — REST API

The endpoints the React frontend calls, grouped by Django app. They are built on the models in [Models.md](Models.md).

> **Status:** the `accounts` endpoints `register`, `login`, `refresh`, `logout` and `me` are implemented (`accounts/urls.py`). Everything else is still **planned**. Update this file as views are implemented or changed.

## Conventions

- **Base URL:** `/api/`. Each app has its own prefix, for example `/api/destinations/`.
- **Format:** JSON for requests and responses. Image uploads are the only exception and use `multipart/form-data`.
- **Auth:** JWT via `djangorestframework-simplejwt`. Login returns an `access` token (30 min) and a `refresh` token (7 days). Send the access token in this header:
  ```
  Authorization: Bearer <access>
  ```
  Endpoints marked 🔒 need the header. Endpoints marked 🌐 are public. When the access token expires the API returns `401`; call `POST /api/auth/refresh/` to get a new pair, then retry. Refresh tokens rotate, so always store the new `refresh` too. Lifetimes are set in `.env` (`JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`).
- **Language:** text fields come back with both `_en` and `_bn` variants. The frontend picks one based on `profile.preferred_language`.
- **Money:** every `_bdt` field is a **string** decimal in BDT, such as `"1500.00"`. DRF serializes `DecimalField` as a string so precision is kept.
- **Dates:** `YYYY-MM-DD`. Timestamps are ISO 8601, such as `2026-10-10T09:30:00Z`.
- **Pagination:** list endpoints marked *(paginated)* use DRF `PageNumberPagination` with `?page=` and a page size of 20:
  ```json
  { "count": 42, "next": "/api/destinations/?page=2", "previous": null, "results": [ ... ] }
  ```
- **Errors:** DRF's default format.
  ```json
  // 400 validation error
  { "username": ["A user with that username already exists."] }
  // 401 / 403 / 404
  { "detail": "Authentication credentials were not provided." }
  ```
- **Ownership:** 🔒 planner, budget and favorites endpoints only return the caller's own rows. Another user's id returns `404`, not `403`.

### Example `fetch` call

```js
const res = await fetch("/api/planner/trips/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${access}`,
  },
  body: JSON.stringify({ title: "Sajek weekend", content: "...", start_date: "2026-11-14" }),
});
if (!res.ok) throw await res.json();
const trip = await res.json();
```

---

## Endpoint summary

| App | Method | Path | Auth |
|---|---|---|---|
| accounts | `POST` | `/api/auth/register/` | 🌐 |
| accounts | `POST` | `/api/auth/login/` | 🌐 |
| accounts | `POST` | `/api/auth/refresh/` | 🌐 |
| accounts | `POST` | `/api/auth/logout/` | 🌐 |
| accounts | `GET` / `PATCH` | `/api/auth/me/` | 🔒 |
| accounts | `GET` / `PATCH` | `/api/auth/profile/` | 🔒 |
| accounts | `POST` | `/api/auth/change-password/` | 🔒 |
| destinations | `GET` | `/api/destinations/divisions/` | 🌐 |
| destinations | `GET` | `/api/destinations/districts/` | 🌐 |
| destinations | `GET` | `/api/destinations/` | 🌐 |
| destinations | `GET` | `/api/destinations/{slug}/` | 🌐 |
| destinations | `GET` | `/api/destinations/{slug}/stays/` | 🌐 |
| destinations | `GET` | `/api/destinations/{slug}/attractions/` | 🌐 |
| destinations | `GET` | `/api/destinations/routes/` | 🌐 |
| planner | `GET` / `POST` | `/api/planner/chats/` | 🔒 |
| planner | `GET` / `PATCH` / `DELETE` | `/api/planner/chats/{id}/` | 🔒 |
| planner | `POST` | `/api/planner/chats/{id}/messages/` | 🔒 |
| planner | `GET` / `POST` | `/api/planner/trips/` | 🔒 |
| planner | `GET` / `PATCH` / `DELETE` | `/api/planner/trips/{id}/` | 🔒 |
| budget | `GET` / `PUT` / `PATCH` | `/api/planner/trips/{id}/budget/` | 🔒 |
| budget | `GET` / `POST` | `/api/planner/trips/{id}/budget/expenses/` | 🔒 |
| budget | `PATCH` / `DELETE` | `/api/planner/trips/{id}/budget/expenses/{expense_id}/` | 🔒 |
| reviews | `GET` / `POST` | `/api/destinations/{slug}/reviews/` | 🌐 read · 🔒 write |
| reviews | `PATCH` / `DELETE` | `/api/reviews/{id}/` | 🔒 author only |
| reviews | `GET` / `POST` | `/api/favorites/` | 🔒 |
| reviews | `DELETE` | `/api/favorites/{destination_slug}/` | 🔒 |

Staff edit destinations data through Django Admin at `/admin/`. There are no write endpoints for it.

---

## 1. `accounts`

### `POST /api/auth/register/` 🌐
Creates a user and its `Profile`, then returns a JWT pair so the user is logged in straight away.

Request:
```json
{
  "username": "rahim",
  "email": "rahim@example.com",
  "first_name": "Rahim",
  "last_name": "Uddin",
  "password": "s3cret-pass",
  "preferred_language": "bn"
}
```
`username`, `email` and `password` are required. `first_name`, `last_name` and `preferred_language` are optional (`preferred_language` defaults to `"en"`).

Errors (`400`): a taken username, an email already used by another account (case-insensitive), or a password that fails Django's password validators:
```json
{ "password": ["This password is too short. It must contain at least 8 characters."] }
```

Response `201`:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIs...",
  "refresh": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "...": "same shape as GET /api/auth/me/" }
}
```

### `POST /api/auth/login/` 🌐
Request:
```json
{ "username": "rahim", "password": "s3cret-pass" }
```
Response `200`:
```json
{ "access": "eyJhbGciOiJIUzI1NiIs...", "refresh": "eyJhbGciOiJIUzI1NiIs..." }
```
This is Simple JWT's `TokenObtainPairView`. A wrong username or password returns `401` with `{ "detail": "No active account found with the given credentials" }`. Call `GET /api/auth/me/` afterwards to load the user.

### `POST /api/auth/refresh/` 🌐
Simple JWT's `TokenRefreshView`.

Request:
```json
{ "refresh": "eyJhbGciOiJIUzI1NiIs..." }
```
Response `200`: a new `access` and a new `refresh`. The old refresh token is blacklisted. An expired or blacklisted refresh token returns `401`, and the frontend should send the user to login.

### `POST /api/auth/logout/` 🌐
Simple JWT's `TokenBlacklistView`. Blacklists the refresh token so it can't be used again. The frontend should also delete both tokens from storage.

Request:
```json
{ "refresh": "eyJhbGciOiJIUzI1NiIs..." }
```
Response `200` with an empty body.

### `GET /api/auth/me/` 🔒
Response `200`:
```json
{
  "id": 7,
  "username": "rahim",
  "email": "rahim@example.com",
  "first_name": "Rahim",
  "last_name": "Uddin",
  "is_staff": false,
  "profile": {
    "preferred_language": "bn",
    "travel_style": "budget"
  }
}
```

### `PATCH /api/auth/me/` 🔒
Updates `first_name` and `last_name` only. `id`, `username`, `email`, `is_staff` and `profile` are read-only and silently ignored. Use `PATCH /api/auth/profile/` for profile fields. `PUT` returns `405`.

Request:
```json
{ "last_name": "Uddin Ahmed" }
```
Response `200`: same shape as `GET /api/auth/me/`.

### `GET /api/auth/profile/` 🔒
Returns the caller's `Profile`. The profile always exists because a `post_save` signal creates it with the user.

Response `200`:
```json
{
  "preferred_language": "bn",
  "home_district": { "id": 1, "slug": "dhaka", "name_en": "Dhaka", "name_bn": "ঢাকা" },
  "travel_style": "budget",
  "updated_at": "2026-10-10T09:30:00Z"
}
```

### `PATCH /api/auth/profile/` 🔒
Updates the caller's profile. Send only the fields that change. `PUT` is not supported.

Request:
```json
{
  "preferred_language": "en",
  "home_district": 12,
  "travel_style": "comfort"
}
```

| Field | Type | Rules |
|---|---|---|
| `preferred_language` | string | `en` or `bn`. This also sets the default language for new chat sessions |
| `home_district` | integer or `null` | a district id. `null` clears it |
| `travel_style` | string or `null` | `budget`, `comfort` or `luxury`. `null` clears it |

The request sends `home_district` as an id, and the response returns it as a nested object.

Response `200`: same shape as `GET /api/auth/profile/`.

Errors (`400`):
```json
{ "preferred_language": ["\"fr\" is not a valid choice."] }
{ "home_district": ["Invalid pk \"999\" - object does not exist."] }
```

### `POST /api/auth/change-password/` 🔒
Request:
```json
{ "old_password": "s3cret-pass", "new_password": "n3w-s3cret-pass" }
```
Response `204`.

---

## 2. `destinations`
All endpoints in this app are read-only and public.

### `GET /api/destinations/divisions/` 🌐
Returns all 8 divisions without pagination. Used to fill filter dropdowns.

Response `200`:
```json
[
  { "id": 1, "slug": "dhaka", "name_en": "Dhaka", "name_bn": "ঢাকা" },
  { "id": 2, "slug": "chattogram", "name_en": "Chattogram", "name_bn": "চট্টগ্রাম" }
]
```

### `GET /api/destinations/districts/` 🌐
Returns all 64 districts without pagination.

Query params:

| Param | Example | Notes |
|---|---|---|
| `division` | `chattogram` | division slug |

Response `200`:
```json
[
  { "id": 22, "slug": "coxs-bazar", "name_en": "Cox's Bazar", "name_bn": "কক্সবাজার", "division": 2 }
]
```

### `GET /api/destinations/` 🌐 *(paginated)*
Query params:

| Param | Example | Notes |
|---|---|---|
| `search` | `sajek` | matches `name_en`, `name_bn` and `tags` |
| `division` | `chattogram` | division slug |
| `district` | `rangamati` | district slug |
| `category` | `hill` | one of `beach`, `hill`, `forest`, `heritage`, `river`, `religious`, `city` |
| `month` | `12` | only destinations whose `best_months` include this month |
| `max_daily_cost` | `3000` | `avg_daily_cost_bdt` ≤ value |
| `featured` | `true` | home page list |
| `ordering` | `avg_daily_cost_bdt`, `-avg_rating` | prefix `-` for descending |

Each item in `results`:
```json
{
  "id": 5,
  "slug": "sajek-valley",
  "name_en": "Sajek Valley",
  "name_bn": "সাজেক ভ্যালি",
  "category": "hill",
  "district": { "id": 30, "slug": "rangamati", "name_en": "Rangamati", "name_bn": "রাঙামাটি" },
  "cover_image": "/media/destinations/sajek-valley-1.jpg",
  "avg_daily_cost_bdt": "2500.00",
  "best_months": [10, 11, 12, 1, 2],
  "tags": ["trekking", "clouds"],
  "is_featured": true,
  "avg_rating": 4.6,
  "review_count": 38,
  "is_favorite": false
}
```
`cover_image` is the URL of the destination's `is_cover` image, or the first image by `order`, or `null` if it has none. Use `prefetch_related("images")` to avoid N+1 queries. `avg_rating` and `review_count` are computed with annotations. `is_favorite` is `false` when the caller is not logged in.

### `GET /api/destinations/{slug}/` 🌐
Returns every field in the list item above, plus the following:
```json
{
  "description_en": "...",
  "description_bn": "...",
  "tips_en": "Carry cash; there are no ATMs.",
  "tips_bn": "...",
  "entry_fee_bdt": null,
  "latitude": "23.381900",
  "longitude": "92.293800",
  "images": [
    {
      "id": 14,
      "image": "/media/destinations/sajek-valley-1.jpg",
      "caption_en": "",
      "caption_bn": "",
      "credit": "Biplobkgc / CC BY-SA 3.0 / Wikimedia Commons",
      "is_cover": true,
      "order": 1
    }
  ],
  "stays": [ "...first 5 stays, same shape as /stays/" ],
  "attractions": [ "...same shape as /attractions/" ]
}
```

### `GET /api/destinations/{slug}/stays/` 🌐
Query params: `stay_type` (`budget` / `mid` / `luxury`).

Response `200`:
```json
[
  {
    "id": 11,
    "name": "Meghpunji Resort",
    "stay_type": "mid",
    "price_min_bdt": "3500.00",
    "price_max_bdt": "6000.00",
    "contact": "+8801XXXXXXXXX"
  }
]
```

### `GET /api/destinations/{slug}/attractions/` 🌐
Response `200`:
```json
[
  {
    "id": 3,
    "name_en": "Konglak Hill",
    "name_bn": "কংলাক পাহাড়",
    "description_en": "...",
    "description_bn": "...",
    "est_cost_bdt": "0.00",
    "duration_hrs": "2.0"
  }
]
```

### `GET /api/destinations/routes/` 🌐
Lists the ways to get from one district to another. Flights are not supported.

Query params:

| Param | Example | Notes |
|---|---|---|
| `from` | `dhaka` | district slug, **required** |
| `to` | `coxs-bazar` | district slug, **required** |
| `mode` | `train` | one of `car`, `train`, `launch`, `other` |

Response `200`:
```json
[
  {
    "id": 40,
    "from_district": { "id": 1, "slug": "dhaka", "name_en": "Dhaka", "name_bn": "ঢাকা" },
    "to_district": { "id": 22, "slug": "coxs-bazar", "name_en": "Cox's Bazar", "name_bn": "কক্সবাজার" },
    "mode": "train",
    "duration_hrs": "9.0",
    "cost_min_bdt": "700.00",
    "cost_max_bdt": "2500.00",
    "operators": "Bangladesh Railway (Cox's Bazar Express)",
    "notes": "Book 10 days ahead on the Rail Sheba app."
  }
]
```
If `from` or `to` is missing, the response is `400`.

---

## 3. `planner`
This is the Gemini chatbot plus saved trips. The Gemini API key stays on the server, and the frontend never calls Gemini directly.

### `GET /api/planner/chats/` 🔒
Lists the caller's chat sessions, newest first. Messages are not included.

Response `200`:
```json
[
  { "id": 14, "title": "3 days in Sylhet under 10k", "language": "en", "created_at": "2026-10-10T09:30:00Z", "updated_at": "2026-10-10T09:41:12Z" }
]
```

### `POST /api/planner/chats/` 🔒
Starts an empty session. The `title` is filled in from the first message.

Request:
```json
{ "language": "bn" }
```
`language` is optional and defaults to the caller's `profile.preferred_language`.

Response `201`:
```json
{ "id": 15, "title": "", "language": "bn", "messages": [], "created_at": "...", "updated_at": "..." }
```

### `GET /api/planner/chats/{id}/` 🔒
Returns the session with all its messages, oldest first.

Response `200`:
```json
{
  "id": 14,
  "title": "3 days in Sylhet under 10k",
  "language": "en",
  "messages": [
    { "id": 101, "role": "user", "text": "Plan 3 days in Sylhet for 2 people under 10,000 taka", "created_at": "..." },
    { "id": 102, "role": "model", "text": "## Day 1\n- Ratargul Swamp Forest ...", "created_at": "..." }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

### `PATCH /api/planner/chats/{id}/` 🔒
Renames a session or changes its language.

Request:
```json
{ "title": "Sylhet trip ideas" }
```
Response `200`: same shape as `GET /api/planner/chats/{id}/`.

### `DELETE /api/planner/chats/{id}/` 🔒
Deletes the session and its messages. Saved trips created from it are kept, because `source_message` is set to `null`. Response `204`.

### `POST /api/planner/chats/{id}/messages/` 🔒
Sends a user message. The server sends the session history to Gemini, stores both messages, and returns them. The reply is plain-text markdown, not structured JSON.

Request:
```json
{ "text": "Plan 3 days in Sylhet for 2 people under 10,000 taka" }
```
`text` is required, 1–2000 characters.

Response `201`:
```json
{
  "user_message": { "id": 101, "role": "user", "text": "Plan 3 days in Sylhet ...", "created_at": "..." },
  "reply": { "id": 102, "role": "model", "text": "## Day 1\n- Ratargul Swamp Forest ...", "created_at": "..." }
}
```
Errors:
- `502` `{ "detail": "The AI service is unavailable. Please try again." }` when the Gemini call fails. In that case the user message is **not** saved, so the frontend can retry with the same text.
- `429` when the caller exceeds the chat rate limit (DRF `UserRateThrottle`, for example 20 messages per minute).

### `GET /api/planner/trips/` 🔒
Lists the caller's saved trips (My Trips), newest first.

Response `200`:
```json
[
  {
    "id": 9,
    "title": "Sylhet 3-day plan",
    "start_date": "2026-11-14",
    "source_message": 102,
    "has_budget": true,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `POST /api/planner/trips/` 🔒
Saves an AI reply as a trip. When `source_message` is given and `content` is left out, the server copies the message text.

Request:
```json
{
  "source_message": 102,
  "title": "Sylhet 3-day plan",
  "content": "## Day 1\n- Ratargul Swamp Forest ...",
  "start_date": "2026-11-14"
}
```
`source_message` must be a `model` message in one of the caller's own sessions. Otherwise the response is `400`. `content` and `start_date` are optional.

Response `201`: same shape as `GET /api/planner/trips/{id}/`.

### `GET /api/planner/trips/{id}/` 🔒
Response `200`:
```json
{
  "id": 9,
  "title": "Sylhet 3-day plan",
  "content": "## Day 1\n- Ratargul Swamp Forest ...",
  "start_date": "2026-11-14",
  "source_message": 102,
  "budget": { "...": "same shape as GET .../budget/, or null if no budget yet" },
  "created_at": "...",
  "updated_at": "..."
}
```

### `PATCH /api/planner/trips/{id}/` 🔒
Request: any of `title`, `content` or `start_date`.
```json
{ "title": "Sylhet with family", "start_date": "2026-12-01" }
```
Response `200`: same shape as `GET /api/planner/trips/{id}/`.

### `DELETE /api/planner/trips/{id}/` 🔒
Deletes the trip together with its budget and expenses. Response `204`.

---

## 4. `budget`
Budget endpoints are nested under a saved trip, because each trip has at most one `TripBudget`.

### `GET /api/planner/trips/{id}/budget/` 🔒
Returns `404` if the trip has no budget yet.

Response `200`:
```json
{
  "total_budget_bdt": "10000.00",
  "travelers": 2,
  "spent": "6350.00",
  "remaining": "3650.00",
  "percent_used": 63.5,
  "per_person": "3175.00",
  "is_over_budget": false,
  "per_category": {
    "transport": "2400.00",
    "stay": "3000.00",
    "food": "950.00",
    "tickets": "0.00",
    "shopping": "0.00",
    "other": "0.00"
  },
  "expenses": [ "...same shape as the items in GET .../expenses/" ]
}
```
`spent`, `remaining`, `percent_used`, `per_person`, `is_over_budget` and `per_category` are computed by the serializer and are read-only. `per_person` is `spent / travelers`.

### `PUT /api/planner/trips/{id}/budget/` 🔒
Creates the budget, or replaces it if one already exists.

Request:
```json
{ "total_budget_bdt": "10000.00", "travelers": 2 }
```
`total_budget_bdt` must be ≥ 0. `travelers` must be ≥ 1 and defaults to `1`.

Response `200` if the budget was updated, or `201` if it was created. The body has the same shape as `GET .../budget/`.

### `PATCH /api/planner/trips/{id}/budget/` 🔒
Request: either field.
```json
{ "travelers": 3 }
```
Response `200`: same shape as `GET .../budget/`.

### `GET /api/planner/trips/{id}/budget/expenses/` 🔒
Query params: `category` (one of `transport`, `stay`, `food`, `tickets`, `shopping`, `other`).

Response `200`, newest `date` first:
```json
[
  {
    "id": 31,
    "category": "transport",
    "amount_bdt": "2400.00",
    "note": "Dhaka → Sylhet, Parabat Express x2",
    "date": "2026-11-14",
    "paid_by": "Rahim",
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `POST /api/planner/trips/{id}/budget/expenses/` 🔒
If the trip has no budget yet, the response is `400` `{ "detail": "Set a budget for this trip first." }`.

Request:
```json
{
  "category": "food",
  "amount_bdt": "450.00",
  "note": "Panshi Restaurant dinner",
  "date": "2026-11-14",
  "paid_by": "Karim"
}
```
`category` and `amount_bdt` (> 0) are required. `date` defaults to today. `note` and `paid_by` are optional.

Response `201`: the expense in the same shape as the list item.

### `PATCH /api/planner/trips/{id}/budget/expenses/{expense_id}/` 🔒
Request: any expense field.
```json
{ "amount_bdt": "500.00" }
```
Response `200`: the updated expense.

### `DELETE /api/planner/trips/{id}/budget/expenses/{expense_id}/` 🔒
Response `204`.

> After any expense change, call `GET .../budget/` again to refresh the totals. Alternatively, the expense endpoints can return the updated budget summary under a `budget` key. Pick one approach when implementing and update this file.

---

## 5. `reviews`

### `GET /api/destinations/{slug}/reviews/` 🌐 *(paginated)*
Query params: `ordering` (`-created_at` is the default, or `-rating`).

Each item in `results`:
```json
{
  "id": 77,
  "user": { "id": 7, "full_name": "Rahim Uddin" },
  "rating": 5,
  "text": "Woke up above the clouds. Go in November.",
  "is_mine": false,
  "created_at": "...",
  "updated_at": "..."
}
```
The user's email is never exposed.

### `POST /api/destinations/{slug}/reviews/` 🔒
Request:
```json
{ "rating": 5, "text": "Woke up above the clouds. Go in November." }
```
`rating` must be an integer from 1 to 5. `text` is optional.

Response `201`: the review in the same shape as the list item. A second review from the same user for the same destination returns `400` `{ "non_field_errors": ["You have already reviewed this destination."] }`.

### `PATCH /api/reviews/{id}/` 🔒 author only
Request:
```json
{ "rating": 4, "text": "Still great, but crowded on Fridays." }
```
Response `200`: the updated review. A user who is not the author gets `403`.

### `DELETE /api/reviews/{id}/` 🔒 author or staff
Response `204`.

### `GET /api/favorites/` 🔒
Lists the caller's bookmarked destinations, newest first.

Response `200`:
```json
[
  {
    "id": 4,
    "destination": { "...": "same shape as a GET /api/destinations/ list item" },
    "created_at": "..."
  }
]
```

### `POST /api/favorites/` 🔒
Request:
```json
{ "destination": "sajek-valley" }
```
`destination` is the destination slug.

Response `201`: the favorite in the same shape as the list item. If the destination is already a favorite, the response is `200` with the existing row, so the frontend can toggle safely.

### `DELETE /api/favorites/{destination_slug}/` 🔒
Removes the destination from favorites. Response `204`, or `404` if it was not a favorite.

---

## Setup notes for implementing this API

- `rest_framework`, `rest_framework_simplejwt` and `rest_framework_simplejwt.token_blacklist` are in `INSTALLED_APPS`. JWT settings are in `SIMPLE_JWT` in `core/settings.py`.
- Secrets come from `backend/.env` via `python-dotenv` (copy `.env.example`). The database is PostgreSQL (`psycopg`).
- Install `django-cors-headers` and allow the Vite dev origin `http://localhost:5173`. Another option is to proxy `/api` in `vite.config.js`.
- Install `django-filter` for the query-param filters, or filter by hand in `get_queryset`.
- Read the Gemini key from an environment variable such as `GEMINI_API_KEY` and never commit it.
- Install `Pillow` for `DestinationImage.image`. Set `MEDIA_URL = "/media/"` and `MEDIA_ROOT = BASE_DIR / "media"`, and serve `/media/` in development with `static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)`.
