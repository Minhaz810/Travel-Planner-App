# Backend — Data Models

Django 6.1 + Django REST Framework backend for the Bangladesh Travel Planner.

> **Status:** `accounts` and `destinations` are implemented (`Profile.home_district` is not added yet). The other apps are still **planned**. Update this file as models are implemented or changed.

## Apps at a glance

| App | Purpose | Models |
|---|---|---|
| `accounts` | Users and preferences | `User`, `Profile` |
| `destinations` | Bangladesh reference data | `Division`, `District`, `Destination`, `DestinationImage`, `Stay`, `Attraction`, `TransportRoute` |
| `planner` | AI chatbot (Gemini) and saved trips | `ChatSession`, `ChatMessage`, `SavedTrip` |
| `budget` | Budget tracker per saved trip | `TripBudget`, `Expense` |
| `reviews` | User feedback and bookmarks | `Review`, `Favorite` |

## Relationships

```
Division 1──* District 1──* Destination 1──* Stay
                  │               ├──* DestinationImage
                  │               ├──* Attraction
                  │               ├──* Review   *──1 User
                  │               └──* Favorite *──1 User
                  └── TransportRoute (from_district → to_district)

User 1──1 Profile
User 1──* ChatSession 1──* ChatMessage
User 1──* SavedTrip 1──1 TripBudget 1──* Expense
```

Conventions:
- Choices are module-level lists of tuples (e.g. `LANGUAGE_CHOICES = [("en", "English"), ...]`), not `TextChoices` classes.
- Text shown to users has `_en` and `_bn` variants (English and Bangla).
- All money is stored in **BDT** as `DecimalField(max_digits=10, decimal_places=2)`. The `_bdt` suffix marks money fields.
- Every model has `created_at` (`auto_now_add`). Editable models also have `updated_at` (`auto_now`). These are left out of the tables below.

---

## 1. `accounts`

### `User`
Django's built-in `django.contrib.auth.models.User` (no custom user model). Users log in with `username` + `password`. It provides `username`, `email`, `first_name`, `last_name`, `is_active`, `is_staff` and `date_joined`.

### `Profile`
| Field | Type | Notes |
|---|---|---|
| `user` | `OneToOneField(User)` | created automatically by a `post_save` signal |
| `preferred_language` | `CharField` choices `LANGUAGE_CHOICES` (`en` / `bn`) | default `en`. The UI uses it, and the chatbot replies in this language |
| `home_district` | `FK(District)`, nullable | default trip origin. **Not added yet**, waiting on `destinations` |
| `travel_style` | choices `TRAVEL_STYLE_CHOICES` (`budget` / `comfort` / `luxury`) | optional, blank |

---

## 2. `destinations`
Reference data maintained through Django Admin and loaded by `python manage.py seed_bd` from [seeder.json](seeder.json). The seed photos live in `media/destinations/`.

### `Division`
The 8 administrative divisions (Dhaka, Chattogram, Sylhet, Khulna, Rajshahi, Barishal, Rangpur, Mymensingh).

| Field | Type | Notes |
|---|---|---|
| `name_en` / `name_bn` | `CharField(50)` | |
| `slug` | `SlugField` | unique |

### `District`
The 64 districts.

| Field | Type | Notes |
|---|---|---|
| `division` | `FK(Division)` | `related_name="districts"` |
| `name_en` / `name_bn` | `CharField(50)` | |
| `slug` | `SlugField` | unique |

### `Destination`
A place worth visiting, such as Cox's Bazar, Sajek Valley, Ratargul, or the Sundarbans.

| Field | Type | Notes |
|---|---|---|
| `district` | `FK(District)` | `related_name="destinations"` |
| `name_en` / `name_bn` | `CharField(150)` | |
| `slug` | `SlugField` | unique, used in URLs |
| `category` | choices `beach`, `hill`, `forest`, `heritage`, `river`, `religious`, `city` | |
| `description_en` / `description_bn` | `TextField` | |
| `tips_en` / `tips_bn` | `TextField`, blank | safety and season tips |
| `best_months` | `JSONField` (list of 1–12) | e.g. `[11, 12, 1, 2]` |
| `avg_daily_cost_bdt` | `Decimal` | rough per-person daily cost |
| `entry_fee_bdt` | `Decimal`, nullable | |
| `latitude` / `longitude` | `Decimal(9,6)`, nullable | used for distance calculations only. There is no map integration |
| `tags` | `JSONField` (list of str) | e.g. `["trekking", "waterfall"]` |
| `is_featured` | `BooleanField` | shown on the home page |

### `DestinationImage`
A photo of a destination. Each destination has several, shown as a gallery. Staff add them as an inline in the Destination admin.

| Field | Type | Notes |
|---|---|---|
| `destination` | `FK(Destination)` | `related_name="images"`, `on_delete=CASCADE` |
| `image` | `ImageField(upload_to="destinations/")` | |
| `caption_en` / `caption_bn` | `CharField(200)`, blank | |
| `credit` | `CharField(255)`, blank | photographer and license, e.g. "Tanvir Rahat / CC BY-SA 4.0 / Wikimedia Commons". Must be shown next to Commons photos |
| `is_cover` | `BooleanField` | default `False`. The cover is the image used on cards and lists |
| `order` | `PositiveSmallIntegerField` | default `0`. Gallery order |

