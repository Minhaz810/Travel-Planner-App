import json

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from destinations.models import Destination, DestinationImage, District, Division, Stay

SEED_FILE = settings.BASE_DIR / 'seeder.json'


class Command(BaseCommand):
    help = 'Load Bangladesh destinations data from seeder.json. Safe to run more than once.'

    @transaction.atomic
    def handle(self, *args, **options):
        data = json.loads(SEED_FILE.read_text(encoding='utf-8'))

        divisions = {}
        for row in data['divisions']:
            slug = row.pop('slug')
            divisions[slug], _ = Division.objects.update_or_create(slug=slug, defaults=row)

        districts = {}
        for row in data['districts']:
            slug = row.pop('slug')
            row['division'] = divisions[row['division']]
            districts[slug], _ = District.objects.update_or_create(slug=slug, defaults=row)

        destinations = {}
        for row in data['destinations']:
            slug = row.pop('slug')
            row['district'] = districts[row['district']]
            destinations[slug], _ = Destination.objects.update_or_create(slug=slug, defaults=row)

        for row in data['stays']:
            destination = destinations[row.pop('destination')]
            Stay.objects.update_or_create(destination=destination, name=row.pop('name'), defaults=row)

        # Clear covers first so a cover moving to another image doesn't hit the one-cover constraint.
        DestinationImage.objects.filter(destination__in=destinations.values()).update(is_cover=False)
        for row in data['destination_images']:
            destination = destinations[row.pop('destination')]
            DestinationImage.objects.update_or_create(destination=destination, image=row.pop('image'), defaults=row)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {len(divisions)} divisions, {len(districts)} districts, {len(destinations)} destinations, "
            f"{len(data['stays'])} stays and {len(data['destination_images'])} images."
        ))
