from decimal import Decimal, InvalidOperation

from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Destination, District, Division, TransportRoute
from .serializers import (
    AttractionSerializer,
    DestinationDetailSerializer,
    DestinationListSerializer,
    DistrictSerializer,
    DivisionSerializer,
    StaySerializer,
    TransportRouteSerializer,
)

# `-avg_rating` is documented too; it is added with the reviews app.
DESTINATION_ORDERING_FIELDS = ['avg_daily_cost_bdt', 'name_en']


class DivisionListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        divisions = Division.objects.order_by('name_en')
        return Response(DivisionSerializer(divisions, many=True).data)


class DistrictListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        districts = District.objects.order_by('name_en')
        division = request.query_params.get('division')
        if division:
            districts = districts.filter(division__slug=division)
        return Response(DistrictSerializer(districts, many=True).data)


class DestinationListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        params = request.query_params
        destinations = Destination.objects.select_related('district').prefetch_related('images')

        search = params.get('search', '').strip()
        if search:
            destinations = destinations.filter(
                Q(name_en__icontains=search) | Q(name_bn__icontains=search) | Q(tags__icontains=search)
            )
        if params.get('division'):
            destinations = destinations.filter(district__division__slug=params['division'])
        if params.get('district'):
            destinations = destinations.filter(district__slug=params['district'])
        if params.get('category'):
            destinations = destinations.filter(category=params['category'])
        if params.get('month'):
            month = params['month']
            if not month.isdigit() or not 1 <= int(month) <= 12:
                raise ValidationError({'month': ['Must be a number from 1 to 12.']})
            destinations = destinations.filter(best_months__contains=[int(month)])
        if params.get('max_daily_cost'):
            try:
                max_cost = Decimal(params['max_daily_cost'])
            except InvalidOperation:
                raise ValidationError({'max_daily_cost': ['Must be a number.']})
            destinations = destinations.filter(avg_daily_cost_bdt__lte=max_cost)
        if params.get('featured') == 'true':
            destinations = destinations.filter(is_featured=True)

        ordering = params.get('ordering', '')
        if ordering.lstrip('-') in DESTINATION_ORDERING_FIELDS:
            destinations = destinations.order_by(ordering, 'id')
        else:
            destinations = destinations.order_by('-is_featured', 'name_en')

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(destinations, request, view=self)
        serializer = DestinationListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class DestinationDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        destination = get_object_or_404(
            Destination.objects.select_related('district').prefetch_related('images', 'attractions'),
            slug=slug,
        )
        return Response(DestinationDetailSerializer(destination).data)


class DestinationStayListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        destination = get_object_or_404(Destination, slug=slug)
        stays = destination.stays.order_by('price_min_bdt')
        stay_type = request.query_params.get('stay_type')
        if stay_type:
            stays = stays.filter(stay_type=stay_type)
        return Response(StaySerializer(stays, many=True).data)


class DestinationAttractionListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        destination = get_object_or_404(Destination, slug=slug)
        return Response(AttractionSerializer(destination.attractions.all(), many=True).data)


class TransportRouteListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        params = request.query_params
        errors = {name: ['This query parameter is required.'] for name in ('from', 'to') if not params.get(name)}
        if errors:
            raise ValidationError(errors)

        routes = TransportRoute.objects.select_related('from_district', 'to_district').filter(
            from_district__slug=params['from'], to_district__slug=params['to'],
        ).order_by('duration_hrs')
        if params.get('mode'):
            routes = routes.filter(mode=params['mode'])
        return Response(TransportRouteSerializer(routes, many=True).data)