Meta: `ordering = ["order", "id"]`.

Constraint: at most one cover per destination, via `UniqueConstraint(fields=["destination"], condition=Q(is_cover=True), name="one_cover_per_destination")`. If a destination has no cover, the first image by `order` is used.

### `Stay`
A hotel, resort, or cottage at a destination.

| Field | Type | Notes |
|---|---|---|
| `destination` | `FK(Destination)` | `related_name="stays"` |
| `name` | `CharField(150)` | |
| `stay_type` | choices `budget` / `mid` / `luxury` | |
| `price_min_bdt` / `price_max_bdt` | `Decimal` | per night |
| `contact` | `CharField`, blank | phone or website |

### `Attraction`
A thing to do or see inside a destination, such as Nilgiri viewpoint or a boat ride in Ratargul.

| Field | Type | Notes |
|---|---|---|
| `destination` | `FK(Destination)` | `related_name="attractions"` |
| `name_en` / `name_bn` | `CharField(150)` | |
| `description_en` / `description_bn` | `TextField`, blank | |
| `est_cost_bdt` | `Decimal`, nullable | |
| `duration_hrs` | `Decimal(4,1)`, nullable | |

### `TransportRoute`
How to travel between two districts. **Flights are not supported.**

| Field | Type | Notes |
|---|---|---|
| `from_district` | `FK(District)` | `related_name="routes_from"` |
| `to_district` | `FK(District)` | `related_name="routes_to"` |
| `mode` | choices `car` / `train` / `launch` / `other` | `other` covers bus, CNG, boat, and similar |
| `duration_hrs` | `Decimal(4,1)` | |
| `cost_min_bdt` / `cost_max_bdt` | `Decimal` | per person |
| `operators` | `CharField`, blank | e.g. "Bangladesh Railway", "Green Line" |
| `notes` | `TextField`, blank | |

Constraint: `unique_together = (from_district, to_district, mode)`.

---

## 3. `planner`
A simple AI chatbot. Gemini replies with plain-text (markdown) trip suggestions, and the user can save any reply as a trip.

### `ChatSession`
| Field | Type | Notes |
|---|---|---|
| `user` | `FK(User)` | `related_name="chat_sessions"` |
| `title` | `CharField(150)` | set automatically from the first message |
| `language` | choices `en` / `bn` | |

### `ChatMessage`
| Field | Type | Notes |
|---|---|---|
| `session` | `FK(ChatSession)` | `related_name="messages"`, ordered by `created_at` |
| `role` | choices `user` / `model` | matches Gemini's chat roles |
| `text` | `TextField` | markdown for `model` replies |

### `SavedTrip`
An AI reply the user chose to keep. It is shown in My Trips.

| Field | Type | Notes |
|---|---|---|
| `user` | `FK(User)` | `related_name="saved_trips"` |
| `source_message` | `FK(ChatMessage)`, nullable, `SET_NULL` | the reply it came from |
| `title` | `CharField(150)` | editable |
| `content` | `TextField` | copy of the reply, so the trip survives if the chat is deleted |
| `start_date` | `DateField`, nullable | |

---

## 4. `budget`
A budget tracker attached to a saved trip.

### `TripBudget`
| Field | Type | Notes |
|---|---|---|
| `saved_trip` | `OneToOneField(SavedTrip)` | `related_name="budget"` |
| `total_budget_bdt` | `Decimal` | |
| `travelers` | `PositiveSmallIntegerField` | default `1`, used for the per-person split |

These values are computed in the serializer and not stored: `spent`, `remaining`, `percent_used`, `per_category` totals, `per_person`, `is_over_budget`.

### `Expense`
| Field | Type | Notes |
|---|---|---|
| `trip_budget` | `FK(TripBudget)` | `related_name="expenses"` |
| `category` | choices `transport` / `stay` / `food` / `tickets` / `shopping` / `other` | |
| `amount_bdt` | `Decimal` | must be > 0 |
| `note` | `CharField(200)`, blank | |
| `date` | `DateField` | default today |
| `paid_by` | `CharField(100)`, blank | optional traveler name |

---

## 5. `reviews`

### `Review`
| Field | Type | Notes |
|---|---|---|
| `user` | `FK(User)` | |
| `destination` | `FK(Destination)` | `related_name="reviews"` |
| `rating` | `PositiveSmallIntegerField` | 1–5 (validators) |
| `text` | `TextField`, blank | |

Constraint: one review per user per destination (`unique_together = (user, destination)`).

### `Favorite`
| Field | Type | Notes |
|---|---|---|
| `user` | `FK(User)` | `related_name="favorites"` |
| `destination` | `FK(Destination)` | |

Constraint: `unique_together = (user, destination)`.

---

## Access rules
- `destinations` data is public to read. Only staff can edit it, through the admin.
- `planner`, `budget`, and `favorites` data is visible only to its owner. Querysets are filtered by `request.user`.
- `Review`s are public to read. Only the author can edit or delete one.
