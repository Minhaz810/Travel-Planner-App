from rest_framework import serializers

from .models import Attraction, Destination, DestinationImage, District, Division, Stay, TransportRoute


class DivisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Division
        fields = ['id', 'slug', 'name_en', 'name_bn']


class DistrictSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'slug', 'name_en', 'name_bn', 'division']


class DistrictBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = District
        fields = ['id', 'slug', 'name_en', 'name_bn']


class DestinationImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = DestinationImage
        fields = ['id', 'image', 'caption_en', 'caption_bn', 'credit', 'is_cover', 'order']

    def get_image(self, obj):
        return obj.image.url


class StaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Stay
        fields = ['id', 'name', 'stay_type', 'price_min_bdt', 'price_max_bdt', 'contact']


class AttractionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attraction
        fields = ['id', 'name_en', 'name_bn', 'description_en', 'description_bn', 'est_cost_bdt', 'duration_hrs']


class DestinationListSerializer(serializers.ModelSerializer):
    district = DistrictBriefSerializer(read_only=True)
    cover_image = serializers.SerializerMethodField()
    # TODO: compute these from the reviews app once it exists.
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Destination
        fields = [
            'id', 'slug', 'name_en', 'name_bn', 'category', 'district', 'cover_image', 'avg_daily_cost_bdt',
            'best_months', 'tags', 'is_featured', 'avg_rating', 'review_count', 'is_favorite',
        ]

    def get_cover_image(self, obj):
        # Uses the prefetched `images` (already sorted by order) to avoid a query per destination.
        images = list(obj.images.all())
        cover = next((img for img in images if img.is_cover), images[0] if images else None)
        return cover.image.url if cover else None

    def get_avg_rating(self, obj):
        return None

    def get_review_count(self, obj):
        return 0

    def get_is_favorite(self, obj):
        return False


class DestinationDetailSerializer(DestinationListSerializer):
    images = DestinationImageSerializer(many=True, read_only=True)
    stays = serializers.SerializerMethodField()
    attractions = AttractionSerializer(many=True, read_only=True)

    class Meta(DestinationListSerializer.Meta):
        fields = DestinationListSerializer.Meta.fields + [
            'description_en', 'description_bn', 'tips_en', 'tips_bn', 'entry_fee_bdt', 'latitude', 'longitude',
            'images', 'stays', 'attractions',
        ]

    def get_stays(self, obj):
        return StaySerializer(obj.stays.all()[:5], many=True).data


class TransportRouteSerializer(serializers.ModelSerializer):
    from_district = DistrictBriefSerializer(read_only=True)
    to_district = DistrictBriefSerializer(read_only=True)

    class Meta:
        model = TransportRoute
        fields = [
            'id', 'from_district', 'to_district', 'mode', 'duration_hrs', 'cost_min_bdt', 'cost_max_bdt',
            'operators', 'notes',
        ]
