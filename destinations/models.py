from django.db import models


CATEGORY_CHOICES = [
    ('beach', 'Beach'),
    ('hill', 'Hill'),
    ('forest', 'Forest'),
    ('heritage', 'Heritage'),
    ('river', 'River'),
    ('religious', 'Religious'),
    ('city', 'City'),
]

STAY_TYPE_CHOICES = [
    ('budget', 'Budget'),
    ('mid', 'Mid-range'),
    ('luxury', 'Luxury'),
]

# Flights are intentionally not supported.
TRANSPORT_MODE_CHOICES = [
    ('car', 'Car'),
    ('train', 'Train'),
    ('launch', 'Launch'),
    ('other', 'Other'),
]


class Division(models.Model):
    name_en = models.CharField(max_length=50)
    name_bn = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_en


class District(models.Model):
    division = models.ForeignKey(Division, on_delete=models.CASCADE, related_name='districts')
    name_en = models.CharField(max_length=50)
    name_bn = models.CharField(max_length=50)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name_en


class Destination(models.Model):
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='destinations')
    name_en = models.CharField(max_length=150)
    name_bn = models.CharField(max_length=150)
    slug = models.SlugField(unique=True)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    description_en = models.TextField()
    description_bn = models.TextField()
    tips_en = models.TextField(blank=True)
    tips_bn = models.TextField(blank=True)
    best_months = models.JSONField(default=list)
    avg_daily_cost_bdt = models.DecimalField(max_digits=10, decimal_places=2)
    entry_fee_bdt = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name_en


class DestinationImage(models.Model):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='destinations/')
    caption_en = models.CharField(max_length=200, blank=True)
    caption_bn = models.CharField(max_length=200, blank=True)
    credit = models.CharField(max_length=255, blank=True)
    is_cover = models.BooleanField(default=False)
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['destination'],
                condition=models.Q(is_cover=True),
                name='one_cover_per_destination',
            ),
        ]

    def __str__(self):
        return f'{self.destination.name_en} image {self.order}'


class Stay(models.Model):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='stays')
    name = models.CharField(max_length=150)
    stay_type = models.CharField(max_length=10, choices=STAY_TYPE_CHOICES)
    price_min_bdt = models.DecimalField(max_digits=10, decimal_places=2)
    price_max_bdt = models.DecimalField(max_digits=10, decimal_places=2)
    contact = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Attraction(models.Model):
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='attractions')
    name_en = models.CharField(max_length=150)
    name_bn = models.CharField(max_length=150)
    description_en = models.TextField(blank=True)
    description_bn = models.TextField(blank=True)
    est_cost_bdt = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    duration_hrs = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name_en


class TransportRoute(models.Model):
    from_district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='routes_from')
    to_district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='routes_to')
    mode = models.CharField(max_length=10, choices=TRANSPORT_MODE_CHOICES)
    duration_hrs = models.DecimalField(max_digits=4, decimal_places=1)
    cost_min_bdt = models.DecimalField(max_digits=10, decimal_places=2)
    cost_max_bdt = models.DecimalField(max_digits=10, decimal_places=2)
    operators = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('from_district', 'to_district', 'mode')

    def __str__(self):
        return f'{self.from_district} → {self.to_district} ({self.mode})'
